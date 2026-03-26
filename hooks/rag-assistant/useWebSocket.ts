"use client";

import { useEffect, useState } from "react";

import type { WsServerMessage } from "@/lib/rag-assistant/types";

type WsHandler = (message: WsServerMessage) => void;
type StatusHandler = (connected: boolean) => void;

class WebSocketManager {
  private socket: WebSocket | null = null;
  private readonly handlers = new Set<WsHandler>();
  private readonly statusHandlers = new Set<StatusHandler>();
  private reconnectTimer: number | null = null;
  private retainCount = 0;
  private connected = false;

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

  subscribe(handler: WsHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  subscribeStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.connected);

    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  send(data: object): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }

    return false;
  }

  isConnected(): boolean {
    return this.connected;
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
      this.connected = true;
      this.emitStatus();
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WsServerMessage;
        this.handlers.forEach((handler) => {
          handler(message);
        });
      } catch {
        console.error("WS parse error", event.data);
      }
    };

    socket.onerror = (error) => {
      console.error("WS error", error);
    };

    socket.onclose = () => {
      this.socket = null;
      this.connected = false;
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

    this.connected = false;
    this.emitStatus();
  }

  private emitStatus(): void {
    this.statusHandlers.forEach((handler) => {
      handler(this.connected);
    });
  }
}

const manager = new WebSocketManager();

function send(data: object): boolean {
  return manager.send(data);
}

function subscribe(handler: WsHandler): () => void {
  return manager.subscribe(handler);
}

function subscribeStatus(handler: StatusHandler): () => void {
  return manager.subscribeStatus(handler);
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(manager.isConnected());

  useEffect(() => {
    const release = manager.retain();
    const unsubscribeStatus = manager.subscribeStatus(setIsConnected);

    return () => {
      unsubscribeStatus();
      release();
    };
  }, []);

  return {
    send,
    subscribe,
    subscribeStatus,
    isConnected,
  };
}
