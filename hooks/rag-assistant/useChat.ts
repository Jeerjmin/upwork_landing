"use client";

import { useEffect, useReducer, useRef } from "react";

import {
  createInitialRagChatState,
  ragChatReducer,
} from "@/lib/rag-assistant/state";
import { useWebSocket } from "./useWebSocket";

const STREAM_FLUSH_DELAY_MS = 120;

export function useChat() {
  const { send, subscribe, subscribeStatus } = useWebSocket();
  const [state, dispatch] = useReducer(
    ragChatReducer,
    undefined,
    createInitialRagChatState,
  );
  const activeAssistantMessageIdRef = useRef<string | null>(null);
  const streamFlushTimeoutRef = useRef<number | null>(null);

  const activeAssistantMessage = state.activeAssistantMessageId
    ? state.messages.find((message) => message.id === state.activeAssistantMessageId) ??
      null
    : null;
  const hasPendingContent = Boolean(activeAssistantMessage?.pendingContent);

  useEffect(() => {
    activeAssistantMessageIdRef.current = state.activeAssistantMessageId;
  }, [state.activeAssistantMessageId]);

  useEffect(
    () => () => {
      if (streamFlushTimeoutRef.current === null) {
        return;
      }

      window.clearTimeout(streamFlushTimeoutRef.current);
      streamFlushTimeoutRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!state.isStreaming || !hasPendingContent || streamFlushTimeoutRef.current !== null) {
      return;
    }

    streamFlushTimeoutRef.current = window.setTimeout(() => {
      streamFlushTimeoutRef.current = null;
      dispatch({ type: "stream_flushed" });
    }, STREAM_FLUSH_DELAY_MS);
  }, [hasPendingContent, state.isStreaming]);

  useEffect(() => {
    return subscribe((message) => {
      if (message.type === "agent_search") {
        dispatch({ type: "agent_search_received", event: message });
        return;
      }

      if (message.type === "chunk") {
        dispatch({ type: "chunk_received", text: message.text });
        return;
      }

      if (message.type === "done") {
        if (streamFlushTimeoutRef.current !== null) {
          window.clearTimeout(streamFlushTimeoutRef.current);
          streamFlushTimeoutRef.current = null;
        }
        dispatch({ type: "done_received", event: message });
        return;
      }

      if (message.type === "error") {
        if (streamFlushTimeoutRef.current !== null) {
          window.clearTimeout(streamFlushTimeoutRef.current);
          streamFlushTimeoutRef.current = null;
        }
        dispatch({ type: "error_received", event: message });
      }
    });
  }, [subscribe]);

  useEffect(() => {
    return subscribeStatus((connected) => {
      if (connected || !activeAssistantMessageIdRef.current) {
        return;
      }

      if (streamFlushTimeoutRef.current !== null) {
        window.clearTimeout(streamFlushTimeoutRef.current);
        streamFlushTimeoutRef.current = null;
      }
      dispatch({ type: "connection_lost" });
    });
  }, [subscribeStatus]);

  async function sendMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || state.isStreaming) {
      return;
    }

    const userMessageId = createId();
    const assistantMessageId = createId();
    const createdAt = new Date().toISOString();

    dispatch({
      type: "message_requested",
      userMessageId,
      assistantMessageId,
      text: trimmed,
      createdAt,
    });

    const wasSent = send({
      action: "chat",
      message: trimmed,
      conversationId: state.conversationId ?? undefined,
    });

    if (!wasSent) {
      dispatch({
        type: "error_received",
        event: {
          type: "error",
          message:
            "WebSocket is not connected. Please wait for reconnection and try again.",
        },
      });
    }
  }

  return {
    conversationId: state.conversationId,
    messages: state.messages,
    isStreaming: state.isStreaming,
    sendMessage,
  };
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2);
}
