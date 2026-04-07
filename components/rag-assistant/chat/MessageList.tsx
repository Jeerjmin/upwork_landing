"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { Message } from "@/components/rag-assistant/chat/Message";
import { isNearBottom } from "@/lib/rag-assistant/scroll";
import type { ChatMessage } from "@/lib/rag-assistant/types";

const PROMPT_SUGGESTIONS = [
  "Walk me through the key risk factors from the annual report",
  "Pull the exact net revenue figure for Q3 2025 and cite the source",
  "Cross-check operating margins across all quarterly reports",
  "What documents do you have access to and what can you extract?",
];

interface MessageListProps {
  messages: ChatMessage[];
  onRetry?: (text: string) => void | Promise<void>;
  onSend?: (text: string) => void | Promise<void>;
}

export function MessageList({ messages, onRetry, onSend }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFollowing, setIsFollowing] = useState(true);
  const [hasHiddenUpdate, setHasHiddenUpdate] = useState(false);
  const isStreaming = messages.some(
    (message) => message.role === "assistant" && message.isStreaming,
  );
  const visibleChangeKey = messages
    .map(
      (message) =>
        [
          message.id,
          message.content.length,
          message.status ?? "",
          message.sourceDetails?.length ?? 0,
          message.isStreaming ? 1 : 0,
          message.isError ? 1 : 0,
        ].join(":"),
    )
    .join("|");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateFollowingState = () => {
      const nextIsFollowing = isNearBottom({
        scrollTop: container.scrollTop,
        clientHeight: container.clientHeight,
        scrollHeight: container.scrollHeight,
      });

      setIsFollowing((current) =>
        current === nextIsFollowing ? current : nextIsFollowing,
      );

      if (nextIsFollowing) {
        setHasHiddenUpdate(false);
      }
    };

    updateFollowingState();
    container.addEventListener("scroll", updateFollowingState, {
      passive: true,
    });

    return () => {
      container.removeEventListener("scroll", updateFollowingState);
    };
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (isFollowing) {
      container.scrollTop = container.scrollHeight;
      setHasHiddenUpdate(false);
      return;
    }

    if (messages.length > 0) {
      setHasHiddenUpdate(true);
    }
  }, [isFollowing, messages.length, visibleChangeKey]);

  function jumpToLatest() {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
    setIsFollowing(true);
    setHasHiddenUpdate(false);
  }

  return (
    <div className="messages-shell">
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
                <div className="empty-title">Agentic RAG over your financial docs</div>
                <div className="prompt-cards">
                  {PROMPT_SUGGESTIONS.map((prompt) => (
                    <button
                      key={prompt}
                      className="prompt-card"
                      type="button"
                      onClick={() => {
                        if (onSend) {
                          void onSend(prompt);
                        }
                      }}
                    >
                      {prompt}
                    </button>
                  ))}
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

      {hasHiddenUpdate ? (
        <button className="jump-latest" type="button" onClick={jumpToLatest}>
          <span>Jump to latest</span>
          <span className="jump-latest-meta">
            {isStreaming ? "Streaming..." : "New content below"}
          </span>
        </button>
      ) : null}
    </div>
  );
}
