import {
  getMint,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getOrCreateAssociatedTokenAccount,
  createTransferCheckedInstruction,
  createAssociatedTokenAccount,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
  sendAndConfirmTransaction,
  Account,
} from "@solana/web3.js";
import {
  PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { SwapSide } from "@raydium-io/raydium-sdk";
import { bool, publicKey, struct, u32, u64, u8 } from "@raydium-io/raydium-sdk";

export const RPC_URL =
  "https://mainnet.helius-rpc.com/?api-key=f0c11eb0-ccc8-4f5f-afb3-b11308f4e46e";

export const SolanaConnection = new Connection(RPC_URL, "confirmed");

export const getTokenAddress = async (mintAddress: string) => {
  try {
    const token = new PublicKey(mintAddress);

    // Fetch mint information
    const mintInfo = await getMint(SolanaConnection, token, "confirmed");

    if (mintInfo.address) {
      return "token address verificaiton successfully completed";
    } else {
      return "invalid token address";
    }
  } catch (error) {
    console.error("Error fetching token details:", error);
  }
};

// export const createToken = async (
//   payer: Signer,
//   name: any,
//   symbol: any,
//   decimals: number,
//   amount: number,
//   mintKey: Keypair,
//   master_key: Keypair
// ) => {
//   try {
//     const uri = "https:static.googleapis.com";

//     console.log("creating token.....");

//     const lamports = await getMinimumBalanceForRentExemptMint(SolanaConnection);
//     const tokenATA = await getAssociatedTokenAddress(
//       mintKey.publicKey,
//       payer.publicKey
//     );

//     console.log(new Date().toString());

//     const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
//       {
//         metadata: PublicKey.findProgramAddressSync(
//           [
//             Buffer.from("metadata"),
//             PROGRAM_ID.toBuffer(),
//             mintKey.publicKey.toBuffer(),
//           ],
//           PROGRAM_ID
//         )[0],
//         mint: mintKey.publicKey,
//         mintAuthority: payer.publicKey,
//         payer: payer.publicKey,
//         updateAuthority: payer.publicKey,
//       },
//       {
//         createMetadataAccountArgsV3: {
//           data: {
//             name: name,
//             symbol: symbol,
//             uri: uri,
//             creators: null,
//             sellerFeeBasisPoints: 0,
//             uses: null,
//             collection: null,
//           },
//           isMutable: false,
//           collectionDetails: null,
//         },
//       }
//     );

//     const createNewTokenTransaction = new Transaction().add(
//       SystemProgram.createAccount({
//         fromPubkey: payer.publicKey,
//         newAccountPubkey: mintKey.publicKey,
//         space: MINT_SIZE,
//         lamports: lamports,
//         programId: TOKEN_PROGRAM_ID,
//       }),
//       createInitializeMintInstruction(
//         mintKey.publicKey,
//         decimals,
//         payer.publicKey,
//         payer.publicKey,
//         TOKEN_PROGRAM_ID
//       ),
//       createAssociatedTokenAccountInstruction(
//         payer.publicKey,
//         tokenATA,
//         payer.publicKey,
//         mintKey.publicKey
//       ),
//       createMintToInstruction(
//         payer.publicKey,
//         tokenATA,
//         payer.publicKey,
//         amount * Math.pow(10, decimals)
//       ),
//       createMetadataInstruction
//     );

//     createNewTokenTransaction.recentBlockhash = (
//       await SolanaConnection.getRecentBlockhash()
//     ).blockhash;

//     createNewTokenTransaction.feePayer = master_key.publicKey;
//     createNewTokenTransaction.sign(...[master_key, mintKey]);

//     return createNewTokenTransaction;
//   } catch (error) {
//     throw error;
//   }
// };

export function sleep(arg0: number) {
  return new Promise((resolve) => setTimeout(resolve, arg0));
}

export const SEND_AMT = 0.001 * LAMPORTS_PER_SOL;
export const PRIORITY_FEE_IX = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: SEND_AMT,
});

