"use client";

import { useEffect, useRef } from "react";

import { Message } from "@/components/rag-assistant/chat/Message";
import type { ChatMessage } from "@/lib/rag-assistant/types";

interface MessageListProps {
  messages: ChatMessage[];
  onRetry?: (text: string) => void | Promise<void>;
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages]);

  return (
    <div ref={containerRef} className="messages" id="messages">
      {messages.length === 0 ? (
        <div className="empty-state">
          <div className="msg assistant">
            <div className="msg-avatar avatar-ai">AI</div>
            <div className="msg-body">
              <div className="msg-sender">
                assistant
                <span className="ts">ready</span>
              </div>
              <div className="empty-title">Ask anything about your knowledge base</div>
              <div className="empty-copy">
                I will search indexed chunks, answer with citations, and keep the
                conversation history in sync with the backend.
              </div>
            </div>
          </div>
        </div>
      ) : (
        messages.map((message) => (
          <Message key={message.id} message={message} onRetry={onRetry} />
        ))
      )}
    </div>
  );
}
