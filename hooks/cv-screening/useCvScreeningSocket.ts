"use client";

import { useCallback, useEffect, useState } from "react";

import type { CvScreeningSocketEvent } from "@/lib/cv-screening/types";

interface CvSocketStatus {
  isConnected: boolean;
  connectionId: string | null;
}

type EventHandler = (message: CvScreeningSocketEvent) => void;
type StatusHandler = (status: CvSocketStatus) => void;

class CvScreeningSocketManager {
  private socket: WebSocket | null = null;
  private readonly handlers = new Set<EventHandler>();
  private readonly statusHandlers = new Set<StatusHandler>();
  private reconnectTimer: number | null = null;
  private retainCount = 0;
  private isConnected = false;
  private connectionId: string | null = null;

  retain(): () => void {
    this.retainCount += 1;
    this.connect();

    return () => {
      this.retainCount = Math.max(0, this.retainCount - 1);
      if (this.retainCount === 0) {
        this.teardown();
      }
    };
  }

  subscribe(handler: EventHandler): () => void {
    this.handlers.add(handler);

    return () => {
      this.handlers.delete(handler);
    };
  }

  subscribeStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.getStatus());

    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  getStatus(): CvSocketStatus {
    return {
      isConnected: this.isConnected,
      connectionId: this.connectionId,
    };
  }

  private connect(): void {
    if (typeof window === "undefined" || this.socket) {
      return;
    }

    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) {
      console.error("NEXT_PUBLIC_WS_URL is not set");
      return;
    }

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.isConnected = true;
      this.emitStatus();
      socket.send(JSON.stringify({ action: "init" }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as unknown;

        if (isConnectionReadyEvent(message)) {
          this.connectionId = message.connectionId;
          this.emitStatus();
          this.emit(message);
          return;
        }

        if (isCvScreeningEvent(message)) {
          this.emit(message);
        }
      } catch {
        console.error("CV screening WS parse error", event.data);
      }
    };

    socket.onerror = (error) => {
      console.error("CV screening WS error", error);
    };

    socket.onclose = () => {
      this.socket = null;
      this.isConnected = false;
      this.connectionId = null;
      this.emitStatus();

      if (this.retainCount > 0 && this.reconnectTimer === null) {
        this.reconnectTimer = window.setTimeout(() => {
          this.reconnectTimer = null;
          this.connect();
        }, 3000);
      }
    };
  }

  private teardown(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const socket = this.socket;
    this.socket = null;

    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      socket.close();
    }

    this.isConnected = false;
    this.connectionId = null;
    this.emitStatus();
  }

  private emit(message: CvScreeningSocketEvent): void {
    this.handlers.forEach((handler) => {
      handler(message);
    });
  }

  private emitStatus(): void {
    const status = this.getStatus();
    this.statusHandlers.forEach((handler) => {
      handler(status);
    });
  }
}

const manager = new CvScreeningSocketManager();

export function useCvScreeningSocket() {
  const [status, setStatus] = useState(manager.getStatus());

  const subscribe = useCallback((handler: EventHandler) => {
    return manager.subscribe(handler);
  }, []);

  const subscribeStatus = useCallback((handler: StatusHandler) => {
    return manager.subscribeStatus(handler);
  }, []);

  useEffect(() => {
    const release = manager.retain();
    const unsubscribeStatus = manager.subscribeStatus(setStatus);

    return () => {
      unsubscribeStatus();
      release();
    };
  }, []);

  return {
    subscribe,
    subscribeStatus,
    isConnected: status.isConnected,
    connectionId: status.connectionId,
  };
}

function isConnectionReadyEvent(
  value: unknown,
): value is Extract<CvScreeningSocketEvent, { type: "connection_ready" }> {
  return (
    isRecord(value) &&
    value.type === "connection_ready" &&
    typeof value.connectionId === "string"
  );
}

function isCvScreeningEvent(value: unknown): value is CvScreeningSocketEvent {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  return [
    "connection_ready",
    "analysis_started",
    "analysis_progress",
    "analysis_partial",
    "analysis_completed",
    "analysis_failed",
  ].includes(value.type);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
