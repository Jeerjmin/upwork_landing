import type { ReactNode } from "react";

import { AgentTrace } from "@/components/rag-assistant/chat/AgentTrace";
import { ConfidenceBar } from "@/components/rag-assistant/chat/ConfidenceBar";
import { SourceChip } from "@/components/rag-assistant/chat/SourceChip";
import { SourceCite } from "@/components/rag-assistant/chat/SourceCite";
import {
  normalizeAssistantMessageContent,
  parseAssistantMarkdown,
  type AssistantMarkdownBlock,
} from "@/lib/rag-assistant/message-content";
import type { ChatMessage } from "@/lib/rag-assistant/types";

interface MessageProps {
  message: ChatMessage;
  onRetry?: (text: string) => void | Promise<void>;
}

export function Message({ message, onRetry }: MessageProps) {
  const assistantLoading = message.role === "assistant" && message.status === "loading";
  const assistantError =
    message.role === "assistant" &&
    (message.status === "error" || message.isError === true);
  const assistantStreaming = message.role === "assistant" && message.isStreaming;
  const sender = message.role === "assistant" ? "assistant" : "you";
  const showSkeleton = assistantLoading && !message.content;

  return (
    <div className={`msg ${message.role} ${assistantError ? "msg-error" : ""}`}>
      <div
        className={`msg-avatar ${
          message.role === "assistant" ? "avatar-ai" : "avatar-user"
        }`}
      >
        {message.role === "assistant" ? "AI" : "YO"}
      </div>

      <div className="msg-body">
        <div className="msg-sender">
          {sender}
          <span className="ts">{formatMessageTime(message.createdAt)}</span>
          {message.role === "assistant" && message.latencyMs ? (
            <span className="badge badge-green">{message.latencyMs}ms</span>
          ) : null}
          {assistantStreaming ? <span className="badge badge-blue">streaming</span> : null}
          {assistantLoading && !assistantStreaming ? (
            <span className="badge badge-blue">thinking</span>
          ) : null}
          {assistantError ? <span className="badge badge-red">error</span> : null}
        </div>

        {message.trace && message.trace.length > 0 ? (
          <AgentTrace trace={message.trace} />
        ) : null}

        <div className="msg-text">
          {showSkeleton ? (
            <div className="loading-lines" aria-label="Loading answer">
              <span className="loading-line" />
              <span className="loading-line loading-line-short" />
            </div>
          ) : (
            renderMessageContent(message)
          )}
        </div>

        {assistantError && message.retryText && onRetry ? (
          <div className="msg-actions">
            <button
              className="retry-btn"
              type="button"
              onClick={() => {
                void onRetry(message.retryText ?? "");
              }}
            >
              Try again
            </button>
          </div>
        ) : null}

        {message.sourceDetails && message.sourceDetails.length > 0 ? (
          <div className="sources-row">
            <span className="sources-row-label">SOURCES</span>
            {message.sourceDetails.map((source) => (
              <SourceChip key={source.name} name={source.name} score={source.score} />
            ))}
          </div>
        ) : null}

        <ConfidenceBar value={message.confidence} />
      </div>
    </div>
  );
}

function renderMessageContent(message: ChatMessage) {
  if (message.role !== "assistant") {
    return renderUserMessageContent(message);
  }

  const blocks = parseAssistantMarkdown(message.content);

  if (blocks.length === 0) {
    return (
      <p>
        {renderInlineTokens(normalizeAssistantMessageContent(message.content))}
        {message.isStreaming ? <span className="stream-cursor" /> : null}
      </p>
    );
  }

  return blocks.map((block, index) =>
    renderAssistantBlock(
      message.id,
      index,
      block,
      message.isStreaming === true && index === blocks.length - 1,
    ),
  );
}

function renderUserMessageContent(message: ChatMessage) {
  const paragraphs = message.content.split(/\n{2,}/).filter(Boolean);

  if (paragraphs.length === 0) {
    return (
      <p>
        {message.content}
        {message.isStreaming ? <span className="stream-cursor" /> : null}
      </p>
    );
  }

  return paragraphs.map((paragraph, index) => (
    <p key={`${message.id}-${index}`}>
      {paragraph}
      {message.isStreaming && index === paragraphs.length - 1 ? (
        <span className="stream-cursor" />
      ) : null}
    </p>
  ));
}

