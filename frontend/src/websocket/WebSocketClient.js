export default class WebSocketClient {
  constructor(url, scene, hooks = {}) {
    this.url = url;
    this.scene = scene;
    this.socket = null;
    this.isConnected = false;
    this.reconnectTimer = null;
    this.hooks = hooks;
  }

  connect() {
    try {
      this.socket = new WebSocket(this.url);
    } catch (error) {
      this.hooks.onError?.(error);
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      this.isConnected = true;
      this.hooks.onOpen?.();
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Invalid WebSocket payload', error);
      }
    };

    this.socket.onclose = () => {
      this.isConnected = false;
      this.hooks.onClose?.();
      this.scheduleReconnect();
    };

    this.socket.onerror = (error) => {
      this.isConnected = false;
      this.hooks.onError?.(error);
    };
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 3000);
  }

  handleMessage(message) {
    switch (message.type) {
      case 'AGENT_STATUS_UPDATE':
        this.scene.events.emit('agentStatusUpdate', message.payload);
        break;
      case 'OFFICE_EVENT':
        this.scene.events.emit('officeEvent', message.payload);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
