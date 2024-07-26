import { Schema, model } from "mongoose";

const withdrayPaymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    master_wallet: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "workerwallets",
    },
    status: {
      type: String,
      required: true,
      enum: ["paid", "un-paid"],
    },
    payment_status: {
      type: String,
      required: true,
      enum: ["failed", "success", "pending"],
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const WithdrawPaymentsModel = model("withdrawpayments", withdrayPaymentSchema);
export default WithdrawPaymentsModel;
