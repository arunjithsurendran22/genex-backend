import { isValidObjectId } from "mongoose";
import workerWalletTransactionModel from "../../models/wallets/workerWalletTransaction";
import PoolModel from "../../models/wallets/tradePoolBatch";
import { withdrawInterface } from "../../types/transactionTypes";
import MasterWalletModel from "../../models/wallets/master.wallet";
import WorkerWalletModel from "../../models/wallets/worker.wallets";
import { SolanaConnection } from "./workerWalletsHelpers";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { sendSolana } from "../../utils/sol/sendSol";
import withdrawModel from "../../models/wallets/withdraw.model";
import { genisisWallet } from "../../utils/wallets/adminWallet";
import WorkerWalletPaymentModel from "../../models/wallets/workerWalletPaymet";
import WithdrawPaymentsModel from "../../models/wallets/withdraw.payment.model";

export const userTransactionHelpers = () => {
  const allTransactionHelper = async (
    userId: string,
    limit: number,
    skip: number,
    filters: any,
    otherFilter: any,
    sort: any
  ) => {
    try {
      let filter2: any = {};
      let filter3: any = {};

      let sortStage: any = { $sort: { createdAt: 1 } };

      if (sort === "amtAsc") {
        sortStage.$sort = { amount: 1 };
      } else if (sort === "amtDsc") {
        sortStage.$sort = { amount: -1 };
      }

      if (otherFilter.porject) {
        filter2["token_account_info.tokenAddress"] = {
          $regex: otherFilter.project,
          $options: "i",
        };
      }

      if (otherFilter.wallet) {
        filter3["worker_wallet_info.name"] = {
          $regex: otherFilter.wallet,
          $options: "i",
        };
      }

      const transaction = await workerWalletTransactionModel.aggregate([
        {
          $match: filters,
        },
        {
          $lookup: {
            from: "workerwallets",
            localField: "worker_wallet",
            foreignField: "_id",
            as: "worker_wallet_info",
          },
        },
        {
          $unwind: "$worker_wallet_info",
        },
        {
          $match: filter3,
        },

        {
          $lookup: {
            from: "usercontractaddresses",
            localField: "token_address",
            foreignField: "_id",
            as: "token_account_info",
          },
        },

        {
          $match: filter2,
        },
        {
          $lookup: {
            from: "masterwallets",
            localField: "master_wallet",
            foreignField: "_id",
            as: "master_wallet_info",
          },
        },
        {
          $unwind: "$master_wallet_info",
        },
        {
          $project: {
            master_wallet_info: 1,
            token_account_info: 1,
            worker_wallet_info: 1,
            type: 1,
            signature: 1,
            latency: 1,
            signature_status: 1,
            amount: 1,
            token_balance: 1,
            createdAt: 1,
          },
        },
        sortStage,
        {
          $skip: Number(limit) * Number(skip) || 0,
        },
        {
          $limit: Number(limit) || 10,
        },
        // {
        //   $sort: {
        //     createdAt: -1,
        //   },
        // },
      ]);

      const totalTransaction = await workerWalletTransactionModel
        .find(filters)
        .countDocuments();

      return { transaction, totalTransaction };
    } catch (error) {
      throw error;
    }
  };

  const singleTransactionDetailsHelper = async (transaction_id: string) => {
    try {
      if (!isValidObjectId(transaction_id)) {
        throw Error("invalid transaction id");
      }

      return await workerWalletTransactionModel
        .findOne({ _id: transaction_id })
        .populate("master_wallet worker_wallet");
    } catch (error) {
      throw error;
    }
  };

  const userWithdrawSolanaHelper = async (
    data: withdrawInterface,
    userId: string
  ) => {
    try {
      const masterWallet = await MasterWalletModel.findOne({
        _id: data.master_wallet,
      });
      if (!masterWallet) {
        throw Error("master wallet not found");
      }

      const masterWalBal = await SolanaConnection.getBalance(
        new PublicKey(masterWallet.public_key)
      );

      if (!masterWalBal) {
        throw Error("master wallet checking failed try again");
      }

      const adminFee = (data.amount * 0.1) / 100;
      const deductFee = Math.round(adminFee * LAMPORTS_PER_SOL);

      const adminWallet = await genisisWallet();

      const paymentHistory = await WithdrawPaymentsModel.create({
        user: userId,
        master_wallet: data.master_wallet,
        status: "un-paid",
        payment_status: "pending",
        amount: deductFee / LAMPORTS_PER_SOL,
      });

      const transferAdminFee = await sendSolana(
        masterWallet.private_key,
        new PublicKey(adminWallet.publicKey),
        Number(deductFee)
      );

      if (!transferAdminFee) {
        paymentHistory.payment_status = "failed";
        await paymentHistory.save();
        throw Error("admin fee deduction failed");
      } else {
        paymentHistory.payment_status = "success";
        paymentHistory.status = "paid";
        await paymentHistory.save();
      }

      const withdrawAmt = Math.round(data.amount * LAMPORTS_PER_SOL);
      const finalAmt = withdrawAmt - deductFee;

      const transfer = await sendSolana(
        masterWallet.private_key,
        new PublicKey(data.toWallet_pubkey),
        finalAmt
      );

      if (!transfer) {
        throw Error("transaction failed please try again");
      }

      const lastAmt = await SolanaConnection.getBalance(
        new PublicKey(masterWallet.public_key)
      );
      masterWallet.balance = lastAmt / LAMPORTS_PER_SOL;
      await masterWallet.save();

      const withdraw = await withdrawModel.create({
        user: userId,
        amount: data.amount,
        master_wallet: data.master_wallet,
        toWallet_pubkey: data.toWallet_pubkey,
        admin_fee: adminFee,
      });

      return withdraw;
    } catch (error) {
      throw error;
    }
  };

  const transferWorkerToMaster = async (
    wallets: string[],
    master_wallet: string,
    amount: number
  ) => {
    try {
      const masterWallet = await MasterWalletModel.findOne({
        _id: master_wallet,
      });
      if (!masterWallet) {
        throw Error("master wallet not found");
      }

      for (let i = 0; i < wallets.length; i++) {
        const workerWallet = await WorkerWalletModel.findOne({
          _id: wallets[i],
        });

        if (!workerWallet) {
          throw Error(`worker wallet ${i} not found`);
        }

        const deductAmt = LAMPORTS_PER_SOL * amount;

        const d = await SolanaConnection.getMinimumBalanceForRentExemption(1);

        let lamportsToSendAmt = Number(deductAmt - Number(d));

        const transfered = await sendSolana(
          workerWallet.private_key,
          new PublicKey(masterWallet.public_key),
          lamportsToSendAmt
        );

        if (transfered) {
          const wrkBalWal = await SolanaConnection.getBalance(
            new PublicKey(workerWallet.public_key)
          );
          workerWallet.balance = wrkBalWal / LAMPORTS_PER_SOL;
          await workerWallet.save();

          const masterWalBal = await SolanaConnection.getBalance(
            new PublicKey(masterWallet.public_key)
          );

          masterWallet.balance = masterWalBal / LAMPORTS_PER_SOL;
          await masterWallet.save();
        }
      }

      return "successfully transferd";
    } catch (error) {
      throw error;
    }
  };

  const getAllTransactionsWorkerBaseHelper = async (
    worker_wallet: string,
    user: string,
    limit: number,
    skip: number
  ) => {
    try {
      const workerWallet = await WorkerWalletModel.findOne({
        _id: worker_wallet,
        isDeleted: false,
      });

      if (!workerWallet) {
        throw Error("worker wallet not found!");
      }

      const transactions = await workerWalletTransactionModel
        .find({
          worker_wallet: worker_wallet,
          user: user,
        })
        .limit(limit)
        .skip(limit * skip)
        .sort({ createdAt: -1 });

      const trasactionCount = await workerWalletTransactionModel
        .find({
          worker_wallet: worker_wallet,
          user: user,
        })
        .countDocuments();

      return { transactions, trasactionCount };
    } catch (error) {
      throw error;
    }
  };

  const workerWalletWasePaymentHistoryHelper = async (
    user: string,
    worker_wallet: string,
    limit: number,
    skip: number
  ) => {
    try {
      if (!isValidObjectId(worker_wallet))
        throw Error("invalid worker wallet id");

      const paymentHistory = await WorkerWalletPaymentModel.find({
        user: user,
        worker_wallet: worker_wallet,
      })
        .limit(limit)
        .skip(limit * skip)
        .sort({ createdAt: -1 });

      const totalCount = await WorkerWalletPaymentModel.find({
        user: user,
        worker_wallet: worker_wallet,
      }).countDocuments();

      return {
        paymentHistory,
        totalCount,
      };
    } catch (error) {
      throw error;
    }
  };

  return {
    allTransactionHelper,
    singleTransactionDetailsHelper,
    userWithdrawSolanaHelper,
    transferWorkerToMaster,
    getAllTransactionsWorkerBaseHelper,
    workerWalletWasePaymentHistoryHelper,
  };
};
