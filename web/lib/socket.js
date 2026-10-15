import { io } from 'socket.io-client';
import { API } from './api';

let socket = null;

// One shared connection. The browser sends the session cookie, so the server knows which rooms to join.
export function getSocket() {
  if (!socket) socket = io(API, { withCredentials: true });
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