export const createToken = async (
  payer: Signer,
  name: any,
  symbol: any,
  decimals: number,
  amount: number,
  newWallet: Keypair
) => {
  let connection = SolanaConnection;
  const uri = "https:static.googleapis.com";
  console.log("Creating token...");
  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  // const mintKeypair = Keypair.generate();
  const mintKeypair = newWallet;
  const tokenATA = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    payer.publicKey
  );

  console.log(new Date().toString());
  const createNewTokenTransaction = new Transaction().add(PRIORITY_FEE_IX).add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: MINT_SIZE,
      lamports: lamports,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      payer.publicKey,
      null,
      TOKEN_PROGRAM_ID
    ),
    createAssociatedTokenAccountInstruction(
      payer.publicKey,
      tokenATA,
      payer.publicKey,
      mintKeypair.publicKey
    ),
    createMintToInstruction(
      mintKeypair.publicKey,
      tokenATA,
      payer.publicKey,
      amount * 0.8 * Math.pow(10, decimals),
      [payer]
    )
  );
  const signature = await sendAndConfirmTransaction(
    connection,
    createNewTokenTransaction,
    [payer, mintKeypair]
  );
  console.log(`Signature: ${signature}`);
  console.log(`Token Mint: ${mintKeypair.publicKey.toBase58()}`);

  const mintAddress = mintKeypair.publicKey.toBase58();
  console.log("Creating meta-data transactions...");
  const mint = new PublicKey(mintAddress);
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), PROGRAM_ID.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
  console.log("METADATA_PDA:", metadataPDA.toBase58());

  const tokenMetadata = {
    name: name,
    symbol: symbol,
    uri: uri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };
  const transaction = new Transaction().add(PRIORITY_FEE_IX).add(
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mint,
        mintAuthority: payer.publicKey,
        payer: payer.publicKey,
        updateAuthority: payer.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: tokenMetadata,
          isMutable: true,
          collectionDetails: null,
        },
      }
    )
  );
  let trans = await sendConfirm(connection, transaction, payer);

  console.log(`Token Mint: ${mintKeypair.publicKey.toBase58()}`);

  console.log('Token has been Generated Now Run , "yarn revokeToken"');

  return transaction;
};
async function sendConfirm(
  connection: Connection,
  transaction: Transaction,
  payer: Signer
) {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  let blockheight = await connection.getBlockHeight();

  console.log(" TRY  ");
  let signature = "";
  while (blockheight < lastValidBlockHeight) {
    if (signature != "") {
      const a = await connection.getSignatureStatus(signature);
      if (!a.value?.err) break;
    }
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    transaction.recentBlockhash = blockhash;
    transaction.sign(payer);
    const rawTransaction = transaction.serialize();

    signature = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
    });
    console.log(`Signature: ${signature}`);
    await sleep(500);
    console.log("RETRY AGAIN");
    blockheight = await connection.getBlockHeight();
  }
}

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

export const transferSPL = async (
  tokenMintAddress: string,
  amount: string,
  destAddress: string,
  txWallet: Keypair,
  programId: PublicKey,
  finalInst: any
) => {
  try {
    const mintPubkey = new PublicKey(tokenMintAddress);

    const destPubkey = new PublicKey(destAddress);

    let fromTokenAccount: any;
    try {
      fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        SolanaConnection,
        txWallet,
        mintPubkey,
        txWallet.publicKey
      );
      if (fromTokenAccount) {
        console.log("exist token", fromTokenAccount);

        const tokenAccountBalance =
          await SolanaConnection.getTokenAccountBalance(
            fromTokenAccount.address
          );

        const decimals = tokenAccountBalance.value.decimals;
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
          SolanaConnection,
          txWallet,
          mintPubkey,
          destPubkey
        );

        console.log(
          amount +
            ":" +
            Math.floor(Number(amount) * 10 ** decimals) +
            ":" +
            decimals
        );
        const transaction = new Transaction()
          .add(...finalInst)
          .add(
            createTransferCheckedInstruction(
              fromTokenAccount.address,
              mintPubkey,
              toTokenAccount.address,
              txWallet.publicKey,
              Math.floor(Number(amount) * 10 ** decimals),
              decimals
            )
          );
        const txhash = await SolanaConnection.sendTransaction(transaction, [
          txWallet,
        ]);

        return { trans: undefined, newAccount: undefined };
      }
    } catch (error: any) {
      console.log(error, ".........................error");

      if (
        error === "TokenAccountNotFoundError" ||
        error.message === "TokenAccountNotFoundError" ||
        error
      ) {
        let signer: Array<Account> = [];
        let publicKey: PublicKey;
        const newAccount = new Account();
        publicKey = newAccount.publicKey;

        const { blockhash } = await SolanaConnection.getRecentBlockhash(
          "confirmed"
        );

        const transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: txWallet.publicKey,
        })
          .add(
            SystemProgram.createAccount({
              fromPubkey: new PublicKey(destAddress),
              newAccountPubkey: publicKey,
              lamports:
                Number(amount) ??
                (await SolanaConnection.getMinimumBalanceForRentExemption(
                  ACCOUNT_LAYOUT.span
                )),
              space: ACCOUNT_LAYOUT.span,
              programId,
            })
          )
          .add(...finalInst);
        signer.push(newAccount);
        transaction.sign(newAccount);
        const txhash = await SolanaConnection.sendTransaction(transaction, [
          txWallet,
          newAccount,
        ]);

        return { trans: transaction, newAccount: newAccount };
      } else {
        console.log("error not found this one");
      }
    }
  } catch (error) {
    throw error;
  }
};

