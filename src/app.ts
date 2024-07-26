import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import * as bodyparser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";

// IMPORT USER AUTH ROUTES
import userAuthRouters from "./routers/users";
const { userAuthRoutes } = userAuthRouters;

// WORKER WALLET ROUTERS
import workerWalletRouters from "./routers/workerWallets";
const { workerWalletRoutes, userTransactionRoutes, userPoolRoutes } =
  workerWalletRouters;

// SWAP ROUTES
import SwapRouters from "./routers/swap";
const { SwapRoutes } = SwapRouters;

// PROJECT ROUTERS
import userProjectRouters from "./routers/projects";
const { userProjectRoutes } = userProjectRouters;

// Load environment variables from .env file
let NODE_ENV =
  process.env.NODE_ENV === "production" ? "production" : "development";

dotenv.config({
  path: path.join(__dirname, "../", `.env.${NODE_ENV}`),
});

const app = express();

app.use(cookieParser());
app.use(cors());
app.use(bodyparser.urlencoded({ extended: true }));
app.use("/public", express.static("public"));
app.use(express.json());

app.use("/v1/api/users", userAuthRoutes);
app.use("/v1/api/users/wallets/worker", workerWalletRoutes);
app.use("/v1/api/users/wallets/swap", SwapRoutes);
app.use("/v1/api/users/wallet/transactions", userTransactionRoutes);
app.use("/v1/api/users/projects", userProjectRoutes);
app.use("/v1/api/users/pool", userPoolRoutes);

export default app;
