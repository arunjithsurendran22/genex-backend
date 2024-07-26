import {
  Connection,
  PublicKey,
  Transaction,
  TransactionSignature,
} from "@solana/web3.js";

import {
  DEVNET_PROGRAM_ID,
  LIQUIDITY_STATE_LAYOUT_V4,
  MAINNET_PROGRAM_ID,
  MARKET_STATE_LAYOUT_V3,
  Liquidity,
  Market,
  SPL_MINT_LAYOUT,
  TOKEN_PROGRAM_ID,
  SPL_ACCOUNT_LAYOUT,
} from "@raydium-io/raydium-sdk";
// import { SolanaConnection, devNet } from "../../config/solanaConnection";

// const RPC_URL =
//   process.env.RPC_URL ||
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
const devNet = false;

const DEFAULT_TIMEOUT = 50000;

const quoteMint = new PublicKey("So11111111111111111111111111111111111111112");
export const openbookProgram = devNet
  ? DEVNET_PROGRAM_ID.OPENBOOK_MARKET
  : MAINNET_PROGRAM_ID.OPENBOOK_MARKET;
export const raydiumProgram = devNet
  ? DEVNET_PROGRAM_ID.AmmV4
  : MAINNET_PROGRAM_ID.AmmV4;

export const getUnixTs = () => {
  return new Date().getTime() / 100;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const raydiumUtils = () => {
  const findPoolId = async (baseMint: PublicKey) => {
    try {
      let filters = [
        {
          memcmp: {
            offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf("baseMint"),
            bytes: baseMint.toBase58(),
          },
        },
        {
          memcmp: {
            offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf("quoteMint"),
            bytes: quoteMint.toBase58(),
          },
        },
      ];

      let resp: any = await SolanaConnection.getProgramAccounts(
        raydiumProgram,
        {
          encoding: "base64",
          filters,
        }
      );

      if (!resp.length) {
        filters = [
          {
            memcmp: {
              offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf("baseMint"),
              bytes: quoteMint.toBase58(),
            },
          },
          {
            memcmp: {
              offset: LIQUIDITY_STATE_LAYOUT_V4.offsetOf("quoteMint"),
              bytes: baseMint.toBase58(),
            },
          },
        ];

        resp = await SolanaConnection.getProgramAccounts(raydiumProgram, {
          encoding: "base64",
          filters,
        });
      }

      const poolId = resp[0]?.pubkey;
      return poolId;
    } catch (error) {
      console.log(error);

      throw error;
    }
  };

  const formatAmmKeysById = async (id: string) => {
    try {
      const account = await SolanaConnection.getAccountInfo(new PublicKey(id));
      if (account === null) throw Error(" get id info error ");
      const info = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);

      const marketId = info.marketId;
      const marketAccount = await SolanaConnection.getAccountInfo(marketId);
      if (marketAccount === null) throw Error(" get market info error");
      const marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data);

      const lpMint = info.lpMint;
      const lpMintAccount = await SolanaConnection.getAccountInfo(lpMint);
      if (lpMintAccount === null) throw Error(" get lp mint info error");

      const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data);

      return {
        id,
        baseMint: info.baseMint.toString(),
        quoteMint: info.quoteMint.toString(),
        lpMint: info.lpMint.toString(),
        baseDecimals: info.baseDecimal.toNumber(),
        quoteDecimals: info.quoteDecimal.toNumber(),
        lpDecimals: lpMintInfo.decimals,
        version: 4,
        programId: account.owner.toString(),
        authority: Liquidity.getAssociatedAuthority({
          programId: account.owner,
        }).publicKey.toString(),
        openOrders: info.openOrders.toString(),
        targetOrders: info.targetOrders.toString(),
        baseVault: info.baseVault.toString(),
        quoteVault: info.quoteVault.toString(),
        withdrawQueue: info.withdrawQueue.toString(),
        lpVault: info.lpVault.toString(),
        marketVersion: 3,
        marketProgramId: info.marketProgramId.toString(),
        marketId: info.marketId.toString(),
        marketAuthority: Market.getAssociatedAuthority({
          programId: info.marketProgramId,
          marketId: info.marketId,
        }).publicKey.toString(),
        marketBaseVault: marketInfo.baseVault.toString(),
        marketQuoteVault: marketInfo.quoteVault.toString(),
        marketBids: marketInfo.bids.toString(),
        marketAsks: marketInfo.asks.toString(),
        marketEventQueue: marketInfo.eventQueue.toString(),
        lookupTableAccount: PublicKey.default.toString(),
      };
    } catch (error) {
      console.log(error);

      throw error;
    }
  };

  const findMarketId = async (baseMint: PublicKey) => {
    try {
      let filters = [
        {
          memcmp: {
            offset: MARKET_STATE_LAYOUT_V3.offsetOf("baseMint"),
            bytes: baseMint.toBase58(),
          },
        },
        {
          memcmp: {
            offset: MARKET_STATE_LAYOUT_V3.offsetOf("quoteMint"),
            bytes: quoteMint.toBase58(),
          },
        },
      ];

      let resp: any = await SolanaConnection.getProgramAccounts(
        openbookProgram,
        {
          encoding: "base64",
          filters,
        }
      );

      if (resp.length == 0) {
        filters = [
          {
            memcmp: {
              offset: MARKET_STATE_LAYOUT_V3.offsetOf("baseMint"),
              bytes: quoteMint.toBase58(),
            },
          },
          {
            memcmp: {
              offset: MARKET_STATE_LAYOUT_V3.offsetOf("quoteMint"),
              bytes: baseMint.toBase58(),
            },
          },
        ];

        resp = await SolanaConnection.getProgramAccounts(openbookProgram, {
          encoding: "base64",
          filters,
        });
      }

      const marketId = resp[0]?.pubkey;

      return marketId;
    } catch (error) {
      console.log(error);

      throw error;
    }
  };

  // const sendSignedTransaction = async ({
  //   signedTransaction,
  //   connection,
  //   successCallback,
  //   sendingCallback,
  //   timeout = DEFAULT_TIMEOUT,
  //   skipPreflight = true,
  // }: {
  //   signedTransaction: any;
  //   connection: Connection;
  //   successCallback?: (txSig: string) => Promise<void>;
  //   sendingCallback: (txid: string) => Promise<void>;
  //   // sentCallback?: (txSig: string) => void;
  //   timeout?: number;
  //   skipPreflight?: boolean;
  // }): Promise<string> => {
  //   const rawTransaction = signedTransaction.serialize();
  //   const startTime = getUnixTs();

  //   sendingCallback && sendingCallback("sending");

  //   const txid: TransactionSignature = await connection.sendRawTransaction(
  //     rawTransaction,
  //     {
  //       skipPreflight,
  //     }
  //   );

  //   console.log("Started awaiting confirmation for", txid);

  //   let done = false;
  //   (async () => {
  //     while (!done && getUnixTs() - startTime < timeout) {
  //       connection.sendRawTransaction(rawTransaction, {
  //         skipPreflight: true,
  //       });
  //       await sleep(300);
  //     }
  //   })();
  //   try {
  //     await awaitTransactionSignatureConfirmation(txid, timeout, connection);
  //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   } catch (err: any) {
  //     if (err.timeout) {
  //       throw new Error("Timed out awaiting confirmation on transaction");
  //     }
  //     const simulateResult = await connection.simulateTransaction(
  //       signedTransaction
  //     );
  //     if (simulateResult && simulateResult.value.err) {
  //       if (simulateResult.value.logs) {
  //         for (let i = simulateResult.value.logs.length - 1; i >= 0; --i) {
  //           const line = simulateResult.value.logs[i];
  //           if (line.startsWith("Program log: ")) {
  //             throw new Error(
  //               "Transaction failed: " + line.slice("Program log: ".length)
  //             );
  //           }
  //         }
  //       }
  //       throw new Error(JSON.stringify(simulateResult.value.err));
  //     }
  //     throw new Error("Transaction failed");
  //   } finally {
  //     done = true;
  //   }

  //   successCallback && successCallback(txid);

  //   console.log("Latency", txid, getUnixTs() - startTime);
  //   return txid;
  // };

  const sendSignedTransaction = async ({
    signedTransaction,
    connection,
    successCallback,
    sendingCallback,
    confirmStatus,
    timeout = DEFAULT_TIMEOUT,
    skipPreflight = true,
  }: {
    signedTransaction: any;
    connection: Connection;
    successCallback: (txSig: string) => Promise<void>;
    sendingCallback: (txSig: string) => Promise<void>;
    confirmStatus: (txSig: string, confirmationStatus: string) => Promise<void>;
    timeout?: number;
    skipPreflight?: boolean;
  }) => {
    try {
      const rawTransaction = signedTransaction.serialize();
      const startTime = getUnixTs();

      const txid: TransactionSignature = await connection.sendRawTransaction(
        rawTransaction,
        {
          skipPreflight,
        }
      );
      sendingCallback && sendingCallback(txid);

      console.log("Started awaiting confirmation for", txid);

      let done = false;
      (async () => {
        while (!done && getUnixTs() - startTime < timeout) {
          connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
          });
          await sleep(1000);
        }
      })();
      try {
        await awaitTransactionSignatureConfirmation(
          txid,
          timeout,
          connection
          // confirmStatus
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err.timeout) {
          throw new Error("Timed out awaiting confirmation on transaction");
        }
        const simulateResult = await connection.simulateTransaction(
          signedTransaction
        );
        if (simulateResult && simulateResult.value.err) {
          if (simulateResult.value.logs) {
            for (let i = simulateResult.value.logs.length - 1; i >= 0; --i) {
              const line = simulateResult.value.logs[i];
              if (line.startsWith("Program log: ")) {
                throw new Error(
                  "Transaction failed: " + line.slice("Program log: ".length)
                );
              }
            }
          }
          confirmStatus(txid, "AlreadyProcessed");
        }
        throw new Error("Transaction failed");
      } finally {
        done = true;
      }

      console.log(
        "Latency",
        txid,
        Number(getUnixTs() - startTime).toFixed(0) + "Seconds"
      );
      successCallback && successCallback(txid);

      return txid;
    } catch (error) {
      throw error;
    }
  };

  return {
    findPoolId,
    findMarketId,
    formatAmmKeysById,
    sendSignedTransaction,
  };
};

