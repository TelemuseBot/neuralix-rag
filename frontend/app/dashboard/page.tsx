"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, clearToken } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";

type Doc = { id: number; filename: string; file_type: string; num_chunks: number; status: string };
type Convo = { id: number; title: string };
type Citation = { index: number; filename: string; chunk_index: number; score: number; excerpt: string };
type Message = { id: number | string; role: "user" | "assistant"; content: string; citations?: Citation[] };

export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [conversations, setConversations] = useState<Convo[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploading, setUploading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const loadAll = useCallback(async () => {
    const [me, docs, convos] = await Promise.all([api.me(), api.listDocuments(), api.listConversations()]);
    setUserEmail(me.email);
    setDocuments(docs);
    setConversations(convos);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("neuralix_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    loadAll()
      .then(() => setAuthChecked(true))
      .catch(() => {
        clearToken();
        router.replace("/login");
      });
  }, [loadAll, router]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      setDocuments((prev) => [doc, ...prev]);
    } catch (err: any) {
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(id: number) {
    await api.deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  async function handleSelectConversation(id: number) {
    setActiveConversationId(id);
    const msgs = await api.getMessages(id);
    setMessages(
      msgs.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        citations: m.citations ? JSON.parse(m.citations) : undefined,
      }))
    );
  }

  async function handleDeleteConversation(id: number) {
    await api.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }

  function handleNewChat() {
    setActiveConversationId(null);
    setMessages([]);
  }

  async function handleSend(text: string) {
    const userMsg: Message = { id: `local-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const res = await api.chat(text, activeConversationId ?? undefined);
      setActiveConversationId(res.conversation_id);
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}-a`, role: "assistant", content: res.answer, citations: res.citations },
      ]);
      const convos = await api.listConversations();
      setConversations(convos);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: `local-${Date.now()}-e`, role: "assistant", content: `Error: ${err.message || "Something went wrong"}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-electric-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-base-950">
      <Sidebar
        documents={documents}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onUpload={handleUpload}
        onDeleteDocument={handleDeleteDocument}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewChat={handleNewChat}
        onLogout={handleLogout}
        uploading={uploading}
        userEmail={userEmail}
      />
      <ChatWindow
        messages={messages}
        onSend={handleSend}
        loading={chatLoading}
        hasDocuments={documents.some((d) => d.status === "ready")}
      />
    </div>
  );
}
