import { Keypair, PublicKey } from "@solana/web3.js";
import base58 from "bs58";
import { SolanaConnection } from "../../config/solanaConnection";

export const WalletsServices = () => {
  const createWalletService = async () => {
    try {
      const w = Keypair.generate();

      return {
        publicKey: w.publicKey.toBase58(),
        privateKey: base58.encode(w.secretKey),
      };
    } catch (error) {
      throw error;
    }
  };

  return {
    createWalletService,
  };
};
