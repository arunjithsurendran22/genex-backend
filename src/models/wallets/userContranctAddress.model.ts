import { Schema, model } from "mongoose";

const userContranctAddressSchema = new Schema(
  {
    tokenAddress: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    token_supply: {
      type: Number,
    },
    decimals: {
      type: Number,
    },
    total_wallet_count: {
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

const UserContranctAddressModel = model(
  "usercontractaddresses",
  userContranctAddressSchema
);

export default UserContranctAddressModel;
