import dotenv from "dotenv";
import app from "./app";
import path from "path";
import { ConnectToDatabase } from "./config/databaseConfig";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import url from "url";
import { verifyToken } from "./global/global";
import { deductAdmFeeAmtAutoCron } from "./services/deductAdmFeeAmountAutoCrone";

let NODE_ENV =
  process.env.NODE_ENV === "production" ? "production" : "development";

dotenv.config({
  path: path.join(__dirname, "../", `.env.${NODE_ENV}`),
});

const PORT = process.env.SERVER_PORTNUMBER;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

interface CustomWebSocket extends WebSocket {
  userId?: string;
}

const clients: { [key: string]: CustomWebSocket } = {};

wss.on("connection", (ws: CustomWebSocket, req) => {
  console.log("Client connected!");

  if (!req.url) {
    console.log("Missing URL, closing connection");
    ws.close(1008, "Missing URL"); // Close the connection with policy violation status code 1008
    return;
  }

  const queryParams = url.parse(req.url, true).query;
  const token = queryParams.token;

  if (!token) {
    console.log("Token not found, closing connection");
    ws.close(1008, "Token not found"); // Close the connection with policy violation status code 1008
    return;
  }

  let sendToken = token.toString();
  const user = verifyToken(sendToken);

  let userId = user.toString();
  ws.userId = userId;
  clients[userId] = ws; // Store the WebSocket connection associated with the user ID

  ws.on("close", () => {
    console.log(`User ${userId} disconnected`);
    delete clients[userId]; // Remove the user's WebSocket connection from the map
  });
});

export const broadcast = (data: any) => {
  Object.values(clients).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

const start = async () => {
  try {
    await ConnectToDatabase();
    await deductAdmFeeAmtAutoCron();
  } catch (error) {
    console.log("server errors : ", error);
  }

  server.listen(PORT, () => {
    console.log(`Server started on Port ${PORT}`);
    console.log(`Running server is ${NODE_ENV}`);
  });
};

start();
