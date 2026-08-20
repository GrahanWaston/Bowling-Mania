// Real-time LAN & Online Multiplayer Network Manager
// Built-in HTTP SSE Relay + Local BroadcastChannel + WebRTC fallback

import Peer from 'peerjs';

export class NetworkManager {
  constructor() {
    this.peer = null;
    this.myPeerId = `peer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.roomCode = null;
    this.isHost = false;
    this.isPrivate = false;
    this.roomName = '';
    this.connections = new Map(); // peerId -> DataConnection
    this.broadcastChannel = null;
    this.eventSource = null;
    this.callbacks = {};
    this.localPlayer = null;
    this._announceInterval = null;
    this._joinRetryTimer = null;
  }

  init(localPlayer) {
    this.localPlayer = localPlayer;
    if (localPlayer && localPlayer.id) {
      this.myPeerId = localPlayer.id;
    }
    this._initBroadcastChannel();
  }

  _initBroadcastChannel() {
    if (this.broadcastChannel) return;
    try {
      this.broadcastChannel = new BroadcastChannel('neon_disco_bowling_lan_v3');
      this.broadcastChannel.onmessage = (event) => {
        const data = event.data;
        if (data && data.senderId !== this.myPeerId) {
          this._handleIncomingMessage(data, data.senderId || 'broadcast');
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported in this browser', e);
    }
  }

  /**
   * Connect to Vite built-in Real-time LAN SSE Relay
   */
  _connectLanRelay() {
    if (this.eventSource) {
      try { this.eventSource.close(); } catch (e) {}
      this.eventSource = null;
    }

    if (!this.roomCode) return;

    try {
      const pId = encodeURIComponent(this.localPlayer?.id || this.myPeerId);
      const rCode = encodeURIComponent(this.roomCode);
      const sseUrl = `/api/lan-events?room=${rCode}&playerId=${pId}`;

      const es = new EventSource(sseUrl);
      this.eventSource = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type !== 'LAN_CONNECTED') {
            if (data.senderId !== this.myPeerId) {
              this._handleIncomingMessage(data, data.senderId || 'lan-relay');
            }
          }
        } catch (e) {
          // ignore parse error
        }
      };

      es.onerror = () => {
        // SSE auto-reconnects natively
      };
    } catch (e) {
      console.info('LAN SSE Relay connection notice:', e);
    }
  }

  /**
   * Create a new multiplayer room as Host
   */
  createRoom(roomName = 'Disco Lounge', isPrivate = false, customCode = null) {
    this.isHost = true;
    this.isPrivate = isPrivate;
    this.roomName = roomName;
    this.roomCode = (customCode || this._generateRoomCode()).toUpperCase();

    this._initBroadcastChannel();
    this._connectLanRelay();
    this._startPublicAnnounce();

    // Initialize PeerJS asynchronously in background without blocking UI
    setTimeout(() => {
      this._initHostPeer();
    }, 100);

    return Promise.resolve(this.roomCode);
  }

  _initHostPeer() {
    const peerId = `disco-bowl-${this.roomCode.toLowerCase()}-${Math.random().toString(36).substr(2, 4)}`;
    try {
      if (this.peer) {
        try { this.peer.destroy(); } catch (e) {}
      }
      this.peer = new Peer(peerId, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        }
      });

      this.peer.on('open', (id) => {
        this.myPeerId = id;
      });

      this.peer.on('connection', (conn) => {
        this._setupConnection(conn);
      });
    } catch (e) {
      // Handled via LAN relay
    }
  }

  /**
   * Join an existing room with room code
   */
  joinRoom(roomCode, playerInfo) {
    this.isHost = false;
    this.roomCode = roomCode.toUpperCase().trim();

    this._initBroadcastChannel();
    this._connectLanRelay();

    // Send JOIN_REQUEST immediately and retry a few times to guarantee delivery
    const sendJoin = () => {
      this.broadcast('JOIN_REQUEST', {
        player: playerInfo || this.localPlayer,
        roomCode: this.roomCode,
        senderId: this.myPeerId
      });
    };

    // Immediate send
    setTimeout(sendJoin, 50);

    let retries = 0;
    if (this._joinRetryTimer) clearInterval(this._joinRetryTimer);
    this._joinRetryTimer = setInterval(() => {
      retries++;
      if (retries > 6 || this.isHost) {
        clearInterval(this._joinRetryTimer);
        this._joinRetryTimer = null;
      } else {
        sendJoin();
      }
    }, 450);

    return Promise.resolve(true);
  }

  _setupConnection(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data) => {
      this._handleIncomingMessage(data, conn.peer);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      if (this.callbacks['PLAYER_DISCONNECTED']) {
        this.callbacks['PLAYER_DISCONNECTED']({ peerId: conn.peer });
      }
    });
  }

  _handleIncomingMessage(message, senderId) {
    if (!message || !message.type) return;

    // Filter by room code if set
    if (message.roomCode && this.roomCode && message.roomCode !== this.roomCode) {
      if (message.type !== 'PUBLIC_ROOM_ANNOUNCE' && message.type !== 'DISCOVER_ROOMS') {
        return;
      }
    }

    // Auto-respond to room discovery if host
    if (message.type === 'DISCOVER_ROOMS' && this.isHost && !this.isPrivate) {
      this.broadcast('PUBLIC_ROOM_ANNOUNCE', {
        roomCode: this.roomCode,
        roomName: this.roomName,
        hostName: this.localPlayer?.name || 'Host',
        playerCount: this.connections.size + 1
      });
      return;
    }

    if (this.callbacks[message.type]) {
      this.callbacks[message.type](message.payload, senderId);
    }
  }

  /**
   * Broadcast message to LAN Relay, BroadcastChannel, and WebRTC
   */
  broadcast(type, payload = {}) {
    const msg = {
      type,
      payload,
      roomCode: this.roomCode,
      senderId: this.myPeerId,
      timestamp: Date.now()
    };

    // 1. Send to Vite Built-in LAN Relay (Instant LAN & WiFi sync across devices)
    try {
      fetch('/api/lan-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg)
      }).catch(() => {});
    } catch (e) {}

    // 2. Send via BroadcastChannel (local browser tabs)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch (e) {}
    }

    // 3. Send via WebRTC DataConnections if open
    this.connections.forEach(conn => {
      if (conn.open) {
        try {
          conn.send(msg);
        } catch (e) {}
      }
    });
  }

  sendTo(conn, type, payload = {}) {
    if (conn && conn.open) {
      try {
        conn.send({
          type,
          payload,
          roomCode: this.roomCode,
          senderId: this.myPeerId,
          timestamp: Date.now()
        });
      } catch (e) {}
    }
  }

  on(type, callback) {
    this.callbacks[type] = callback;
  }

  off(type) {
    delete this.callbacks[type];
  }

  _startPublicAnnounce() {
    if (this._announceInterval) {
      clearInterval(this._announceInterval);
    }
    if (!this.isPrivate && this.isHost) {
      this._announceInterval = setInterval(() => {
        if (this.isHost && !this.isPrivate && this.roomCode) {
          this.broadcast('PUBLIC_ROOM_ANNOUNCE', {
            roomCode: this.roomCode,
            roomName: this.roomName,
            hostName: this.localPlayer?.name || 'Host',
            playerCount: this.connections.size + 1
          });
        }
      }, 2000);
    }
  }

  discoverPublicRooms(onDiscovered) {
    this.on('PUBLIC_ROOM_ANNOUNCE', (payload) => {
      onDiscovered(payload);
    });
    this.broadcast('DISCOVER_ROOMS', {});
  }

  _generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  leaveRoom() {
    if (this.roomCode) {
      try {
        this.broadcast('PLAYER_LEFT', {
          playerId: this.localPlayer?.id || this.myPeerId,
          playerName: this.localPlayer?.name || 'Player'
        });
      } catch (e) {}
    }
    this.roomCode = null;
    this.isHost = false;
    if (this._announceInterval) {
      clearInterval(this._announceInterval);
      this._announceInterval = null;
    }
    if (this._joinRetryTimer) {
      clearInterval(this._joinRetryTimer);
      this._joinRetryTimer = null;
    }
    if (this.eventSource) {
      try { this.eventSource.close(); } catch (e) {}
      this.eventSource = null;
    }
    this.connections.forEach(conn => {
      try { conn.close(); } catch (e) {}
    });
    this.connections.clear();
  }

  disconnect() {
    this.leaveRoom();
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    if (this.broadcastChannel) {
      try { this.broadcastChannel.close(); } catch (e) {}
      this.broadcastChannel = null;
    }
  }
}

export const networkManager = new NetworkManager();
