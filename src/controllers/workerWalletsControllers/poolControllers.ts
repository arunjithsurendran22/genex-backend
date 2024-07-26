import { transactionPoolValidation } from "../../validations/wallets/transactionValidations";
import { CustomRequest } from "../../types/customRequestTypes";
import { Response } from "express";
import { sendErrorResponse } from "../../middlewares/sendError";
import { UserPoolHelpers } from "../../helpers/workerWallets/poolHelpers";

const { allPoolHelper, createTransactionPoolHelper, singlePoolHelper } =
  UserPoolHelpers();

export const UserPoolControllers = () => {
  const createTransactionPool = async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?._id as string;
      const { error, value } = transactionPoolValidation.validate(req.body);
      if (error) return sendErrorResponse(res, 400, error);

      const response = await createTransactionPoolHelper(req.body, userId);
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const singlePool = async (req: CustomRequest, res: Response) => {
    try {
      const { poolId } = req.params;
      const response = await singlePoolHelper(poolId);
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const allPool = async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?._id as string;
      const { limit, skip } = req.query;
      const response = await allPoolHelper(userId, Number(limit), Number(skip));
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  return {
    allPool,
    singlePool,
    createTransactionPool,
  };
};
