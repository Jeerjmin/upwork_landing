import { describe, expect, it } from "vitest";

import { createInitialRagChatState, ragChatReducer } from "./state";

describe("ragChatReducer", () => {
  it("buffers chunk text until a flush action arrives", () => {
    const requested = ragChatReducer(createInitialRagChatState(), {
      type: "message_requested",
      userMessageId: "user-1",
      assistantMessageId: "assistant-1",
      text: "Summarize the report",
      createdAt: "2026-03-29T10:00:00.000Z",
    });

    const chunked = ragChatReducer(requested, {
      type: "chunk_received",
      text: "Revenue rose",
    });

    expect(chunked.messages[1]?.content).toBe("");
    expect(chunked.messages[1]?.pendingContent).toBe("Revenue rose");
    expect(chunked.messages[1]?.status).toBe("loading");
  });

  it("flushes buffered chunk text into the visible message", () => {
    const flushed = ragChatReducer(
      ragChatReducer(
        ragChatReducer(createInitialRagChatState(), {
          type: "message_requested",
          userMessageId: "user-1",
          assistantMessageId: "assistant-1",
          text: "Summarize the report",
          createdAt: "2026-03-29T10:00:00.000Z",
        }),
        {
          type: "chunk_received",
          text: "Revenue rose",
        },
      ),
      {
        type: "stream_flushed",
      },
    );

    expect(flushed.messages[1]?.content).toBe("Revenue rose");
    expect(flushed.messages[1]?.pendingContent).toBe("");
    expect(flushed.messages[1]?.status).toBe("ready");
  });

  it("records agent_search steps before answer chunks arrive", () => {
    const requested = ragChatReducer(createInitialRagChatState(), {
      type: "message_requested",
      userMessageId: "user-1",
      assistantMessageId: "assistant-1",
      text: "Compare Apple and Microsoft AI investment",
      createdAt: "2026-03-29T10:00:00.000Z",
    });

    const traced = ragChatReducer(requested, {
      type: "agent_search_received",
      event: {
        type: "agent_search",
        iteration: 1,
        query: "Apple AI investment",
        focus: "comparison",
        rationale: "Gather Apple evidence",
        status: "started",
      },
    });

    expect(traced.activeTrace).toEqual([
      expect.objectContaining({
        iteration: 1,
        status: "started",
      }),
    ]);
    expect(traced.messages[1]?.trace).toEqual(traced.activeTrace);
  });

  it("attaches the finalized trace to the assistant message on done", () => {
    const withTrace = {
      ...createInitialRagChatState(),
      activeAssistantMessageId: "assistant-1",
      activeTrace: [
        {
          iteration: 1,
          query: "Apple AI investment",
          focus: "comparison" as const,
          rationale: "Gather Apple evidence",
          status: "completed" as const,
          resultCount: 1,
          topDocuments: ["Apple-2024-Annual-Report.pdf"],
        },
      ],
      messages: [
        {
          id: "assistant-1",
          role: "assistant" as const,
          content: "Apple is increasing AI investment.",
          pendingContent: " It is prioritizing infrastructure.",
          createdAt: "2026-03-29T10:00:00.000Z",
          status: "ready" as const,
        },
      ],
    };

    const completed = ragChatReducer(withTrace, {
      type: "done_received",
      event: {
        type: "done",
        conversationId: "conv-1",
        sources: [],
        confidence: 0.7,
        hasSources: true,
        isLowConfidence: false,
        latencyMs: 4123,
      },
    });

    expect(completed.messages[0]?.trace).toEqual(withTrace.activeTrace);
    expect(completed.messages[0]?.content).toBe(
      "Apple is increasing AI investment. It is prioritizing infrastructure.",
    );
    expect(completed.messages[0]?.pendingContent).toBe("");
    expect(completed.activeTrace).toEqual([]);
  });

  it("keeps the search trace on the assistant message when an error arrives", () => {
    const failed = ragChatReducer(
      {
        ...createInitialRagChatState(),
        activeAssistantMessageId: "assistant-1",
        activeTrace: [
          {
            iteration: 1,
            query: "Big tech capex growth",
            focus: "trend",
            rationale: "Gather capex evidence",
            status: "completed",
            resultCount: 0,
            topDocuments: [],
          },
        ],
        messages: [
          {
            id: "assistant-1",
            role: "assistant",
            content: "Partial answer",
            pendingContent: " with buffered tail",
            createdAt: "2026-03-29T10:00:00.000Z",
            status: "loading",
            isStreaming: true,
          },
        ],
        isStreaming: true,
      },
      {
        type: "error_received",
        event: {
          type: "error",
          message: "Request failed",
        },
      },
    );

    expect(failed.messages[0]?.status).toBe("error");
    expect(failed.messages[0]?.content).toBe(
      "Partial answer with buffered tail\n\nRequest failed",
    );
    expect(failed.messages[0]?.pendingContent).toBe("");
    expect(failed.messages[0]?.trace).toEqual([
      expect.objectContaining({
        query: "Big tech capex growth",
      }),
    ]);
    expect(failed.activeTrace).toEqual([]);
  });
});
