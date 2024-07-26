import { Schema, model } from "mongoose";

const transactionPoolSchema = new Schema(
  {
    wallets: {
      type: [
        {
          worker_wallet: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "workerwallets",
          },
          trade: {
            type: Boolean,
            required: true,
            default: false,
          },
          status: {
            type: String,
            enum: ["success", "failed", "progress"],
            required: true,
          },
        },
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ["completed", "progress", "failed"],
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    tokenAddress: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    master_wallet: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "masterWallets",
    },
    name: {
      type: String,
    },
    isCompleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

const PoolModel = model("transactionpools", transactionPoolSchema);
export default PoolModel;