export async function createProgramAccountIfNotExist(
  connection: Connection,
  account: string | undefined | null,
  owner: PublicKey,
  programId: PublicKey,
  lamports: number | null,
  layout: any,

  transaction: Transaction,
  signer: Array<Account>
) {
  let publicKey: PublicKey;

  if (account) {
    publicKey = new PublicKey(account);
  } else {
    const newAccount = new Account();
    publicKey = newAccount.publicKey;

    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: owner,
        newAccountPubkey: publicKey,
        lamports:
          lamports ??
          (await connection.getMinimumBalanceForRentExemption(layout.span)),
        space: layout.span,
        programId,
      })
    );

    signer.push(newAccount);
  }

  return publicKey;
}

// export const transferSPL = async (
//   tokenMintAddress: string,
//   amount: string,
//   destAddress: string,
//   txWallet: Keypair,
//   type: string
// ): Promise<Transaction> => {
//   try {
//

//     const mintPubkey = new PublicKey(tokenMintAddress);
//     const destPubkey = new PublicKey(destAddress);

//     // Determine the source and destination based on the type of transaction
//     const fromPubkey = type === "in" ? txWallet.publicKey : destPubkey;
//     const toPubkey = type === "in" ? destPubkey : txWallet.publicKey;

//     // Attempt to get or create the associated token account for the source
//     let fromTokenAccount: any;
//     try {
//       fromTokenAccount = await getOrCreateAssociatedTokenAccount(
//         SolanaConnection,
//         txWallet,
//         mintPubkey,
//         fromPubkey
//       );
//     } catch (error: any) {
//       console.log(error, "errrororororroro");

//       // If TokenAccountNotFoundError, attempt to create the associated token account
//       if (error === "TokenAccountNotFoundError") {

//         console.log(`Creating associated token account for ${fromPubkey}`);

//         const associatedTokenAddress = await createAssociatedTokenAccount(
//           SolanaConnection,
//           txWallet,
//           mintPubkey,
//           fromPubkey
//         );

//         console.log(
//           `Associated token account created: ${associatedTokenAddress}`
//         );

//         // Retry fetching the account after creation
//         fromTokenAccount = await getOrCreateAssociatedTokenAccount(
//           SolanaConnection,
//           txWallet,
//           mintPubkey,
//           fromPubkey
//         );
//       } else {
//         throw error; // Rethrow other errors
//       }
//     }

//     const tokenAccountBalance = await SolanaConnection.getTokenAccountBalance(
//       fromTokenAccount.address
//     );

//     const decimals = tokenAccountBalance.value.decimals;
//     const transferAmount = Math.floor(Number(amount) * 10 ** decimals);

//     if (
//       type === "in" &&
//       Number(tokenAccountBalance.value.amount) < transferAmount
//     ) {
//       throw new Error(
//         "Insufficient funds in the source account for the transfer."
//       );
//     }

//     // Get or create the associated token account for the destination
//     const toTokenAccount = await getOrCreateAssociatedTokenAccount(
//       SolanaConnection,
//       txWallet,
//       mintPubkey,
//       toPubkey
//     );

//     console.log(`${amount}:${transferAmount}:${decimals}`);

//     const transaction = new Transaction().add(
//       createTransferCheckedInstruction(
//         fromTokenAccount.address,
//         mintPubkey,
//         toTokenAccount.address,
//         txWallet.publicKey,
//         transferAmount,
//         decimals
//       )
//     );

//     const txhash = await SolanaConnection.sendTransaction(transaction, [
//       txWallet,
//     ]);

//     return transaction;
//   } catch (error) {
//     console.error("Error in transferSPL:", error);
//     throw error;
//   }
// };
