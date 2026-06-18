// WebSocket-Client (socket.io). Gleiche Herkunft wie die Seite (ein Port).
// Die Zugangsdaten werden im Handshake (auth.basic) mitgegeben.
import { io } from 'socket.io-client';
import { getBasic } from './api.js';

let socket = null;

export function getSocket() {
  const basic = getBasic();
  if (!basic) return null;
  if (socket && socket.auth?.basic !== basic) { socket.disconnect(); socket = null; }
  if (!socket) {
    socket = io({ auth: { basic }, transports: ['websocket', 'polling'], autoConnect: true });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
