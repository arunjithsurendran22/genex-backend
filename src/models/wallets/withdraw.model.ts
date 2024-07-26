import { Schema, model } from "mongoose";

const withdrawSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    master_wallet: {
      type: String,
      required: true,
      red: "masterWallets",
    },
    toWallet_pubkey: {
      type: String,
      required: true,
    },
    admin_fee: {
      type: Number,
      requred: true,
    },
  },
  {
    timestamps: true,
  }
);

const withdrawModel = model("withdraws", withdrawSchema);
export default withdrawModel;
