import MasterWalletModel from "../../models/wallets/master.wallet";
import { WalletsServices } from "../../utils/wallets/wallets";
import WorkerWalletModel from "../../models/wallets/worker.wallets";
import UserContranctAddressModel from "../../models/wallets/userContranctAddress.model";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { sendSolana } from "../../utils/sol/sendSol";
import { genisisWallet } from "../../utils/wallets/adminWallet";
import WorkerWalletPaymentModel from "../../models/wallets/workerWalletPaymet";
import {
  getUserContractTokenDetails,
  getTokenDetails,
} from "../../utils/wallets/retrieveContractTokenDetails";
import { isValidObjectId } from "mongoose";
import generateUniqueId from "generate-unique-id";
import { getTokenAddress } from "../../utils/raydiumUtils/tokenUtils";
import { workerWalletCreationPaymentWarning } from "../../services/sendPaymentWarning";
import UserModel from "../../models/users/user.model";

// const RPC_URL =
//   "https://necessary-radial-needle.solana-mainnet.quiknode.pro/88ca97b39b3085f976fb5584c04b57d2226cee16/";
export const RPC_URL =
  "https://mainnet.helius-rpc.com/?api-key=f0c11eb0-ccc8-4f5f-afb3-b11308f4e46e";

// const RPC_URL =
//   "https://mainnet.helius-rpc.com/?api-key=3aeb267f-fa6c-4dc7-b655-f198e7c2fb3d";

// const RPC_URL = "https://api.mainnet-beta.solana.com/";

// const RPC_URL = "https://rpc.solscan.com";

// const RPC_URL = "https://rpc.ankr.com/solana";

// const RPC_URL =
//   "https://mainnet.helius-rpc.com/?api-key=8fbe5865-605a-45ec-8629-8caa128be392";

// const RPC_URL =
//   "https://solana-mainnet.api.syndica.io/api-token/2g5bUixPgB7ikTo6JUA9f7ke1xErWvjp3cHFR1uJUvyTjdYUWib1WJg9VUVsdWGK9njwDL7ToJaoUESJhAi41GURkgyGWxxR9RhVH9FzMNtSKanozjZ61ZmptQmnJKNxEGxfmiGEWAsPWph7hXwGuse1pnRzNm3sGntcVqgdFtXruWhzHFt35dvhURy2MheSdtpin35M3HaNkMPPvP1H2PronHC5r1tDBwhU52EeNYSH8wBbdFkAvxtKQhvC4zULzjC5sYV3Ba2a3MyVqis3Mk1JvcEekKfEMwNGnijxfi5qiE4LwkuYvA1h97du3a3arRVJhwmPZgjiZCrhkGqK1m2vt8gd7YV3XVeAKhhynmpa6tL4yjCWctLcatZNP7n6HW2KADac6fqg3rwMWUPxv3ucVLszoujuLU9V5PyDHdqoqhgsAj9XgX4JjR8stYs4zw5ZmFzvJtKekk5pfGox7n6XTqZSEXaVpVL6KBtjQbwYEPS5wjhsyaZyy5KuQ";

// const RPC_URL =
//   "https://endpoints.omniatech.io/v1/sol/mainnet/a98f2930afc946db859a37fb8a300f8a";

export const SolanaConnection = new Connection(RPC_URL, "confirmed");

const { createWalletService } = WalletsServices();