async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection
) {
  let done = false;
  const result = await new Promise((resolve, reject) => {
    (async () => {
      setTimeout(() => {
        console.log(done, "show done");

        if (done) {
          return;
        }
        done = true;
        console.log("Timed out for txid", txid);
        reject({ timeout: true });
      }, timeout);
      try {
        connection.onSignature(
          txid,
          (result) => {
            console.log("WS confirmed", txid, result);
            done = true;
            if (result.err) {
              reject(result.err);
            } else {
              resolve(result);
            }
          },
          connection.commitment
        );
        console.log("Set up WS connection", txid);
      } catch (e) {
        done = true;
        console.log("WS error in setup", txid, e);
      }
      while (!done) {
        // eslint-disable-next-line no-loop-func
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ]);
            const result = signatureStatuses && signatureStatuses.value[0];
            if (!done) {
              if (!result) {
                // console.log("REST null result for", txid, result);
              } else if (result.err) {
                console.log("REST error for", txid, result.err);
                done = true;
                reject(result.err);
              } else if (
                !(
                  result.confirmations ||
                  result.confirmationStatus === "confirmed" ||
                  result.confirmationStatus === "finalized"
                )
              ) {
                console.log("REST not confirmed", txid, result);
              } else {
                console.log("REST confirmed", txid, result);
                done = true;
                resolve(result);
              }
            }
          } catch (e) {
            if (!done) {
              console.log("REST connection error: txid", txid, e);
            }
          }
        })();
        await sleep(300);
      }
    })();
  });
  done = true;
  return result;
}

