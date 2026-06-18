// WebSocket-Client (socket.io). Verbindung wird mit Login-Token aufgebaut.
import { io } from 'socket.io-client';
import { getToken } from './api.js';

let socket = null;

export function getSocket() {
  const token = getToken();
  if (!token) return null;
  if (socket && socket.auth?.token !== token) { socket.disconnect(); socket = null; }
  if (!socket) {
    socket = io('/', { auth: { token }, transports: ['websocket', 'polling'], autoConnect: true });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