export const workerWalletsHelpers = () => {
  const createProjectHelper = async (
    wallet_count: number,
    contractAccount: string,
    userId: string,
    masterWalletId: string,
    isKeepMinimumBalance: boolean,
    onIterationComplete: (message: any, error: any, projectErr: any) => void
  ) => {
    try {
      if (!isValidObjectId(userId)) throw Error("invalid user id");

      if (!isValidObjectId(masterWalletId))
        throw Error("invalid master wallet id");

      const checkTokentAddress = await getUserContractTokenDetails(
        new PublicKey(contractAccount)
      );

      // const tokenOtherDetails = await getTokenDetails(contractAccount);
      // console.log(tokenOtherDetails, "show other details");

      if (!checkTokentAddress) {
        throw Error("token verification failed");
      }

      const findContractAddress = await UserContranctAddressModel.findOne({
        tokenAddress: contractAccount,
      });
      const saveContractAccount = await UserContranctAddressModel.create({
        tokenAddress: contractAccount,
        user: userId,
        decimals: checkTokentAddress.decimals,
        token_supply: Number(checkTokentAddress.supply),
        total_wallet_count: Number(wallet_count),
      });

      const masterWallet = await MasterWalletModel.findOne({
        _id: masterWalletId,
        user: userId,
      });

      let mstWalBal: number = 0;

      if (masterWallet) {
        mstWalBal = await SolanaConnection.getBalance(
          new PublicKey(masterWallet?.public_key)
        );

        masterWallet.balance = mstWalBal / LAMPORTS_PER_SOL;
        masterWallet?.save();
      }

      if (!masterWallet) {
        throw Error("master wallet not found");
      }

      let withoutPaymentWallets: string[] = [];
      let withoutPaymentWalletsCount: number = 0;

      for (let i = 1; i <= wallet_count; i++) {
        const uniqueName = generateUniqueId({
          useLetters: true,
          useNumbers: true,
          length: 32,
        });

        let Name = "genX" + uniqueName;
        let contract_token = findContractAddress?._id.toString();

        if (masterWallet.balance > 0.0041) {
          if (saveContractAccount) {
            const newWallets = await createWalletService();

            // get admin wallet
            const adminWallet = await genisisWallet();

            const adminFee = LAMPORTS_PER_SOL * 0.0001;

            const deductAmt = LAMPORTS_PER_SOL * 0.0035;
            const d = await SolanaConnection.getMinimumBalanceForRentExemption(
              50
            );

            let lamportsToSendAmt = Number(deductAmt - Number(d));
            let lamportsAdmintFee = Number(Number(d) - adminFee);

            const saveWorkerWallets = await WorkerWalletModel.create({
              user: userId,
              public_key: newWallets.publicKey.toString(),
              private_key: newWallets.privateKey.toString(),
              balance: 0,
              master_wallet: masterWalletId,
              contract_token: contract_token,
              name: Name,
            });

            const paymentHistory = await WorkerWalletPaymentModel.create({
              user: userId,
              totalAmount: lamportsToSendAmt,
              status: "un-paid",
              payment_status: "progress",
              worker_wallet: saveWorkerWallets._id,
              master_wallet: masterWalletId,
              feePerWallet: adminFee,
            });

            // deduct amount for user master wallet to amdin wallet
            const sendingSol = await sendSolana(
              masterWallet.private_key,
              new PublicKey(adminWallet.publicKey),
              lamportsAdmintFee
            );

            let checkMasterWalletBal = await SolanaConnection.getBalance(
              new PublicKey(masterWallet?.public_key)
            );
            masterWallet.balance = checkMasterWalletBal / LAMPORTS_PER_SOL;
            await masterWallet.save();

            if (isKeepMinimumBalance === true) {
              const sendSolNewWallet = await sendSolana(
                masterWallet.private_key,
                new PublicKey(newWallets.publicKey),
                lamportsToSendAmt
              );

              if (sendSolNewWallet && saveWorkerWallets) {
                saveWorkerWallets.balance =
                  lamportsToSendAmt / LAMPORTS_PER_SOL;
                saveWorkerWallets.isActive = true;
                await saveWorkerWallets.save();
              }
            }

            if (!sendingSol) {
              (paymentHistory.payment_status = "failed"), paymentHistory.save();
              throw Error("solana duduction failed");
            }
            let finalAmt = mstWalBal - lamportsToSendAmt;
            let converamt = finalAmt / LAMPORTS_PER_SOL;
            masterWallet.balance = converamt;
            await masterWallet.save();

            (paymentHistory.payment_status = "success"),
              (paymentHistory.status = "paid");
            paymentHistory.save();

            if (wallet_count < 10) {
              // Call the callback function with the status update
              onIterationComplete(
                { data: `Wallet creation ${i} completed successfully` },
                { error: "" },
                {
                  projectErr: false,
                }
              );
            } else if (i % 10 === 0) {
              // Call the callback function with the status update
              onIterationComplete(
                {
                  data: `Wallet creation ${i} completed successfully`,
                },
                { error: "" },
                { projectErr: false }
              );
            } else if (i === wallet_count) {
              // Call the callback function with the status update
              onIterationComplete(
                {
                  data: `all wallet creation  completed successfully`,
                },
                {
                  error: "",
                },
                {
                  projectErr: false,
                }
              );
            }
          }
        } else {
          // add creation logic and deduct when user will added
          if (saveContractAccount) {
            const newWallets = await createWalletService();

            const deductAmt = 0.001;

            // deduct amount for user master wallet to amdin wallet
            const saveWorderWallets = await WorkerWalletModel.create({
              user: userId,
              public_key: newWallets.publicKey.toString(),
              private_key: newWallets.privateKey.toString(),
              balance: 0,
              master_wallet: masterWalletId,
              name: Name,
              contract_token: contract_token,
            });

            if (saveWorderWallets) {
              withoutPaymentWallets.push(saveWorderWallets?.name);
            }

            const paymentHistory = await WorkerWalletPaymentModel.create({
              user: userId,
              totalAmount: deductAmt,
              status: "later",
              payment_status: "pending",
              worker_wallet: saveWorderWallets._id,
              master_wallet: masterWalletId,
              feePerWallet: 0,
            });

            withoutPaymentWalletsCount++;
            if (wallet_count < 10) {
              // Call the callback function with the status update
              onIterationComplete(
                { data: `Wallet creation ${i} completed successfully` },
                { error: "" },
                {
                  projectErr: false,
                }
              );
            } else if (i % 10 === 0) {
              // Call the callback function with the status update
              onIterationComplete(
                {
                  data: `Wallet creation ${i} completed successfully`,
                },
                { error: "" },
                {
                  projectErr: false,
                }
              );
            } else if (i === wallet_count) {
              // Call the callback function with the status update
              onIterationComplete(
                {
                  data: `all wallet creation  completed successfully`,
                },
                {
                  error: "",
                },
                {
                  projectErr: false,
                }
              );
            }
          }
        }
      }

      const user = await UserModel.findOne({ _id: userId, isDeleted: false });

      if (
        withoutPaymentWallets.length > 0 &&
        withoutPaymentWallets.length &&
        user
      ) {
        await workerWalletCreationPaymentWarning(
          user?.email,
          withoutPaymentWalletsCount,
          withoutPaymentWallets,
          user?.name
        );

        console.log("warning mail has been send..........");
      }
      const findWorkerWallets = await WorkerWalletModel.find({
        user: userId,
      });
      return findWorkerWallets;
    } catch (error) {
      console.log(error, "show error");

      onIterationComplete(
        {
          data: "",
        },
        {
          error: error,
        },
        {
          projectErr: true,
        }
      );
    }
  };

  // GET ALL WORKER WALLETS LIST
  const getAllWorkerWalletsHelper = async (
    filters: any,
    masterWalletId: string,
    limit: number,
    skip: number,
    userId: string
  ) => {
    try {
      if (!isValidObjectId(filters.user)) throw Error("invalid user id");

      if (!isValidObjectId(filters.master_wallet))
        throw Error("invalid master wallet id");

      const getWorkerWallets = await WorkerWalletModel.find(filters)
        .limit(limit)
        .skip(limit * skip)
        .sort({ createdAt: -1 });

      if (getWorkerWallets) {
        for (let i = 0; i < getWorkerWallets.length; i++) {
          const bal = await SolanaConnection.getBalance(
            new PublicKey(getWorkerWallets[i].public_key)
          );
          getWorkerWallets[i].balance = bal / LAMPORTS_PER_SOL;
          await getWorkerWallets[i].save();
        }
      }

      const totalWallet = await WorkerWalletModel.find({
        user: userId,
        master_wallet: masterWalletId,
      }).countDocuments();

      return { getWorkerWallets, totalWallet };
    } catch (error) {
      throw error;
    }
  };

  // GET SINGLE WORKER WALLET DETAILS
  const getWorkerWalletSingleDetailsHelper = async (wallet_id: string) => {
    try {
      if (!isValidObjectId(wallet_id)) throw Error("invalid wallet id");

      const wallet = await WorkerWalletModel.findOne({
        _id: wallet_id,
      }).populate("master_wallet user");

      if (wallet) {
        const bal = await SolanaConnection.getBalance(
          new PublicKey(wallet.public_key)
        );

        wallet.balance = bal / LAMPORTS_PER_SOL;
        await wallet.save();
      }

      return wallet;
    } catch (error) {
      throw error;
    }
  };

  // GET ALL WORKER WALLET TRANSACTION
  const workerWalletPaymentTransactionsHelper = async (
    userId: string,
    limit: number,
    skip: number
  ) => {
    try {
      if (!isValidObjectId(userId)) throw Error("invalid user id");

      const paymentTransaction = await WorkerWalletPaymentModel.find({
        user: userId,
      })
        .populate("worker_wallet master_wallet")
        .limit(limit)
        .skip(limit * skip);

      const totalPaymentTransaction = await WorkerWalletPaymentModel.find({
        user: userId,
      }).countDocuments();

      return {
        paymentTransaction,
        totalPaymentTransaction,
      };
    } catch (error) {
      throw error;
    }
  };

  // GET SINGLE TRANSACTION DETAILS
  const getSingleWorkerWalletTransactionDetails = async (
    transaction_id: string,
    userId: string
  ) => {
    try {
      if (!isValidObjectId(transaction_id))
        throw Error("invalid transaction id");

      return await WorkerWalletPaymentModel.findOne({
        _id: transaction_id,
        user: userId,
      }).populate("worker_wallet master_wallet user");
    } catch (error) {
      throw error;
    }
  };

  const checkWalletBalanceHelper = async (wallet_id: string) => {
    try {
      const wallet = await WorkerWalletModel.findOne({ _id: wallet_id });
      if (!wallet) {
        throw Error("wallet not found");
      }

      const balance = await SolanaConnection.getBalance(
        new PublicKey(wallet.public_key)
      );

      if (!balance) {
        throw "balance checking failed";
      }

      wallet.balance = balance;
      wallet.save();

      return wallet;
    } catch (error) {
      throw error;
    }
  };

  const verifyTokenAddressHelper = async (token_address: string) => {
    try {
      const checkTokentAddress = await getTokenAddress(token_address);

      if (!checkTokentAddress) {
        throw Error("invalid token address");
      }

      return checkTokentAddress;
    } catch (error) {
      throw error;
    }
  };

  return {
    createProjectHelper,
    getAllWorkerWalletsHelper,
    getWorkerWalletSingleDetailsHelper,
    workerWalletPaymentTransactionsHelper,
    getSingleWorkerWalletTransactionDetails,
    checkWalletBalanceHelper,
    verifyTokenAddressHelper,
  };
};
