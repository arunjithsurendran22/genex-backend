import { raydiumUtils } from "../../utils/raydiumUtils/raydiumUtils";
import UserContranctAddressModel from "../../models/wallets/userContranctAddress.model";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
  ComputeBudgetProgram,
  Keypair,
} from "@solana/web3.js";
// import { SolanaConnection } from "../workerWallets/workerWalletsHelpers";
import {
  Liquidity,
  MARKET_STATE_LAYOUT_V3,
  SwapSide,
  TOKEN_PROGRAM_ID,
  Token,
  TokenAmount,
  TokenAccount,
  SPL_ACCOUNT_LAYOUT,
  TxVersion,
} from "@raydium-io/raydium-sdk";
import { Connection } from "@solana/web3.js";
import { DEVNET_PROGRAM_ID, MAINNET_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { createJupiterApiClient } from "@jup-ag/api";
import WorkerWalletModel from "../../models/wallets/worker.wallets";
import WorkerWalletPaymentModel from "../../models/wallets/workerWalletPaymet";
import base58 from "bs58";
import { sendSolana, transferToken } from "../../utils/sol/sendSol";
import MasterWalletModel from "../../models/wallets/master.wallet";
export const SEND_AMT = 21000;
export const PRIORITY_FEE_IX = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: SEND_AMT,
});
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import workerWalletTransactionModel from "../../models/wallets/workerWalletTransaction";
import PoolModel from "../../models/wallets/tradePoolBatch";
import { genisisWallet } from "../../utils/wallets/adminWallet";
import { Schema } from "mongoose";
import {
  createProgramAccountIfNotExist,
  createToken,
  transferSPL,
} from "../../utils/raydiumUtils/tokenUtils";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { bool, publicKey, struct, u32, u64, u8 } from "@raydium-io/raydium-sdk";

// const RPC_URL =
//   process.env.RPC_URL ||
//   "https://necessary-radial-needle.solana-mainnet.quiknode.pro/88ca97b39b3085f976fb5584c04b57d2226cee16/";
export const RPC_URL =
  "https://mainnet.helius-rpc.com/?api-key=f0c11eb0-ccc8-4f5f-afb3-b11308f4e46e";

// const RPC_URL =
//   "https://mainnet.helius-rpc.com/?api-key=3aeb267f-fa6c-4dc7-b655-f198e7c2fb3d";

// const RPC_URL = "https://api.mainnet-beta.solana.com/";
// const RPC_URL = "https://rpc.solscan.com";

// const RPC_URL =
//   "https://endpoints.omniatech.io/v1/sol/mainnet/a98f2930afc946db859a37fb8a300f8a";

// Use the go method to get the full URL for the connection
// const RPC_URL =
//   "https://mainnet.helius-rpc.com/?api-key=8fbe5865-605a-45ec-8629-8caa128be392";

// const RPC_URL = "https://rpc.ankr.com/solana";

// const RPC_URL =
//   "https://solana-mainnet.api.syndica.io/api-token/2g5bUixPgB7ikTo6JUA9f7ke1xErWvjp3cHFR1uJUvyTjdYUWib1WJg9VUVsdWGK9njwDL7ToJaoUESJhAi41GURkgyGWxxR9RhVH9FzMNtSKanozjZ61ZmptQmnJKNxEGxfmiGEWAsPWph7hXwGuse1pnRzNm3sGntcVqgdFtXruWhzHFt35dvhURy2MheSdtpin35M3HaNkMPPvP1H2PronHC5r1tDBwhU52EeNYSH8wBbdFkAvxtKQhvC4zULzjC5sYV3Ba2a3MyVqis3Mk1JvcEekKfEMwNGnijxfi5qiE4LwkuYvA1h97du3a3arRVJhwmPZgjiZCrhkGqK1m2vt8gd7YV3XVeAKhhynmpa6tL4yjCWctLcatZNP7n6HW2KADac6fqg3rwMWUPxv3ucVLszoujuLU9V5PyDHdqoqhgsAj9XgX4JjR8stYs4zw5ZmFzvJtKekk5pfGox7n6XTqZSEXaVpVL6KBtjQbwYEPS5wjhsyaZyy5KuQ";

export const tokenInfo = {
  tokenName: "CorpStop",
  decimals: 9,
  symbol: "CORPS",
  supply: "1000000000",
  image: "./logo.png",
  description: "CorpStop.xyz",
  imgType: "image/png",
  imgName: "CORPS",
  telegram: "",
  twitter: "",
  discord: "",
  website: "",
  addLP: 30,
  addSol: 1,
  distribution: 70,
  buySwap: 1,
  devnet: true,
};