// async function awaitTransactionSignatureConfirmation(
//   txid: TransactionSignature,
//   timeout: number,
//   connection: Connection,
//   confirmStatus: (txSig: string, confirmationStatus: any) => Promise<void>
// ) {
//   let done = false;
//   const result = await new Promise((resolve, reject) => {
//     (async () => {
//       while (!done) {
//         // eslint-disable-next-line no-loop-func
//         (async () => {
//           try {
//             const signatureStatuses = await connection.getSignatureStatuses([
//               txid,
//             ]);
//             const result = signatureStatuses && signatureStatuses.value[0];
//             if (!done) {
//               if (!result) {
//                 // console.log('REST null result for', txid, result);
//               } else if (result.err) {
//                 console.log("REST error for", txid, result.confirmationStatus);
//                 done = true;
//                 confirmStatus(txid, result.confirmationStatus);
//                 reject(result.err);
//               } else if (
//                 !(
//                   result.confirmations ||
//                   result.confirmationStatus === "confirmed" ||
//                   result.confirmationStatus === "finalized"
//                 )
//               ) {
//                 console.log(
//                   "REST not confirmed",
//                   txid,
//                   result.confirmationStatus
//                 );
//                 confirmStatus(txid, result.confirmationStatus);
//               } else {
//                 console.log("REST confirmed", txid, result.confirmationStatus);
//                 confirmStatus(txid, result.confirmationStatus);
//                 done = true;
//                 resolve(result);
//               }
//             }
//           } catch (e) {
//             if (!done) {
//               console.log("REST connection error: txid", txid, e);
//             }
//           }
//         })();
//         await sleep(1000);
//       }
//     })();
//   });
//   done = true;
//   return result;
// }
