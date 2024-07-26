import joi from "joi";

export const createProjectValidation = joi.object({
  wallet_count: joi.number().required(),
  contractAccount: joi.string().required(),
  masterWalletId: joi.string().required(),
  userId: joi.string().required(),
  isKeepMinimumBalance: joi.boolean().required(),
});

export const transferSolanaValidation = joi.object({
  worker_wallet: joi.array().items(joi.string().required()).required(),
  master_wallet: joi.string().required(),
  amount: joi.number().required(),
});

export const tradeValidation = joi.object({
  tokenAddress: joi.string().required(),
  worker_wallet: joi.string().required(),
  master_wallet: joi.string().required(),
  side: joi.string().required(),
  amountPerWallets: joi.number().required(),
  tradesPerInterval: joi.string().required(),
  boosterInterval: joi.string().required(),
  slippagePctg: joi.number().required(),
});

export const bulkTradeValidatoin = joi.object({
  pool_id: joi.string().required(),
  side: joi.string().required(),
  amountPerWallets: joi.number().required(),
  tradesPerInterval: joi.string().required(),
  boosterInterval: joi.string().required(),
  slippagePctg: joi.number().required(),
  master_wallet: joi.string().required(),
});
