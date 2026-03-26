import type { ReactNode } from "react";

import { ConfidenceBar } from "@/components/rag-assistant/chat/ConfidenceBar";
import { SourceChip } from "@/components/rag-assistant/chat/SourceChip";
import { SourceCite } from "@/components/rag-assistant/chat/SourceCite";
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
            <span className="badge badge-blue">searching</span>
          ) : null}
          {assistantError ? <span className="badge badge-red">error</span> : null}
        </div>

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
  const paragraphs = message.content.split(/\n{2,}/).filter(Boolean);

  if (paragraphs.length === 0) {
    return (
      <p>
        {message.role === "assistant"
          ? renderParagraph(message.content)
          : message.content}
        {message.isStreaming ? <span className="stream-cursor" /> : null}
      </p>
    );
  }

  return paragraphs.map((paragraph, index) => (
    <p key={`${message.id}-${index}`}>
      {message.role === "assistant" ? renderParagraph(paragraph) : paragraph}
      {message.isStreaming && index === paragraphs.length - 1 ? (
        <span className="stream-cursor" />
      ) : null}
    </p>
  ));
}

function renderParagraph(text: string) {
  const tokenPattern = /\[source:\s*([^\]]+)\]|\*\*([^*]+)\*\*/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match = tokenPattern.exec(text);

  while (match) {
    if (match.index > lastIndex) {
      parts.push(...renderTextWithLineBreaks(text.slice(lastIndex, match.index)));
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
    match = tokenPattern.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push(...renderTextWithLineBreaks(text.slice(lastIndex)));
  }

  if (parts.length > 0) {
    return parts;
  }

  const lines = renderTextWithLineBreaks(text);
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
