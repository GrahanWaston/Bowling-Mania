import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Built-in Real-time LAN Multiplayer Signaling & Event Relay
function lanMultiplayerPlugin() {
  const roomClients = new Map(); // roomCode -> Set of { res, playerId }

  return {
    name: 'lan-multiplayer-relay',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost');

        // 1. SSE Connection for Real-time LAN Events
        if (url.pathname === '/api/lan-events') {
          const roomCode = (url.searchParams.get('room') || '').toUpperCase();
          const playerId = url.searchParams.get('playerId') || 'anon';

          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });
          res.write('retry: 1000\n\n');
          res.write(`data: ${JSON.stringify({ type: 'LAN_CONNECTED', roomCode, playerId })}\n\n`);

          if (!roomClients.has(roomCode)) {
            roomClients.set(roomCode, new Set());
          }
          const clientSet = roomClients.get(roomCode);
          const clientObj = { res, playerId };
          clientSet.add(clientObj);

          req.on('close', () => {
            clientSet.delete(clientObj);
            if (clientSet.size === 0) {
              roomClients.delete(roomCode);
            }
          });
          return;
        }

        // 2. Broadcast Message to All LAN Players in Room
        if (url.pathname === '/api/lan-broadcast' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const roomCode = (data.roomCode || '').toUpperCase();
              const clientSet = roomClients.get(roomCode);

              if (clientSet && clientSet.size > 0) {
                const sseMessage = `data: ${JSON.stringify(data)}\n\n`;
                for (const client of clientSet) {
                  // Do not echo back to sender if senderId matches
                  if (client.playerId !== data.senderId) {
                    try {
                      client.res.write(sseMessage);
                    } catch (err) {
                      clientSet.delete(client);
                    }
                  }
                }
              }

              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              });
              res.end(JSON.stringify({ ok: true, recipients: clientSet ? clientSet.size : 0 }));
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), lanMultiplayerPlugin()],
  server: {
    host: true, // Listen on all network addresses (LAN access)
    port: 5173
  }
})
