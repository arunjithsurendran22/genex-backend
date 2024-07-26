import cron from "node-cron";
import WorkerWalletPaymentModel from "../models/wallets/workerWalletPaymet";
import WorkerWalletModel from "../models/wallets/worker.wallets";
import { sendSolana } from "../utils/sol/sendSol";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { SolanaConnection } from "../config/solanaConnection";
import MasterWalletModel from "../models/wallets/master.wallet";

export const deductAdmFeeAmtAutoCron = async () => {
  try {
    cron.schedule("0 0 * * *", async () => {
      const d = await SolanaConnection.getMinimumBalanceForRentExemption(50);

      const adminFee = LAMPORTS_PER_SOL * 0.0001;
      const lamportsAdmintFee = Number(d) - adminFee;

      const wallets = await WorkerWalletModel.find({ isActive: false });

      if (wallets) {
        for (let i = 0; i < wallets.length; i++) {
          const paymentsHistory = await WorkerWalletPaymentModel.findOne({
            worker_wallet: wallets[i]._id,
            status: "later",
            payment_status: "pending",
          });

          if (paymentsHistory) {
            const masterWallet = await MasterWalletModel.findOne({
              user: paymentsHistory.user,
            });

            if (masterWallet && masterWallet.balance > 0.0001) {
              const deductSol = await sendSolana(
                masterWallet.private_key,
                new PublicKey(wallets[i].public_key),
                lamportsAdmintFee
              );

              if (deductSol) {
                paymentsHistory.status = "paid";
                paymentsHistory.payment_status = "success";
                await paymentsHistory.save();

                wallets[i].isActive = true;
                await wallets[i].save();
              }
            } else {
              throw Error("insufficient balance");
            }
          } else {
            const paymentHistoryOther = await WorkerWalletPaymentModel.findOne({
              worker_wallet: wallets[i]._id,
              payment_status: "un-paid",
              status: "progress",
            });

            if (paymentHistoryOther) {
              const masterWallet = await MasterWalletModel.findOne({
                user: paymentHistoryOther.user,
              });

              if (masterWallet && masterWallet.balance > 0.0001) {
                const deductSol = await sendSolana(
                  masterWallet.private_key,
                  new PublicKey(wallets[i].public_key),
                  lamportsAdmintFee
                );

                if (deductSol) {
                  paymentHistoryOther.status = "paid";
                  paymentHistoryOther.payment_status = "success";
                  await paymentHistoryOther.save();

                  wallets[i].isActive = true;
                  await wallets[i].save();
                } else {
                  throw Error("deduction failed");
                }
              } else {
                throw Error("insufficient balance");
              }
            }
          }
        }
      }
    });
  } catch (error) {
    throw error;
  }
};
