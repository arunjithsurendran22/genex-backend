import { transactionPoolInterface } from "../../types/transactionTypes";
import UserContranctAddressModel from "../../models/wallets/userContranctAddress.model";
import MasterWalletModel from "../../models/wallets/master.wallet";
import WorkerWalletModel from "../../models/wallets/worker.wallets";
import generateUniqueId from "generate-unique-id";
import PoolModel from "../../models/wallets/tradePoolBatch";
import { SolanaConnection } from "./workerWalletsHelpers";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

export const UserPoolHelpers = () => {
  const createTransactionPoolHelper = async (
    data: transactionPoolInterface,
    userId: string
  ) => {
    try {
      const token = await UserContranctAddressModel.findOne({
        tokenAddress: data.tokenAddress,
      });

      if (!token) {
        throw Error("token address is not found");
      }

      const masterWallet = await MasterWalletModel.findOne({
        _id: data.master_wallet,
      });

      if (!masterWallet) {
        throw Error("master wallet is not found");
      }

      for (let i = 0; i < data.wallets.length; i++) {
        const workerWallet = await WorkerWalletModel.findOne({
          _id: data.wallets[i].worker_wallet,
        });

        if (workerWallet) {
          const balance = await SolanaConnection.getBalance(
            new PublicKey(workerWallet?.public_key)
          );

          workerWallet.balance = balance / LAMPORTS_PER_SOL;
          await workerWallet.save();

          if (balance < 0.0035) {
            throw Error(`remove this wallet ${workerWallet.name}`);
          }
        }

        if (!workerWallet) {
          throw Error(`${i} worker wallet is not found`);
        }
      }

      const uniqueName = generateUniqueId({
        useLetters: true,
        useNumbers: false,
        length: 32,
      });

      const Name = "genXPool" + uniqueName;

      const createPool = await PoolModel.create({
        wallets: data.wallets,
        status: "progress",
        user: userId,
        tokenAddress: token?._id,
        master_wallet: data.master_wallet,
        name: Name,
      });
      return createPool;
    } catch (error) {
      throw error;
    }
  };

  const singlePoolHelper = async (poolId: string) => {
    try {
      return await PoolModel.findById(poolId).populate(
        "master_wallet tokenAddress"
      );
    } catch (error) {
      throw error;
    }
  };

  const allPoolHelper = async (userId: string, limit: number, skip: number) => {
    try {
      return await PoolModel.find({ user: userId })
        .limit(limit)
        .skip(limit * skip)
        .sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  };

  return {
    createTransactionPoolHelper,
    singlePoolHelper,
    allPoolHelper,
  };
};
