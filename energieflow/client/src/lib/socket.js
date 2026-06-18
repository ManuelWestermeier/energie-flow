// WebSocket-Client (socket.io). Verbindung wird mit Username/Passwort aufgebaut.
import { io } from 'socket.io-client';
import { getCredentials } from './api.js';

let socket = null;

export function getSocket() {
  const credentials = getCredentials();
  if (!credentials) return null;

  const nextAuth = { username: credentials.username, password: credentials.password };
  if (socket && (
    socket.auth?.username !== nextAuth.username ||
    socket.auth?.password !== nextAuth.password
  )) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io('/', {
      auth: nextAuth,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
