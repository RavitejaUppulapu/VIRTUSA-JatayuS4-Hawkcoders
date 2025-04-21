import { EventEmitter } from "events";

interface WebSocketMessage {
  type: string;
  data: any;
}

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private eventEmitter: EventEmitter;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 5000; // 5 seconds

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.connect();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.REACT_APP_API_URL || window.location.host;
    return `${protocol}//${host}/ws/device-status`;
  }

  private connect(): void {
    try {
      const wsUrl = this.getWebSocketUrl();
      console.log("Connecting to WebSocket:", wsUrl);

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("WebSocket connection established");
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.eventEmitter.emit(message.type, message.data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.socket.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      setTimeout(() => this.connect(), this.reconnectTimeout);
    } else {
      console.error("Max reconnection attempts reached");
      this.eventEmitter.emit(
        "error",
        "Failed to establish WebSocket connection"
      );
    }
  }

  public subscribeToDeviceStatus(callback: (data: any) => void): void {
    this.eventEmitter.on("device_status", callback);
  }

  public subscribeToPredictions(callback: (data: any) => void): void {
    this.eventEmitter.on("predictions", callback);
  }

  public subscribeToEnvironmentalAlerts(callback: (data: any) => void): void {
    this.eventEmitter.on("environmental", callback);
  }

  public subscribeToSensorHealth(callback: (data: any) => void): void {
    this.eventEmitter.on("sensor_health", callback);
  }

  public unsubscribe(type: string, callback: (data: any) => void): void {
    this.eventEmitter.removeListener(type, callback);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.eventEmitter.removeAllListeners();
  }
}

export const webSocketService = WebSocketService.getInstance();