function renderAssistantBlock(
  messageId: string,
  blockIndex: number,
  block: AssistantMarkdownBlock,
  showCursor: boolean,
) {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

      return (
        <Tag key={`${messageId}-${block.type}-${blockIndex}`}>
          {renderInlineTokens(block.text)}
          {showCursor ? <span className="stream-cursor" /> : null}
        </Tag>
      );
    }

    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";

      return (
        <ListTag key={`${messageId}-${block.type}-${blockIndex}`}>
          {block.items.map((item, index) => (
            <li key={`${messageId}-${block.type}-${index}`}>
              {renderInlineTokens(item)}
              {showCursor && index === block.items.length - 1 ? (
                <span className="stream-cursor" />
              ) : null}
            </li>
          ))}
        </ListTag>
      );
    }

    case "rule":
      return (
        <div key={`${messageId}-${block.type}-${blockIndex}`} className="msg-rule">
          <hr />
          {showCursor ? <span className="stream-cursor" /> : null}
        </div>
      );

    case "table":
      return renderAssistantTable(messageId, blockIndex, block, showCursor);

    case "paragraph":
      return (
        <p key={`${messageId}-${block.type}-${blockIndex}`}>
          {renderInlineTokens(block.text)}
          {showCursor ? <span className="stream-cursor" /> : null}
        </p>
      );
  }
}

function renderAssistantTable(
  messageId: string,
  blockIndex: number,
  block: Extract<AssistantMarkdownBlock, { type: "table" }>,
  showCursor: boolean,
) {
  const hasRows = block.rows.length > 0;
  const lastRowIndex = block.rows.length - 1;
  const lastHeaderIndex = block.headers.length - 1;

  return (
    <div
      key={`${messageId}-${block.type}-${blockIndex}`}
      className="msg-table-wrap"
    >
      <table className="msg-table">
        <thead>
          <tr>
            {block.headers.map((header, index) => (
              <th key={`${messageId}-${block.type}-head-${index}`} scope="col">
                {renderInlineTokens(header)}
                {showCursor && !hasRows && index === lastHeaderIndex ? (
                  <span className="stream-cursor" />
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        {hasRows ? (
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr
                key={`${messageId}-${block.type}-row-${rowIndex}`}
                className={
                  block.isPartialLastRow && rowIndex === lastRowIndex
                    ? "msg-table-row-partial"
                    : undefined
                }
              >
                {row.map((cell, cellIndex) => (
                  <td key={`${messageId}-${block.type}-cell-${rowIndex}-${cellIndex}`}>
                    {renderInlineTokens(cell)}
                    {showCursor &&
                    rowIndex === lastRowIndex &&
                    cellIndex === row.length - 1 ? (
                      <span className="stream-cursor" />
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ) : null}
      </table>
    </div>
  );
}

function renderInlineTokens(text: string) {
  const normalized = normalizeAssistantMessageContent(text);
  const tokenPattern = /\[source:\s*([^\]]+)\]|\*\*([^*]+)\*\*/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match = tokenPattern.exec(normalized);

  while (match) {
    if (match.index > lastIndex) {
      parts.push(...renderTextWithLineBreaks(normalized.slice(lastIndex, match.index)));
    }

    if (match[1] !== undefined) {
      parts.push(
        <SourceCite
          key={`${match.index}-${match[1]}`}
          value={match[1]}
        />,
      );
    } else if (match[2] !== undefined) {
      parts.push(
        <strong key={`${match.index}-${match[2]}`}>{match[2]}</strong>,
      );
    }

    lastIndex = match.index + match[0].length;
    match = tokenPattern.exec(normalized);
  }

  if (lastIndex < normalized.length) {
    parts.push(...renderTextWithLineBreaks(normalized.slice(lastIndex)));
  }

  if (parts.length > 0) {
    return parts;
  }

  const lines = renderTextWithLineBreaks(normalized);
  return lines.length === 1 ? lines[0] : lines;
}
function renderTextWithLineBreaks(text: string): ReactNode[] {
  return text.split("\n").flatMap((line, index, lines) => {
    if (index === lines.length - 1) {
      return [line];
    }

    return [line, <br key={`br-${index}-${line.length}`} />];
  });
}

function formatMessageTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
