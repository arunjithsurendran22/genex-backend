import { Schema, model } from "mongoose";

const workerWalletPaymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["paid", "un-paid", "later"],
    },
    payment_status: {
      type: String,
      required: true,
      enum: ["success", "progress", "failed", "pending"],
    },
    worker_wallet: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "workerwallets",
    },
    master_wallet: {
      type: Schema.Types.ObjectId,
      ref: "masterWallets",
    },
    signature: {
      type: String,
    },
    feePerWallet: {
      type: Number,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

const WorkerWalletPaymentModel = model(
  "workerwalletpayments",
  workerWalletPaymentSchema
);
export default WorkerWalletPaymentModel;
