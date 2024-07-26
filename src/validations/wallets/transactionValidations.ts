import joi from "joi";

export const transactionPoolValidation = joi.object({
  wallets: joi
    .array()
    .items(
      joi.object({
        worker_wallet: joi.string().required(),
        status: joi.string().required(),
      })
    )
    .required(),
  tokenAddress: joi.string().required(),
  master_wallet: joi.string().required(),
});

export const withdrawValidation = joi.object({
  amount: joi.number().required(),
  master_wallet: joi.string().required(),
  toWallet_pubkey: joi.string().required(),
});

export const workerToMasterWalletTransferValidation = joi.object({
  wallets: joi.array().items(joi.string().required()).required(),
  master_wallet: joi.string().required(),
  amount: joi.number().required(),
});
