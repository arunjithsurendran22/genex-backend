import { devNet } from "./solanaConnection";
import { DEVNET_PROGRAM_ID, MAINNET_PROGRAM_ID } from "@raydium-io/raydium-sdk";
import { ComputeBudgetProgram } from "@solana/web3.js";

export const PROGRAMIDS = devNet ? DEVNET_PROGRAM_ID : MAINNET_PROGRAM_ID;

export const SEND_AMT = 21000;
export const PRIORITY_FEE_IX = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: SEND_AMT,
});