export const ACCOUNT_LAYOUT = struct([
  publicKey("mint"),
  publicKey("owner"),
  u64("amount"),
  u32("delegateOption"),
  publicKey("delegate"),
  u8("state"),
  u32("isNativeOption"),
  u64("isNative"),
  u64("delegatedAmount"),
  u32("closeAuthorityOption"),
  publicKey("closeAuthority"),
]);

export const SolanaConnection = new Connection(RPC_URL, "confirmed");
const devNet = false;
export const PROGRAMIDS = devNet ? DEVNET_PROGRAM_ID : MAINNET_PROGRAM_ID;

const { findMarketId, findPoolId, formatAmmKeysById, sendSignedTransaction } =
  raydiumUtils();

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getWalletTokenAccounts(
  connection: Connection,
  wallet: PublicKey
): Promise<TokenAccount[]> {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(
    wallet,
    {
      programId: TOKEN_PROGRAM_ID,
    },
    { commitment: "confirmed" }
  );
  return walletTokenAccount.value.map((i: any) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
}

export async function getWalletTokenAccount(
  connection: Connection,
  wallet: PublicKey,
  tokenMint: PublicKey
): Promise<TokenAccount[]> {
  const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
    mint: tokenMint,
  });

  return walletTokenAccount.value.map((i) => ({
    pubkey: i.pubkey,
    programId: i.account.owner,
    accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
  }));
}

