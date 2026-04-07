"use client";

import { useRef, useState } from "react";

interface InputAreaProps {
  isLoading: boolean;
  onSend(text: string): Promise<void>;
}

export function InputArea({ isLoading, onSend }: InputAreaProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSend(): Promise<void> {
    const trimmed = value.trim();
    if (!trimmed || isLoading) {
      return;
    }

    await onSend(trimmed);
    setValue("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  return (
    <div className="input-area">
      <div className="input-wrap">
        <textarea
          ref={textareaRef}
          className="input-field"
          placeholder="Ask a question…"
          rows={1}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          onInput={(event) => {
            const target = event.currentTarget;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSend();
            }
          }}
        />
        <button
          className="send-btn"
          onClick={() => {
            void handleSend();
          }}
          disabled={isLoading}
          type="button"
        >
          <SendIcon />
        </button>
      </div>
      <div className="input-hints">
        <span className="hint">
          <kbd className="kbd">↵</kbd> send
        </span>
        <span className="hint">
          <kbd className="kbd">Shift+↵</kbd> new line
        </span>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3.25 8H12.75M8.75 4L12.75 8L8.75 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
