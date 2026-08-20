"use client";

import { useEffect, useRef, useState } from "react";
import { Send, FileText, Loader2, Sparkles } from "lucide-react";

type Citation = {
  index: number;
  filename: string;
  chunk_index: number;
  score: number;
  excerpt: string;
};

type Message = {
  id: number | string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

function renderWithCitations(text: string, citations?: Citation[]) {
  if (!citations || citations.length === 0) return text;
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const idx = parseInt(match[1], 10);
      const cite = citations.find((c) => c.index === idx);
      if (cite) {
        return (
          <span
            key={i}
            title={`${cite.filename} — chunk ${cite.chunk_index}`}
            className="inline-flex items-center justify-center text-[10px] font-mono bg-signal/10 text-signal border border-signal/30 rounded px-1 mx-0.5 cursor-help"
          >
            {idx}
          </span>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatWindow({
  messages,
  onSend,
  loading,
  hasDocuments,
}: {
  messages: Message[];
  onSend: (text: string) => void;
  loading: boolean;
  hasDocuments: boolean;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  }

  return (
    <div className="flex flex-col h-screen flex-1">
      <div className="flex-1 overflow-y-auto px-8 py-8">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-electric-400" />
            </div>
            <h2 className="font-display text-xl text-white mb-2">Ask your documents</h2>
            <p className="text-sm text-base-600">
              {hasDocuments
                ? "Every answer is grounded in your uploaded documents, with citations linking back to the exact source."
                : "Upload a PDF, DOCX, or TXT file from the sidebar to get started."}
            </p>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-electric-500 text-white"
                    : "bg-base-900 border border-base-700 text-base-200"
                }`}
              >
                <p className="whitespace-pre-wrap">{renderWithCitations(m.content, m.citations)}</p>

                {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-base-700 space-y-1.5">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-base-600">Sources</p>
                    {m.citations.map((c) => (
                      <div key={c.index} className="flex items-start gap-2 text-xs text-base-600">
                        <span className="font-mono text-signal shrink-0">[{c.index}]</span>
                        <FileText className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="truncate">{c.filename}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-base-900 border border-base-700 rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-electric-400 animate-spin" />
                <span className="text-xs text-base-600 font-mono">retrieving + generating...</span>
              </div>
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-base-700 px-8 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasDocuments ? "Ask a question about your documents..." : "Upload a document first..."}
            disabled={!hasDocuments || loading}
            className="flex-1 bg-base-900 border border-base-700 rounded-lg px-4 py-3 text-sm text-white placeholder-base-600 focus:border-electric-500 focus:outline-none disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !hasDocuments}
            className="bg-electric-500 hover:bg-electric-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg p-3 transition-colors shadow-glow"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
