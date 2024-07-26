import { Schema, model } from "mongoose";

const workerWalletTransactionSchema = new Schema(
  {
    worker_wallet: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "workerwallets",
    },
    master_wallet: {
      type: Schema.Types.ObjectId,
      ref: "masterWallets",
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    type: {
      type: String,
      required: true,
      enum: ["buy", "sell"],
    },
    signature: {
      type: String,
    },
    latency: {
      type: String,
    },
    signature_status: {
      type: String,
      enu: ["success", "process", "failed"],
    },
    amount: {
      type: Number,
    },
    token_balance: {
      type: Number,
    },
    token_address: {
      type: Schema.Types.ObjectId,
      ref: "usercontractaddresses",
      required: true,
    },
    boosterInterval: {
      type: String,
      required: true,
    },
    slippagePctg: {
      type: Number,
      required: true,
    },
    tradesPerInterval: {
      type: String,
      required: true,
    },
    amountPerWallet: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const workerWalletTransactionModel = model(
  "workerwallettransactions",
  workerWalletTransactionSchema
);

export default workerWalletTransactionModel;
