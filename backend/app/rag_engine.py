import os
import json
import pickle
import numpy as np
import faiss
from google import genai
from google.genai import types

from app.parsing import extract_text, chunk_text

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
STORAGE_DIR = os.getenv("STORAGE_DIR", "./storage")

EMBED_MODEL = "text-embedding-004"  # Gemini embedding model, free tier
GEN_MODEL = "gemini-2.0-flash"      # fast + free-tier friendly

_client = None


def get_client() -> genai.Client:
    global _client
    if _client is None:
        if not GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not set. Add it to your .env file.")
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


def _user_dir(user_id: int) -> str:
    path = os.path.join(STORAGE_DIR, f"user_{user_id}")
    os.makedirs(path, exist_ok=True)
    return path


def _index_paths(user_id: int):
    base = _user_dir(user_id)
    return os.path.join(base, "index.faiss"), os.path.join(base, "meta.pkl")


def embed_texts(texts: list[str], task_type: str = "RETRIEVAL_DOCUMENT") -> np.ndarray:
    """Batch-embed a list of texts using Gemini embeddings. Returns float32 array."""
    client = get_client()
    vectors = []
    # Gemini embedding API accepts one text at a time reliably at free tier;
    # batch in small groups to stay within request limits.
    for text in texts:
        result = client.models.embed_content(
            model=EMBED_MODEL,
            contents=text,
            config=types.EmbedContentConfig(task_type=task_type),
        )
        vectors.append(result.embeddings[0].values)
    return np.array(vectors, dtype="float32")


def _load_index(user_id: int):
    index_path, meta_path = _index_paths(user_id)
    if not os.path.exists(index_path):
        return None, []
    index = faiss.read_index(index_path)
    with open(meta_path, "rb") as f:
        meta = pickle.load(f)
    return index, meta


def _save_index(user_id: int, index, meta: list[dict]):
    index_path, meta_path = _index_paths(user_id)
    faiss.write_index(index, index_path)
    with open(meta_path, "wb") as f:
        pickle.dump(meta, f)


def process_document(user_id: int, document_id: int, file_path: str, file_type: str, filename: str) -> int:
    """
    Extract, chunk, embed, and add a document into the user's FAISS index.
    Returns number of chunks added. Designed to handle large docs by chunking.
    """
    raw_text = extract_text(file_path, file_type)
    chunks = chunk_text(raw_text, chunk_size=900, overlap=150)
    if not chunks:
        return 0

    embeddings = embed_texts(chunks, task_type="RETRIEVAL_DOCUMENT")
    faiss.normalize_L2(embeddings)

    index, meta = _load_index(user_id)
    if index is None:
        dim = embeddings.shape[1]
        index = faiss.IndexFlatIP(dim)  # cosine similarity via normalized inner product
        meta = []

    index.add(embeddings)
    for i, chunk in enumerate(chunks):
        meta.append({
            "document_id": document_id,
            "filename": filename,
            "chunk_index": i,
            "text": chunk,
        })

    _save_index(user_id, index, meta)
    return len(chunks)


def retrieve(user_id: int, query: str, top_k: int = 5) -> list[dict]:
    index, meta = _load_index(user_id)
    if index is None or index.ntotal == 0:
        return []

    query_vec = embed_texts([query], task_type="RETRIEVAL_QUERY")
    faiss.normalize_L2(query_vec)

    scores, indices = index.search(query_vec, min(top_k, index.ntotal))
    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx == -1:
            continue
        item = dict(meta[idx])
        item["score"] = float(score)
        results.append(item)
    return results


def generate_answer(query: str, context_chunks: list[dict], history: list[dict]) -> dict:
    """
    Generate an answer grounded in retrieved chunks, with inline citation markers
    like [1], [2] mapped back to source documents.
    """
    client = get_client()

    if not context_chunks:
        context_block = "No relevant documents found in the knowledge base."
    else:
        context_block = "\n\n".join(
            f"[{i + 1}] (source: {c['filename']}, chunk {c['chunk_index']})\n{c['text']}"
            for i, c in enumerate(context_chunks)
        )

    history_block = ""
    if history:
        history_block = "\n".join(f"{h['role']}: {h['content']}" for h in history[-6:])

    system_prompt = (
        "You are Neuralix RAG, a document Q&A assistant. Answer the user's question "
        "using ONLY the provided context chunks. Cite sources inline using [1], [2] etc. "
        "matching the chunk numbers given. If the answer isn't in the context, say so clearly "
        "instead of guessing. Be concise and direct."
    )

    prompt = (
        f"{system_prompt}\n\n"
        f"Conversation so far:\n{history_block}\n\n"
        f"Context chunks:\n{context_block}\n\n"
        f"Question: {query}\n\nAnswer:"
    )

    response = client.models.generate_content(
        model=GEN_MODEL,
        contents=prompt,
    )

    answer_text = response.text or ""
    citations = [
        {
            "index": i + 1,
            "filename": c["filename"],
            "chunk_index": c["chunk_index"],
            "score": c["score"],
            "excerpt": c["text"][:220],
        }
        for i, c in enumerate(context_chunks)
    ]

    return {"answer": answer_text, "citations": citations}


def delete_document_from_index(user_id: int, document_id: int) -> None:
    """Rebuild the index excluding a given document's chunks."""
    index, meta = _load_index(user_id)
    if index is None:
        return

    keep_meta = [m for m in meta if m["document_id"] != document_id]
    if not keep_meta:
        index_path, meta_path = _index_paths(user_id)
        for p in (index_path, meta_path):
            if os.path.exists(p):
                os.remove(p)
        return

    texts = [m["text"] for m in keep_meta]
    embeddings = embed_texts(texts, task_type="RETRIEVAL_DOCUMENT")
    faiss.normalize_L2(embeddings)

    dim = embeddings.shape[1]
    new_index = faiss.IndexFlatIP(dim)
    new_index.add(embeddings)
    _save_index(user_id, new_index, keep_meta)