export const SwapHelpers = () => {
  const singleBuyHelper = async (
    worker_wallet: string,
    tokenAddress: string,
    master_wallet: string,
    side: SwapSide,
    userId: string,
    amountPerWallets: number,
    tradesPerInterval: string,
    boosterInterval: string,
    slippagePctg: number
  ) => {
    try {
      console.log("started.....");

      let poolKeys: any = {};
      let baseToken: Token;

      const contract_address = await UserContranctAddressModel.findOne({
        tokenAddress: tokenAddress,
      });

      const findMasterWallet = await MasterWalletModel.findOne({
        user: userId,
      });

      if (!findMasterWallet) {
        throw Error("master wallet id not match for this user");
      }

      if (!contract_address) {
        throw Error("project not found invalid token address");
      }

      let baseMint = new PublicKey(tokenAddress);
      const poolId = await findPoolId(baseMint);
      const ammKeys = await formatAmmKeysById(poolId);
      const marketId = await findMarketId(baseMint);

      const marketBufferInfo: any = await SolanaConnection.getAccountInfo(
        marketId
      );

      const {
        quoteMint,
        baseLotSize,
        quoteLotSize,
        baseVault,
        quoteVault,
        bids,
        asks,
        eventQueue,
        requestQueue,
      } = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo.data);

      poolKeys = Liquidity.getAssociatedPoolKeys({
        version: 4,
        marketVersion: 3,
        baseMint,
        quoteMint,
        baseDecimals: ammKeys.baseDecimals,
        quoteDecimals: 9,
        marketId: new PublicKey(ammKeys.marketId),
        programId: PROGRAMIDS.AmmV4,
        marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
      });
      poolKeys.marketBaseVault = baseVault;
      poolKeys.marketQuoteVault = quoteVault;
      poolKeys.marketBids = bids;
      poolKeys.marketAsks = asks;
      poolKeys.marketEventQueue = eventQueue;

      baseToken = new Token(
        TOKEN_PROGRAM_ID,
        baseMint,
        ammKeys.baseMint == baseMint.toBase58()
          ? ammKeys.baseDecimals
          : ammKeys.quoteDecimals,
        "TokenMVB",
        "TVB"
      );

      let apiClient = createJupiterApiClient();

      const wallet = await WorkerWalletModel.findOne({
        _id: worker_wallet,
        isDeleted: false,
      });

      const isPaidWorkerWallet = await WorkerWalletPaymentModel.findOne({
        worker_wallet: wallet?._id,
        user: wallet?.user,
      });

      if (
        isPaidWorkerWallet?.status !== "paid" &&
        isPaidWorkerWallet?.payment_status !== "success"
      ) {
        throw Error(
          "worker wallet payment is not deducted please recharge your master wallet "
        );
      }

      if (!wallet) {
        throw Error("wallet not found");
      }

      const boosterConfig = await UserContranctAddressModel.findOne({
        tokenAddress: tokenAddress,
      });

      const intToken = new Token(TOKEN_PROGRAM_ID, quoteMint, 9, "SOL", "SOL");

      const amountPerWallet = amountPerWallets || 0;

      const generateSwapAndExecute = async () => {
        console.log("Prepare Trades.... - " + tradesPerInterval);

        const tns: any[] = [];

        let inTokenAmount = new TokenAmount(intToken, 0.001, false);
        let outTokenAmount = new TokenAmount(baseToken, 1, false);

        let quoteResponseInit: any;

        if (boosterConfig) {
          quoteResponseInit = await apiClient.quoteGet({
            inputMint: "So11111111111111111111111111111111111111112",
            outputMint: tokenAddress,
            amount: amountPerWallet * LAMPORTS_PER_SOL,
            slippageBps: slippagePctg * 100,
            autoSlippage: false,
            computeAutoSlippage: false,
            onlyDirectRoutes: false,
            swapMode: "ExactIn",
            asLegacyTransaction: false,
            maxAccounts: 64,
          });
        }

        let tokenBal = 0;
        let trade = " Preparing ";
        // let side: SwapSide = "out";
        inTokenAmount = new TokenAmount(intToken, amountPerWallet, false);
        outTokenAmount = new TokenAmount(
          baseToken,
          quoteResponseInit.otherAmountThreshold,
          true
        );

        const tokenAccount = await getWalletTokenAccount(
          SolanaConnection,
          new PublicKey(wallet.public_key),
          baseMint
        );

        if (tokenAccount.length > 0 && side === "in") {
          const tokenBalance = Number(
            tokenAccount[0].accountInfo.amount.toNumber().toFixed(0)
          );
          tokenBal = tokenBalance;

          if (tokenBal > Number(quoteResponseInit.otherAmountThreshold) / 8) {
            inTokenAmount = new TokenAmount(
              baseToken,
              quoteResponseInit.otherAmountThreshold,
              true
            );
            outTokenAmount = new TokenAmount(intToken, 0.0001, false);
          }
        }

        const wallets = Keypair.fromSecretKey(
          base58.decode(wallet.private_key)
        );

        let walletBal = await SolanaConnection.getBalance(
          new PublicKey(wallet?.public_key)
        );

        const publicKeyWallet = new PublicKey(wallets.publicKey);

        const walletTokenAccounts = await getWalletTokenAccounts(
          SolanaConnection,
          publicKeyWallet
        );

        const finalInst: TransactionInstruction[] = [];
        const { innerTransactions } = await Liquidity.makeSwapInstructionSimple(
          {
            connection: SolanaConnection,
            poolKeys,
            userKeys: {
              tokenAccounts: walletTokenAccounts,
              owner: publicKeyWallet,
            },
            amountIn: inTokenAmount,
            amountOut: outTokenAmount,
            fixedSide: side,
            makeTxVersion: TxVersion.V0,
          }
        );

        for (var ixL of innerTransactions) {
          for (var ix of ixL.instructions) {
            finalInst.push(ix);
          }
        }

        const addressesSwapMain: PublicKey[] = [];
        finalInst.forEach((ixn) => {
          ixn.keys.forEach((key: { pubkey: any }) => {
            addressesSwapMain.push(key.pubkey);
          });
        });

        const versionedTransaction = new Transaction()
          .add(PRIORITY_FEE_IX)
          .add(...finalInst);

        tns.push({ transaction: versionedTransaction, wallet: wallets });

        try {
          const blockhash = await SolanaConnection.getLatestBlockhash(
            "confirmed"
          );

          const saveTransaciton = await workerWalletTransactionModel.create({
            worker_wallet: worker_wallet,
            master_wallet: master_wallet,
            type: side === "out" ? "buy" : "sell",
            amount: side === "out" ? amountPerWallet : amountPerWallet,
            user: userId,
            token_address: contract_address._id,
            slippagePctg: slippagePctg,
            boosterInterval: boosterInterval,
            tradesPerInterval: tradesPerInterval,
            amountPerWallet: amountPerWallet,
          });

          const transactionnew = await transferSPL(
            contract_address.tokenAddress,
            amountPerWallet.toString(),
            wallet.public_key,
            wallets,
            TOKEN_PROGRAM_ID,
            finalInst
          );

          if (
            transactionnew &&
            transactionnew.trans &&
            transactionnew.newAccount
          ) {
            tns.push({
              transaction: transactionnew.trans,
              wallet: transactionnew.newAccount,
            });
          } else {
            tns.push({ transaction: versionedTransaction, wallet: wallets });
          }

          const responses = await Promise.all(
            tns.map(async (tnx) => {
              try {
                // const trans: Transaction = tnx.transaction;
                // trans.recentBlockhash = blockhash.blockhash;
                // trans.feePayer = tnx.wallet.publicKey;
                // trans.sign(...[tnx.wallet]);

                let trans: any;
                if (
                  transactionnew &&
                  transactionnew.trans === undefined &&
                  transactionnew.newAccount === undefined
                ) {
                  trans = tnx.transaction;
                  trans.recentBlockhash = blockhash.blockhash;
                  trans.feePayer = tnx.wallet.publicKey;
                  trans.sign(...[tnx.wallet]);
                } else {
                  trans = tnx.transaction;
                }

                // looping creates weird indexing issue with transactionMessages
                await sendSignedTransaction({
                  signedTransaction: trans,
                  connection: SolanaConnection,
                  skipPreflight: true,
                  successCallback: async (txSig: string) => {
                    saveTransaciton.signature = txSig;
                    saveTransaciton.signature_status = "success";
                    await saveTransaciton.save();
                    console.log(
                      "Sent Trasaction Success : Signature :" + txSig
                    );
                  },
                  sendingCallback: async (txSig: string) => {
                    console.log(
                      "Sent Trasaction awaiting Confirmation " + txSig
                    );
                  },
                  confirmStatus: async (
                    txSig: string,
                    confirmStatus: string
                  ) => {
                    console.log(
                      "Recieved Transaction Confirmation :  ",
                      txSig + ":" + confirmStatus
                    );
                  },
                });

                let accountWallet: any;

                accountWallet = Keypair.fromSecretKey(
                  base58.decode(wallet.private_key)
                );
                let tokenAccnt = await getWalletTokenAccount(
                  SolanaConnection,
                  accountWallet.publicKey,
                  baseMint
                );

                tokenBal = tokenAccnt[0]?.accountInfo?.amount
                  .toNumber()
                  .toFixed(0);

                saveTransaciton.token_balance = Number(tokenBal);
                await saveTransaciton.save();

                wallet.token_balance = Number(tokenBal);
                wallet.balance = walletBal / LAMPORTS_PER_SOL;
                await wallet.save();
              } catch (error) {
                console.log(new String(error));
                return null;
              }
            })
          );
          console.log(responses);
        } catch (error) {
          console.log(error);

          throw error;
        }
      };
      let promis = await generateSwapAndExecute();

      return promis;
    } catch (error) {
      console.log(error);

      throw error;
    }
  };

  // TRANSFER SOLANA IN SINGLE WALLET
  const transferSolanaSingleWorkerWalletHelper = async (
    worker_wallet: string[],
    master_wallet: string,
    amount: number,
    userId: string
  ) => {
    try {
      const masterWallet = await MasterWalletModel.findOne({
        _id: master_wallet,
      });

      if (masterWallet && masterWallet.user.toString() !== userId.toString()) {
        throw Error("user not matched this master id");
      }

      if (!masterWallet) {
        throw Error("master wallet not found");
      }

      let mstWalBal = await SolanaConnection.getBalance(
        new PublicKey(masterWallet?.public_key)
      );

      for (let i = 0; i < worker_wallet.length; i++) {
        const workerWallet = await WorkerWalletModel.findOne({
          _id: worker_wallet[i],
        });

        if (!workerWallet) {
          throw Error("worker wallet not found");
        }

        if (workerWallet.isActive === true) {
          const deductAmt = LAMPORTS_PER_SOL * amount;

          const d = await SolanaConnection.getMinimumBalanceForRentExemption(1);

          let lamportsToSendAmt = Number(deductAmt - Number(d));

          const transferd = await sendSolana(
            masterWallet.private_key,
            new PublicKey(workerWallet.public_key),
            lamportsToSendAmt
          );

          if (transferd) {
            let finalAmt = mstWalBal - lamportsToSendAmt;
            let convertSol = finalAmt / LAMPORTS_PER_SOL;
            masterWallet.balance = convertSol;
            await masterWallet.save();
          }
        } else {
          const adminWallet = await genisisWallet();

          const deductAmt = LAMPORTS_PER_SOL * amount;

          const adminFee = 0.0001 * LAMPORTS_PER_SOL;

          const d = await SolanaConnection.getMinimumBalanceForRentExemption(
            50
          );

          let lamportsToSendAmt = Number(deductAmt - Number(d));
          let lamportsAdmintFee = Number(Number(d) - adminFee);

          // deduct amount for user master wallet to amdin wallet
          const sendingSol = await sendSolana(
            masterWallet.private_key,
            new PublicKey(adminWallet.publicKey),
            lamportsAdmintFee
          );

          if (!sendingSol) {
            throw Error("deduction failed please try again");
          }

          const transferd = await sendSolana(
            masterWallet.private_key,
            new PublicKey(workerWallet.public_key),
            lamportsToSendAmt
          );

          if (transferd) {
            let finalAmt = await SolanaConnection.getBalance(
              new PublicKey(masterWallet?.public_key)
            );
            let convertSol = finalAmt / LAMPORTS_PER_SOL;
            masterWallet.balance = convertSol;
            await masterWallet.save();
            let finalAmtWorkerWallet = await SolanaConnection.getBalance(
              new PublicKey(masterWallet?.public_key)
            );
            let convertWrkAmt = finalAmtWorkerWallet / LAMPORTS_PER_SOL;
            workerWallet.balance = convertWrkAmt;
            workerWallet.isActive = true;
            await workerWallet.save();

            const PaymentHistory = await WorkerWalletPaymentModel.findOne({
              user: userId,
              worker_wallet: worker_wallet,
            });

            // if (PaymentHistory) {
            //   PaymentHistory.status = "paid";
            //   PaymentHistory.payment_status = "success";
            //   await PaymentHistory.save();
            // } else {
            const payment = await WorkerWalletPaymentModel.create({
              user: userId,
              totalAmount: deductAmt / LAMPORTS_PER_SOL,
              status: "paid",
              payment_status: "success",
              worker_wallet: worker_wallet,
              master_wallet: master_wallet,
              feePerWallet: lamportsAdmintFee,
            });
            // }
          }
        }
      }

      return "succesfully transfered";
    } catch (error) {
      throw error;
    }
  };

  const transferTokenHelper = async (
    tokenAddress: string,
    worker_wallet: string[],
    master_wallet: string,
    amount: number
  ) => {
    try {
      const isMatchToken = await UserContranctAddressModel.findOne({
        tokenAddress: tokenAddress,
      });

      if (!isMatchToken) {
        throw Error("tokenAddress is not found");
      }

      const masterWallet = await MasterWalletModel.findOne({
        _id: master_wallet,
      });

      if (!masterWallet) {
        throw Error("master wallet not found");
      }

      for (let i = 0; i < worker_wallet.length; i++) {
        const workerWallet = await WorkerWalletModel.findOne({
          _id: worker_wallet[i],
        });

        if (!workerWallet) {
          throw Error("worker wallet not found");
        }

        const isPaidWallet = await WorkerWalletPaymentModel.findOne({
          worker_wallet: workerWallet._id,
        });
        if (
          !isPaidWallet ||
          isPaidWallet.status === "un-paid" ||
          isPaidWallet.status === "later" ||
          isPaidWallet?.payment_status === "failed" ||
          isPaidWallet?.payment_status === "pending" ||
          isPaidWallet?.payment_status === "progress"
        ) {
          throw Error(
            "please recharge your master wallet or paid worker wallet fee"
          );
        }
        const balance = await SolanaConnection.getBalance(
          new PublicKey(workerWallet.public_key)
        );

        if (balance <= amount) {
          throw Error("insufficiant balance ");
        }

        const baseMint = new PublicKey(tokenAddress);

        const transfer = await transferToken(
          workerWallet.private_key,
          masterWallet.public_key,
          baseMint,
          amount
        );

        if (transfer) {
          const afterBal = await SolanaConnection.getBalance(
            new PublicKey(workerWallet.public_key)
          );
          workerWallet.balance = afterBal;
          await workerWallet.save();

          return "successfully token tranfered";
        } else {
          return "token transfer failed";
        }
      }
    } catch (error) {
      throw error;
    }
  };

  const bulkBuyAndSellHelper = async (
    pool_id: string,
    side: SwapSide,
    amountPerWallets: number,
    tradesPerInterval: string,
    boosterInterval: string,
    slippagePctg: number,
    buyOrSellCompletion: (datas: any, error: any, isError: any) => void,
    master_wallet: string
  ) => {
    try {
      console.log("started.....");

      let poolKeys: any = {};
      let baseToken: Token;

      const poolData = await PoolModel.findOne({ _id: pool_id });

      if (!poolData) {
        buyOrSellCompletion(
          { data: "" },
          {
            error: "batch not found",
          },
          { isError: true }
        );
        throw Error("pool batch not found");
      }

      let contract_address: any;
      if (poolData) {
        let token_id = poolData.tokenAddress.toString();

        contract_address = await UserContranctAddressModel.findOne({
          _id: token_id,
        });
      }

      let tokenAddress = contract_address?.tokenAddress;

      if (!contract_address) {
        buyOrSellCompletion(
          { data: "" },
          {
            error: "project not found invalid token address",
          },
          { isError: true }
        );
      }

      let baseMint = new PublicKey(tokenAddress);
      const poolId = await findPoolId(baseMint);
      const ammKeys = await formatAmmKeysById(poolId);
      const marketId = await findMarketId(baseMint);

      const marketBufferInfo: any = await SolanaConnection.getAccountInfo(
        marketId
      );

      const {
        quoteMint,
        baseLotSize,
        quoteLotSize,
        baseVault,
        quoteVault,
        bids,
        asks,
        eventQueue,
        requestQueue,
      } = MARKET_STATE_LAYOUT_V3.decode(marketBufferInfo.data);

      poolKeys = Liquidity.getAssociatedPoolKeys({
        version: 4,
        marketVersion: 3,
        baseMint,
        quoteMint,
        baseDecimals: ammKeys.baseDecimals,
        quoteDecimals: 9,
        marketId: new PublicKey(ammKeys.marketId),
        programId: PROGRAMIDS.AmmV4,
        marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
      });
      poolKeys.marketBaseVault = baseVault;
      poolKeys.marketQuoteVault = quoteVault;
      poolKeys.marketBids = bids;
      poolKeys.marketAsks = asks;
      poolKeys.marketEventQueue = eventQueue;

      baseToken = new Token(
        TOKEN_PROGRAM_ID,
        baseMint,
        ammKeys.baseMint == baseMint.toBase58()
          ? ammKeys.baseDecimals
          : ammKeys.quoteDecimals,
        "TokenMVB",
        "TVB"
      );

      let apiClient = createJupiterApiClient();

      const generateSwapAndExecute = async (
        wallet: any,
        boosterConfig: any,
        intToken: any,
        amountPerWallet: any,
        completPromis: () => Promise<void>
      ) => {
        console.log(
          `Prepare Trades ${
            side === "out" ? "buying" : "selling"
          } is started........!!`
        );

        buyOrSellCompletion(
          {
            data: `Prepare Trades ${
              side === "out" ? "buying" : "selling"
            } is started........!!`,
          },
          { error: "" },
          { isError: false }
        );

        const tns: any[] = [];

        let inTokenAmount = new TokenAmount(intToken, 0.0001, false);
        let outTokenAmount = new TokenAmount(baseToken, 1, false);

        let quoteResponseInit: any;

        if (boosterConfig) {
          quoteResponseInit = await apiClient.quoteGet({
            inputMint: "So11111111111111111111111111111111111111112",
            outputMint: tokenAddress,
            amount: amountPerWallet * LAMPORTS_PER_SOL,
            slippageBps: 5 * 100,
            autoSlippage: false,
            computeAutoSlippage: false,
            onlyDirectRoutes: false,
            swapMode: "ExactIn",
            asLegacyTransaction: false,
            maxAccounts: 64,
          });
        }

        let tokenBal = 0;
        let trade = " Preparing ";
        // let side: SwapSide = "out";
        inTokenAmount = new TokenAmount(intToken, amountPerWallet, false);
        outTokenAmount = new TokenAmount(
          baseToken,
          quoteResponseInit.otherAmountThreshold,
          true
        );

        const tokenAccount = await getWalletTokenAccount(
          SolanaConnection,
          new PublicKey(wallet.public_key),
          baseMint
        );

        if (tokenAccount.length > 0 && side === "in") {
          const tokenBalance = Number(
            tokenAccount[0].accountInfo.amount.toNumber().toFixed(0)
          );
          tokenBal = tokenBalance;

          if (tokenBal > Number(quoteResponseInit.otherAmountThreshold) / 8) {
            inTokenAmount = new TokenAmount(
              baseToken,
              quoteResponseInit.otherAmountThreshold,
              true
            );
            outTokenAmount = new TokenAmount(intToken, 0.0001, false);
          }
        }

        const wallets = Keypair.fromSecretKey(
          base58.decode(wallet.private_key)
        );

        let walletBal = await SolanaConnection.getBalance(
          new PublicKey(wallet?.public_key)
        );

        const publicKeyWallet = new PublicKey(wallets.publicKey);

        const walletTokenAccounts = await getWalletTokenAccounts(
          SolanaConnection,
          publicKeyWallet
        );

        const finalInst: TransactionInstruction[] = [];
        const { innerTransactions } = await Liquidity.makeSwapInstructionSimple(
          {
            connection: SolanaConnection,
            poolKeys,
            userKeys: {
              tokenAccounts: walletTokenAccounts,
              owner: publicKeyWallet,
            },
            amountIn: inTokenAmount,
            amountOut: outTokenAmount,
            fixedSide: side,
            makeTxVersion: TxVersion.V0,
          }
        );

        for (var ixL of innerTransactions) {
          for (var ix of ixL.instructions) {
            finalInst.push(ix);
          }
        }

        const addressesSwapMain: PublicKey[] = [];
        finalInst.forEach((ixn) => {
          ixn.keys.forEach((key: { pubkey: any }) => {
            addressesSwapMain.push(key.pubkey);
          });
        });

        const versionedTransaction = new Transaction()
          .add(PRIORITY_FEE_IX)
          .add(...finalInst);

        try {
          const blockhash = await SolanaConnection.getLatestBlockhash(
            "confirmed"
          );

          const saveTransaciton = await workerWalletTransactionModel.create({
            worker_wallet: wallet?._id,
            master_wallet: poolData.master_wallet,
            type: side === "out" ? "buy" : "sell",
            amount: side === "out" ? amountPerWallet : amountPerWallet,
            user: poolData.user,
            token_address: contract_address._id,
            slippagePctg: slippagePctg,
            boosterInterval: boosterInterval,
            tradesPerInterval: tradesPerInterval,
            amountPerWallet: amountPerWallet,
            signature_status: "progress",
          });

          const transactionnew = await transferSPL(
            contract_address.tokenAddress,
            amountPerWallet,
            wallet.public_key,
            wallets,
            TOKEN_PROGRAM_ID,
            finalInst
            // side
          );

          if (
            transactionnew &&
            transactionnew.trans &&
            transactionnew.newAccount
          ) {
            tns.push({
              transaction: transactionnew.trans,
              wallet: transactionnew.newAccount,
            });
          } else {
            tns.push({ transaction: versionedTransaction, wallet: wallets });
          }

          const responses = await Promise.all(
            tns.map(async (tnx) => {
              try {
                let trans: any;
                if (
                  transactionnew &&
                  transactionnew.trans === undefined &&
                  transactionnew.newAccount === undefined
                ) {
                  trans = tnx.transaction;
                  trans.recentBlockhash = blockhash.blockhash;
                  trans.feePayer = tnx.wallet.publicKey;
                  trans.sign(...[tnx.wallet]);
                } else {
                  trans = tnx.transaction;
                }

                // looping creates weird indexing issue with transactionMessages
                let sendTransaction = await sendSignedTransaction({
                  signedTransaction: trans,
                  connection: SolanaConnection,
                  skipPreflight: true,
                  successCallback: async (txSig: string) => {
                    saveTransaciton.signature = txSig;
                    saveTransaciton.signature_status = "success";
                    await saveTransaciton.save();
                    completPromis();
                    console.log(
                      "Sent Trasaction Success : Signature :" + txSig
                    );
                  },
                  sendingCallback: async (txSig: string) => {
                    buyOrSellCompletion(
                      {
                        data: `Sent Trasaction awaiting Confirmation "  ${txSig}`,
                      },
                      { error: "" },
                      { isError: false }
                    );
                    console.log(
                      "Sent Trasaction awaiting Confirmation " + txSig
                    );
                  },
                  confirmStatus: async (
                    txSig: string,
                    confirmStatus: string
                  ) => {
                    buyOrSellCompletion(
                      {
                        data: `"Recieved Transaction Confirmation :  ",
                      ${txSig}  ":"  ${confirmStatus}`,
                      },
                      { error: "" },
                      { isError: false }
                    );
                    console.log(
                      "Recieved Transaction Confirmation :  ",
                      txSig + ":" + confirmStatus
                    );
                  },
                });

                if (!sendTransaction) {
                  saveTransaciton.signature_status = "failed";
                  await saveTransaciton.save();
                }

                let accountWallet: any;

                accountWallet = Keypair.fromSecretKey(
                  base58.decode(wallet.private_key)
                );
                let tokenAccnt = await getWalletTokenAccount(
                  SolanaConnection,
                  accountWallet.publicKey,
                  baseMint
                );

                tokenBal = tokenAccnt[0]?.accountInfo?.amount
                  .toNumber()
                  .toFixed(0);

                saveTransaciton.token_balance = tokenBal ? Number(tokenBal) : 0;
                await saveTransaciton.save();

                wallet.token_balance = tokenBal ? Number(tokenBal) : 0;
                wallet.balance = walletBal / LAMPORTS_PER_SOL;
                await wallet.save();
              } catch (error) {
                console.log(new String(error));
                return null;
              }
            })
          );
          console.log(responses);
          return "successfully completed";
        } catch (error: any) {
          console.log(error);
          buyOrSellCompletion(
            { data: "" },
            { error: error },
            { isError: true }
          );
          throw error;
        }
      };

      for (let i = 0; i < poolData.wallets.length; i++) {
        const wallet = await WorkerWalletModel.findOne({
          _id: poolData.wallets[i].worker_wallet,
          isDeleted: false,
        });
        const isPaidWorkerWallet = await WorkerWalletPaymentModel.findOne({
          worker_wallet: wallet?._id,
          user: wallet?.user,
        });
        if (
          isPaidWorkerWallet?.status !== "paid" &&
          isPaidWorkerWallet?.payment_status !== "success"
        ) {
          buyOrSellCompletion(
            { data: "" },
            {
              error:
                "worker wallet paiment is not deducted please recharge your master wallet ",
            },
            {
              isError: true,
            }
          );
        }

        if (!wallet) {
          buyOrSellCompletion(
            { data: "" },
            {
              error: "wallet not found",
            },
            { isError: true }
          );
        }

        const boosterConfig = await UserContranctAddressModel.findOne({
          tokenAddress: tokenAddress,
        });

        const intToken = new Token(
          TOKEN_PROGRAM_ID,
          quoteMint,
          9,
          "SOL",
          "SOL"
        );

        const amountPerWallet = amountPerWallets || 0;

        if (
          poolData.wallets[i].trade === true &&
          poolData.wallets[i].status === "success"
        ) {
          i++;
          if (i === poolData.wallets.length) {
            if (
              poolData.status === "completed" &&
              poolData.isCompleted === true
            ) {
              buyOrSellCompletion(
                { data: "" },
                {
                  error: "create new batch this batch process completed",
                },
                { isError: true }
              );
            } else {
              (poolData.status = "completed"), (poolData.isCompleted = true);
              await poolData.save();

              buyOrSellCompletion(
                { data: "process completed" },
                { error: "" },
                { isError: false }
              );
            }
          } else {
            if (
              poolData.status === "completed" &&
              poolData.isCompleted === true
            ) {
              buyOrSellCompletion(
                { data: "" },
                { error: "create new batch this batch process completed" },
                { isError: true }
              );
            }
          }
        } else {
          const completPromis = async () => {
            try {
              if (poolData) {
                poolData.wallets[i].status = "success";
                poolData.wallets[i].trade = true;
                await poolData.save();
              }
              if (i === poolData?.wallets.length) {
                poolData.status = "completed";
                poolData.isCompleted = true;
                await poolData.save();
              }

              console.log(
                `${side === "out" ? "buying" : "selling"} is completed.....!!`
              );

              buyOrSellCompletion(
                {
                  data: `${
                    side === "out" ? "buying completed" : "selling completed"
                  }`,
                },
                { error: "" },
                { isError: false }
              );
            } catch (error: any) {
              console.log(error);
              buyOrSellCompletion(
                { data: "" },
                { error: error },
                { isError: true }
              );
            }
          };

          let completdFunction = await generateSwapAndExecute(
            wallet,
            boosterConfig,
            intToken,
            amountPerWallet,
            completPromis
          );

          if (completdFunction) {
            delay(10000);
          } else {
            if (i !== poolData.wallets.length) {
              i++;
            } else {
              buyOrSellCompletion(
                { data: "process completed" },
                { error: "" },
                { isError: false }
              );
            }
          }
        }
      }
    } catch (error: any) {
      console.log(error);

      buyOrSellCompletion({ data: "" }, { error: error }, { isError: true });
    }
  };

  return {
    singleBuyHelper,
    transferSolanaSingleWorkerWalletHelper,
    transferTokenHelper,
    bulkBuyAndSellHelper,
  };
};
