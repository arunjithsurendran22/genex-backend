import joi from "joi";

export const updateProjectValidations = joi.object({
  tokenAddress: joi.string().required(),
  token_supply: joi.number(),
  decimals: joi.number(),
});
