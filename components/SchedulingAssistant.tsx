"use client";

import { useEffect, useState, useRef } from "react";
import type { SchedulingRequest } from "@/lib/scheduling";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  requestId?: string;
  suggestedTimes?: string[];
};

export default function SchedulingAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "Hi! I'm your scheduling assistant. Tell me what you need to schedule — for example, \"Schedule a plumber for next week\" or \"Find time for an electrician to come look at the basement.\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<SchedulingRequest[]>(
    []
  );
  const [loadingPending, setLoadingPending] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [alternativeTime, setAlternativeTime] = useState("");
  const [alternativeNote, setAlternativeNote] = useState("");
  const [showAlternativeFor, setShowAlternativeFor] = useState<string | null>(
    null
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPending();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadPending() {
    setLoadingPending(true);
    try {
      const res = await fetch("/api/scheduling");
      const data = await res.json();
      const pending = (data.requests ?? []).filter(
        (r: SchedulingRequest) => r.status === "pending"
      );
      setPendingRequests(pending);
    } catch {
      // ignore
    } finally {
      setLoadingPending(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    const thinkingMsg: ChatMessage = {
      id: "thinking",
      role: "system",
      content: "Checking calendar and finding available times...",
    };
    setMessages((prev) => [...prev, thinkingMsg]);

    try {
      const res = await fetch("/api/scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content, requestedBy: "Michael" }),
      });
      const data = await res.json();

      setMessages((prev) => prev.filter((m) => m.id !== "thinking"));

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Sorry, something went wrong: ${data.error}`,
          },
        ]);
      } else {
        const req: SchedulingRequest = data.request;
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Got it! I've found some available windows for **${data.summary}**. I'll notify Tony to confirm. Here are the suggested times:`,
            requestId: req.id,
            suggestedTimes: req.suggestedTimes,
          },
        ]);
        setPendingRequests((prev) => [req, ...prev]);
      }
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "thinking"),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function respond(
    requestId: string,
    action: "approved" | "declined" | "alternative",
    confirmedTime?: string,
    note?: string
  ) {
    setRespondingId(requestId);
    try {
      await fetch("/api/scheduling/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action, confirmedTime, note }),
      });
      setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
      setShowAlternativeFor(null);
      setAlternativeTime("");
      setAlternativeNote("");
    } catch {
      // ignore
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Chat Panel */}
      <section className="bg-white rounded-2xl border border-gray-200 flex flex-col h-[500px]">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Scheduling Assistant</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Describe what you need to schedule
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "system" ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                  <span className="inline-block w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                  {msg.content}
                </div>
              ) : msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-green-600 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%]">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5 items-start">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-sm shrink-0">
                    🏠
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="bg-gray-50 border border-gray-100 text-sm rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[90%]">
                      {msg.content.split("**").map((part, i) =>
                        i % 2 === 1 ? (
                          <strong key={i}>{part}</strong>
                        ) : (
                          <span key={i}>{part}</span>
                        )
                      )}
                    </div>
                    {msg.suggestedTimes && msg.suggestedTimes.length > 0 && (
                      <div className="space-y-1.5 pl-1">
                        {msg.suggestedTimes.map((t, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-gray-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2"
                          >
                            <span className="text-green-600">📅</span>
                            <span>{t}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="e.g. Schedule a plumber for next week..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-300"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="text-sm bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        </div>
      </section>

      {/* Pending Approvals Panel */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Pending Approvals</h2>
          {pendingRequests.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 font-medium px-2 py-0.5 rounded-full">
              {pendingRequests.length} waiting
            </span>
          )}
        </div>

        {loadingPending ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">✅</div>
            <p className="text-sm text-gray-400">No pending scheduling requests.</p>
          </div>
        ) : (
          <div className="space-y-5 overflow-y-auto max-h-[420px] pr-1">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="border border-amber-100 bg-amber-50 rounded-xl p-4 space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                      From {req.requestedBy}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 mt-1 font-medium">
                    {req.message}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">
                    Suggested windows:
                  </p>
                  <div className="space-y-1">
                    {req.suggestedTimes.map((t, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs text-gray-700"
                      >
                        <span className="text-gray-400">•</span>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>

                {showAlternativeFor === req.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={alternativeTime}
                      onChange={(e) => setAlternativeTime(e.target.value)}
                      placeholder="Your preferred time (e.g. Friday June 13, 3–5 PM)"
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                    <input
                      type="text"
                      value={alternativeNote}
                      onChange={(e) => setAlternativeNote(e.target.value)}
                      placeholder="Optional note for Michael"
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          respond(
                            req.id,
                            "alternative",
                            alternativeTime,
                            alternativeNote
                          )
                        }
                        disabled={respondingId === req.id || !alternativeTime.trim()}
                        className="flex-1 text-xs bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Suggest this time
                      </button>
                      <button
                        onClick={() => setShowAlternativeFor(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-3"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        respond(req.id, "approved", req.suggestedTimes[0])
                      }
                      disabled={respondingId === req.id}
                      className="flex-1 text-xs bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {respondingId === req.id ? "..." : "✓ Approve"}
                    </button>
                    <button
                      onClick={() => setShowAlternativeFor(req.id)}
                      disabled={respondingId === req.id}
                      className="flex-1 text-xs bg-white border border-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Suggest alternative
                    </button>
                    <button
                      onClick={() => respond(req.id, "declined")}
                      disabled={respondingId === req.id}
                      className="text-xs text-gray-400 hover:text-red-500 px-2 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
