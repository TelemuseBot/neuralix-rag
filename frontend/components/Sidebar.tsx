"use client";

import { useRef, useState } from "react";
import { FileText, Upload, Trash2, MessageSquare, Loader2, LogOut, CheckCircle2, XCircle } from "lucide-react";

type Doc = {
  id: number;
  filename: string;
  file_type: string;
  num_chunks: number;
  status: string;
};

type Convo = {
  id: number;
  title: string;
};

export default function Sidebar({
  documents,
  conversations,
  activeConversationId,
  onUpload,
  onDeleteDocument,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  onLogout,
  uploading,
  userEmail,
}: {
  documents: Doc[];
  conversations: Convo[];
  activeConversationId: number | null;
  onUpload: (file: File) => void;
  onDeleteDocument: (id: number) => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
  onNewChat: () => void;
  onLogout: () => void;
  uploading: boolean;
  userEmail: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    onUpload(files[0]);
  }

  return (
    <aside className="w-80 shrink-0 border-r border-base-700 bg-base-900/60 flex flex-col h-screen">
      <div className="px-5 py-5 border-b border-base-700 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-electric-500 shadow-glow" />
        <span className="font-display font-semibold text-white text-sm tracking-tight">Neuralix RAG</span>
      </div>

      {/* Upload zone */}
      <div className="px-4 pt-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border border-dashed px-4 py-5 text-center transition-colors ${
            dragOver ? "border-electric-500 bg-electric-500/5" : "border-base-700 hover:border-base-600"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? (
            <Loader2 className="w-5 h-5 mx-auto text-electric-400 animate-spin mb-1.5" />
          ) : (
            <Upload className="w-5 h-5 mx-auto text-base-600 mb-1.5" />
          )}
          <p className="text-xs text-base-600">
            {uploading ? "Processing..." : "Drop PDF, DOCX, or TXT"}
          </p>
        </div>
      </div>

      {/* Documents list */}
      <div className="px-4 pt-4">
        <p className="text-[11px] font-mono uppercase tracking-widest text-base-600 mb-2 px-1">
          Documents ({documents.length})
        </p>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-base-800 text-sm"
            >
              <FileText className="w-3.5 h-3.5 text-base-600 shrink-0" />
              <span className="flex-1 truncate text-base-300 text-xs" title={doc.filename}>
                {doc.filename}
              </span>
              {doc.status === "ready" && <CheckCircle2 className="w-3.5 h-3.5 text-signal shrink-0" />}
              {doc.status === "processing" && <Loader2 className="w-3.5 h-3.5 text-electric-400 animate-spin shrink-0" />}
              {doc.status === "failed" && <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
              <button
                onClick={() => onDeleteDocument(doc.id)}
                className="opacity-0 group-hover:opacity-100 text-base-600 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-xs text-base-600 px-2.5 py-2 italic">No documents yet</p>
          )}
        </div>
      </div>

      {/* Conversations */}
      <div className="px-4 pt-5 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-[11px] font-mono uppercase tracking-widest text-base-600">Conversations</p>
          <button
            onClick={onNewChat}
            className="text-[11px] font-mono text-electric-400 hover:text-electric-300"
          >
            + new
          </button>
        </div>
        <div className="space-y-1">
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectConversation(c.id)}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                activeConversationId === c.id ? "bg-electric-500/10 text-electric-300" : "hover:bg-base-800 text-base-300"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 truncate text-xs">{c.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-base-600 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-base-700 flex items-center justify-between">
        <span className="text-xs text-base-600 truncate">{userEmail}</span>
        <button onClick={onLogout} className="text-base-600 hover:text-red-400 transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
