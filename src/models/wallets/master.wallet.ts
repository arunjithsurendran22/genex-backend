import { Schema, model } from "mongoose";

const userMasterWalletSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
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

    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

userMasterWalletSchema.methods.toJSON = function () {
  const masterWallet = this;
  const masterWalletObject = masterWallet.toObject();

  delete masterWalletObject.private_key;
  delete masterWalletObject.__v;

  return masterWalletObject;
};

const MasterWalletModel = model("masterWallets", userMasterWalletSchema);
export default MasterWalletModel;
