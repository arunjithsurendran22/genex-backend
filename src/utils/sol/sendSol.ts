import solanaWeb3, {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
// import { RPC_RUL } from "../../config/solanaConnection";
import bs58 from "bs58";
import { PublicKey } from "@metaplex-foundation/js";
import base58 from "bs58";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";

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

export const sendSolana = async (
  fromWallet: string,
  toWallet: PublicKey,
  amount: number
) => {
  try {
    const FromWallet = solanaWeb3.Keypair.fromSecretKey(
      bs58.decode(fromWallet.toString())
    );
    const transaction = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: FromWallet.publicKey,
        toPubkey: toWallet,
        lamports: amount,
      })
    );

    const signature = await solanaWeb3.sendAndConfirmTransaction(
      SolanaConnection,
      transaction,
      [FromWallet]
    );

    return signature;
  } catch (error) {
    throw error;
  }
};

export async function transferToken(
  senderPrivateKey: string,
  recipientPublicKey: string,
  tokenMintPubkey: PublicKey,
  amount: number
) {
  try {
    // Decode the sender's private key
    const senderKeypair = Keypair.fromSecretKey(bs58.decode(senderPrivateKey));
    const senderPubkey = senderKeypair.publicKey;
    const recipientPubkey = new PublicKey(recipientPublicKey);
    // const tokenMintPubkey = new PublicKey(tokenMintAddress);

    // Get the associated token addresses
    const senderTokenAddress = await getAssociatedTokenAddress(
      tokenMintPubkey,
      senderPubkey
    );
    const recipientTokenAddress = await getAssociatedTokenAddress(
      tokenMintPubkey,
      recipientPubkey
    );

    // Fetch the latest blockhash
    const { blockhash, lastValidBlockHeight } =
      await SolanaConnection.getLatestBlockhash();

    // Create a transaction
    const transaction = new Transaction().add(
      createTransferInstruction(
        senderTokenAddress, // sender token address
        recipientTokenAddress, // recipient token address
        senderPubkey, // owner of the sender token address
        amount, // amount to transfer (in smallest unit)
        [], // multisigners (empty array for single signer)
        TOKEN_PROGRAM_ID // token program id
      )
    );

    transaction.feePayer = senderPubkey;
    transaction.recentBlockhash = blockhash;

    transaction.sign(senderKeypair);

    const signature = await sendAndConfirmTransaction(
      SolanaConnection,
      transaction,
      [senderKeypair],
      {
        skipPreflight: true,
      }
    );

    console.log(`transaction successfull with signature : ${signature}`);
    return signature;
  } catch (error) {
    throw error;
  }
}
