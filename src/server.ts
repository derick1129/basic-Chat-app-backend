import { WebSocketServer } from "ws";
import type { ClientMessage, ServerMessage } from "./types.js";

const wss = new WebSocketServer({ port: 8080 });

const rooms = new Map<string, Set<WebSocket>>();
const socketToRoom = new Map<WebSocket, string>();

wss.on("connection", (socket) => {
  console.log("user connected");

  socket.on("message", (data: Buffer) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());
      console.log("Received: ", message);

      if (message.type === "join") {
        const roomId = message.payload.roomId;

        const oldRoomId = socketToRoom.get(socket);
        if (oldRoomId) {
          const oldRoom = rooms.get(oldRoomId);
          if (oldRoom) {
            oldRoom.delete(socket);
            if (oldRoom.size === 0) rooms.delete(oldRoomId);
          }
          socketToRoom.delete(socket);
        }

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)?.add(socket);
        socketToRoom.set(socket, roomId);

        console.log(`Socket joined room: ${roomId}`);
        return;
      }
      if (message.type === "chat") {
        const roomId = socketToRoom.get(socket);
        if (!roomId) {
          console.log("Socket tried to chat without joining a room");
          return;
        }

        const room = rooms.get(roomId);
        if (!room) {
          console.log("No room found for id: ", roomId);
          return;
        }

        const outgoing = JSON.stringify({
          type: "chat",
          payload: { message: message.payload.message },
        } satisfies ServerMessage);

        for (const client of room) {
          if (client.readyState === client.OPEN) {
            client.send(outgoing);
          }
        }

        console.log(`Broadcasted message to room: ${roomId}`);
        return;
      }
    } catch (e) {
      console.log("Invalid JSON: ", data.toString());
    }
  });

  socket.on("close", () => {
    const roomId = socketToRoom.get(socket);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.delete(socket);
        if (room.size === 0) rooms.delete(roomId);
      }
      socketToRoom.delete(socket);
      console.log(`Socket left room: ${roomId}`);
    }
    console.log("user disconnected");
  });
});
