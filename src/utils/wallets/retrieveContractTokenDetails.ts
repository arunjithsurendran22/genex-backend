import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import axios from "axios";

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

// Function to get token details
export async function getUserContractTokenDetails(mintAddress: PublicKey) {
  try {
    // Fetch mint information
    const mintInfo = await getMint(SolanaConnection, mintAddress, "confirmed");

    // Log token details
    return mintInfo;
  } catch (error) {
    console.error("Error fetching token details:", error);
  }
}

export async function getTokenDetails(mintAddress: string) {
  try {
    // Get Token Supply
    const tokenSupply = await SolanaConnection.getTokenSupply(
      new PublicKey(mintAddress)
    );

    // Get Token Account Balance
    const tokenAccounts = await SolanaConnection.getTokenAccountsByOwner(
      new PublicKey(mintAddress),
      {
        mint: new PublicKey(mintAddress),
      }
    );

    // Fetch additional metadata from Solscan
    const solscanUrl = `https://public-api.solscan.io/token/meta?tokenAddress=${mintAddress}`;
    const tokenMetadataResponse = await axios.get(solscanUrl);
    const tokenMetadata = tokenMetadataResponse.data;

    return {
      supply: tokenSupply.value.amount,
      tokenAccounts: tokenAccounts.value,
      metadata: tokenMetadata,
    };
  } catch (error) {
    throw error;
  }
}
