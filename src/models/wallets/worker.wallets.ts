import { Schema, model } from "mongoose";

const workerWalletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "users",
    },
    public_key: {
      type: String,
      required: true,
    },
    private_key: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
    trade: {
      type: Boolean,
      required: true,
      default: false,
    },
    gen_public: {
      type: String,
    },
    gen_Private: {
      type: String,
    },
    master_wallet: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "masterWallets",
    },
    contract_token: {
      type: Schema.Types.ObjectId,
      ref: "usercontractaddresses",
    },
    name: {
      type: String,
      required: true,
    },
    token_balance: {
      type: Number,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

workerWalletSchema.methods.toJSON = function () {
  const workerWallet = this;
  const workerWalletObject = workerWallet.toObject();

  delete workerWalletObject.private_key;
  delete workerWalletObject.__v;

  return workerWalletObject;
};

const WorkerWalletModel = model("workerwallets", workerWalletSchema);
export default WorkerWalletModel;
