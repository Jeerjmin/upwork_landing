"use client";

import { useEffect, useRef, useState } from "react";

import type { ChatMessage } from "@/lib/rag-assistant/types";
import { useWebSocket } from "./useWebSocket";

export function useChat() {
  const { send, subscribe, subscribeStatus } = useWebSocket();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingIdRef = useRef<string | null>(null);

  useEffect(() => {
    return subscribe((message) => {
      if (message.type === "chunk") {
        setMessages((current) => {
          const lastMessage = current[current.length - 1];
          if (
            lastMessage?.role === "assistant" &&
            lastMessage.id === streamingIdRef.current
          ) {
            return [
              ...current.slice(0, -1),
              {
                ...lastMessage,
                content: lastMessage.content + message.text,
                status: "ready",
                isStreaming: true,
                isError: false,
              },
            ];
          }

          return current;
        });
      }

      if (message.type === "done") {
        setConversationId(message.conversationId);
        setIsStreaming(false);
        setMessages((current) =>
          current.map((currentMessage) =>
            currentMessage.id === streamingIdRef.current
              ? {
                  ...currentMessage,
                  status: "ready",
                  isStreaming: false,
                  isError: false,
                  sources: message.sources.map((source) => source.name),
                  sourceDetails: message.sources,
                  confidence: message.confidence,
                  latencyMs: message.latencyMs,
                }
              : currentMessage,
          ),
        );
        streamingIdRef.current = null;
      }

      if (message.type === "error") {
        setIsStreaming(false);
        setMessages((current) =>
          current.map((currentMessage) =>
            currentMessage.id === streamingIdRef.current
              ? {
                  ...currentMessage,
                  content: buildErrorContent(
                    message.message,
                    message.partialText ?? currentMessage.content,
                  ),
                  status: "error",
                  isStreaming: false,
                  isError: true,
                  confidence: 0,
                  latencyMs: 0,
                }
              : currentMessage,
          ),
        );
        streamingIdRef.current = null;
      }
    });
  }, [subscribe]);

  useEffect(() => {
    return subscribeStatus((connected) => {
      if (connected || !streamingIdRef.current) {
        return;
      }

      const activeMessageId = streamingIdRef.current;
      streamingIdRef.current = null;
      setIsStreaming(false);

      setMessages((current) =>
        current.map((message) =>
          message.id === activeMessageId
            ? {
                ...message,
                content: buildErrorContent(
                  "Connection lost while waiting for the response. Please try again.",
                  message.content,
                ),
                status: "error",
                isStreaming: false,
                isError: true,
                confidence: 0,
                latencyMs: 0,
              }
            : message,
        ),
      );
    });
  }, [subscribeStatus]);

  async function sendMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) {
      return;
    }

    const userMessageId = createId();
    const assistantMessageId = createId();
    const createdAt = new Date().toISOString();

    streamingIdRef.current = assistantMessageId;
    setIsStreaming(true);
    setMessages((current) => [
      ...current,
      {
        id: userMessageId,
        role: "user",
        content: trimmed,
        createdAt,
        status: "ready",
      },
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        status: "loading",
        isStreaming: true,
        isError: false,
        retryText: trimmed,
      },
    ]);

    const wasSent = send({
      action: "chat",
      message: trimmed,
      conversationId: conversationId ?? undefined,
    });

    if (!wasSent) {
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                content: buildErrorContent(
                  "WebSocket is not connected. Please wait for reconnection and try again.",
                ),
                status: "error",
                isStreaming: false,
                isError: true,
                confidence: 0,
                latencyMs: 0,
              }
            : message,
        ),
      );
      streamingIdRef.current = null;
      setIsStreaming(false);
    }
  }

  return {
    conversationId,
    messages,
    isStreaming,
    sendMessage,
  };
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}

function buildErrorContent(message: string, partialText?: string): string {
  const normalizedPartial = partialText?.trim();

  if (!normalizedPartial) {
    return message;
  }

  return `${normalizedPartial}\n\n${message}`;
}
