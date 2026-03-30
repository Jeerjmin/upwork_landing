import type { AgentTraceStep, ChatMessage, WsServerMessage } from "./types";

export interface RagChatState {
  conversationId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  activeAssistantMessageId: string | null;
  activeTrace: AgentTraceStep[];
}

export function createInitialRagChatState(): RagChatState {
  return {
    conversationId: null,
    messages: [],
    isStreaming: false,
    activeAssistantMessageId: null,
    activeTrace: [],
  };
}

export type RagChatAction =
  | {
      type: "message_requested";
      userMessageId: string;
      assistantMessageId: string;
      text: string;
      createdAt: string;
    }
  | {
      type: "agent_search_received";
      event: Extract<WsServerMessage, { type: "agent_search" }>;
    }
  | { type: "chunk_received"; text: string }
  | { type: "done_received"; event: Extract<WsServerMessage, { type: "done" }> }
  | {
      type: "error_received";
      event: Extract<WsServerMessage, { type: "error" }>;
    }
  | { type: "connection_lost" };

export function ragChatReducer(
  state: RagChatState,
  action: RagChatAction,
): RagChatState {
  switch (action.type) {
    case "message_requested":
      return {
        ...state,
        isStreaming: true,
        activeAssistantMessageId: action.assistantMessageId,
        activeTrace: [],
        messages: [
          ...state.messages,
          {
            id: action.userMessageId,
            role: "user",
            content: action.text,
            createdAt: action.createdAt,
            status: "ready",
          },
          {
            id: action.assistantMessageId,
            role: "assistant",
            content: "",
            createdAt: action.createdAt,
            status: "loading",
            isStreaming: true,
            isError: false,
            retryText: action.text,
            trace: [],
          },
        ],
      };

    case "agent_search_received": {
      const nextTrace = mergeTraceStep(state.activeTrace, action.event);

      return {
        ...state,
        activeTrace: nextTrace,
        messages: patchActiveAssistantMessage(
          state.messages,
          state.activeAssistantMessageId,
          (message) => ({
            ...message,
            trace: nextTrace,
          }),
        ),
      };
    }

    case "chunk_received":
      return {
        ...state,
        messages: patchActiveAssistantMessage(
          state.messages,
          state.activeAssistantMessageId,
          (message) => ({
            ...message,
            content: message.content + action.text,
            status: "ready",
            isStreaming: true,
            isError: false,
            trace: state.activeTrace,
          }),
        ),
      };

    case "done_received":
      return {
        ...state,
        conversationId: action.event.conversationId,
        isStreaming: false,
        activeAssistantMessageId: null,
        activeTrace: [],
        messages: patchActiveAssistantMessage(
          state.messages,
          state.activeAssistantMessageId,
          (message) => ({
            ...message,
            status: "ready",
            isStreaming: false,
            isError: false,
            sources: action.event.sources.map((source) => source.name),
            sourceDetails: action.event.sources,
            confidence: action.event.confidence,
            latencyMs: action.event.latencyMs,
            trace: state.activeTrace,
          }),
        ),
      };

    case "error_received":
      return {
        ...state,
        isStreaming: false,
        activeAssistantMessageId: null,
        activeTrace: [],
        messages: patchActiveAssistantMessage(
          state.messages,
          state.activeAssistantMessageId,
          (message) => ({
            ...message,
            content: buildErrorContent(
              action.event.message,
              action.event.partialText ?? message.content,
            ),
            status: "error",
            isStreaming: false,
            isError: true,
            confidence: 0,
            latencyMs: 0,
            trace: state.activeTrace,
          }),
        ),
      };

    case "connection_lost":
      return {
        ...state,
        isStreaming: false,
        activeAssistantMessageId: null,
        activeTrace: [],
        messages: patchActiveAssistantMessage(
          state.messages,
          state.activeAssistantMessageId,
          (message) => ({
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
            trace: state.activeTrace,
          }),
        ),
      };

    default:
      return state;
  }
}

function mergeTraceStep(
  current: AgentTraceStep[],
  next: AgentTraceStep,
): AgentTraceStep[] {
  const existingIndex = current.findIndex(
    (step) => step.iteration === next.iteration,
  );

  if (existingIndex === -1) {
    return [...current, next];
  }

  return current.map((step, index) =>
    index === existingIndex ? { ...step, ...next } : step,
  );
}

function patchActiveAssistantMessage(
  messages: ChatMessage[],
  activeAssistantMessageId: string | null,
  updater: (message: ChatMessage) => ChatMessage,
): ChatMessage[] {
  if (!activeAssistantMessageId) {
    return messages;
  }

  return messages.map((message) =>
    message.id === activeAssistantMessageId ? updater(message) : message,
  );
}

function buildErrorContent(message: string, partialText?: string): string {
  const normalizedPartial = partialText?.trim();

  if (!normalizedPartial) {
    return message;
  }

  return `${normalizedPartial}\n\n${message}`;
}
