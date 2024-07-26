import { Response } from "express";
import { CustomRequest } from "../../types/customRequestTypes";
import { sendErrorResponse } from "../../middlewares/sendError";
import { SwapHelpers } from "../../helpers/swap/buyAndSellHelpers";
import {
  bulkTradeValidatoin,
  tradeValidation,
  transferSolanaValidation,
} from "../../validations/wallets/walletsValidations";
import { broadcast } from "../..";

const {
  singleBuyHelper,
  transferSolanaSingleWorkerWalletHelper,
  transferTokenHelper,
  bulkBuyAndSellHelper,
} = SwapHelpers();

export const SwapControllers = () => {
  const singleBuy = async (req: CustomRequest, res: Response) => {
    try {
      const {
        tokenAddress,
        worker_wallet,
        master_wallet,
        side,
        amountPerWallets,
        tradesPerInterval,
        boosterInterval,
        slippagePctg,
      } = req.body;

      const { error, value } = tradeValidation.validate(req.body);

      if (error) return sendErrorResponse(res, 400, error);

      const userId = req.user?._id as string;

      const response = await singleBuyHelper(
        worker_wallet,
        tokenAddress,
        master_wallet,
        side,
        userId,
        Number(amountPerWallets),
        tradesPerInterval,
        boosterInterval,
        Number(slippagePctg)
      );
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const transferSolanaWorkerWallet = async (
    req: CustomRequest,
    res: Response
  ) => {
    try {
      const { worker_wallet, master_wallet, amount } = req.body;
      const { error, value } = transferSolanaValidation.validate(req.body);

      if (error) return sendErrorResponse(res, 400, error);

      const userId = req.user?._id as string;

      const response = await transferSolanaSingleWorkerWalletHelper(
        worker_wallet,
        master_wallet,
        amount,
        userId
      );
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const transferTokens = async (req: CustomRequest, res: Response) => {
    try {
      const { tokenAddress, worker_wallet, master_wallet, amount } = req.body;
      const response = await transferTokenHelper(
        tokenAddress,
        worker_wallet,
        master_wallet,
        Number(amount)
      );
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const bulkBuyOrSell = async (req: CustomRequest, res: Response) => {
    try {
      const {
        pool_id,
        side,
        amountPerWallets,
        tradesPerInterval,
        boosterInterval,
        slippagePctg,
        master_wallet,
      } = req.body;

      const { error, value } = bulkTradeValidatoin.validate(req.body);

      if (error) return sendErrorResponse(res, 400, error);

      const buyOrSellCompletion = (data: any, error: any, isError: any) => {
        broadcast({ data, error, isError });
      };

      const response = bulkBuyAndSellHelper(
        pool_id,
        side,
        Number(amountPerWallets),
        tradesPerInterval,
        boosterInterval,
        Number(slippagePctg),
        buyOrSellCompletion,
        master_wallet
      );
      res.status(200).json({
        message: `your batch ${
          side === "out" ? "buying" : "selling"
        } is started successfully`,
      });
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  return {
    singleBuy,
    transferSolanaWorkerWallet,
    transferTokens,
    bulkBuyOrSell,
  };
};
