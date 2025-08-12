import { WebSocketServer } from "ws";

export const createWebsocketServer = () =>
   new WebSocketServer({
      port: 8080,
   });
