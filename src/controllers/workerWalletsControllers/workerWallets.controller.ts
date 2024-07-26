import { Response } from "express";
import { CustomRequest } from "../../types/customRequestTypes";
import { sendErrorResponse } from "../../middlewares/sendError";
import { workerWalletsHelpers } from "../../helpers/workerWallets/workerWalletsHelpers";
import { createProjectValidation } from "../../validations/wallets/walletsValidations";
import { broadcast } from "../..";

const {
  createProjectHelper,
  getAllWorkerWalletsHelper,
  getWorkerWalletSingleDetailsHelper,
  workerWalletPaymentTransactionsHelper,
  getSingleWorkerWalletTransactionDetails,
  checkWalletBalanceHelper,
  verifyTokenAddressHelper,
} = workerWalletsHelpers();

export const workerWalletsControllers = () => {
  const createProject = async (req: CustomRequest, res: Response) => {
    try {
      const {
        wallet_count,
        contractAccount,
        userId,
        masterWalletId,
        isKeepMinimumBalance,
      } = req.body;

      const { error, value } = createProjectValidation.validate(req.body);

      if (error) return sendErrorResponse(res, 400, error);

      // Callback function to send WebSocket updates
      const onIterationComplete = (
        message: any,
        error: any,
        projectErr: any
      ) => {
        broadcast({ message, error, projectErr });
      };

      const response = createProjectHelper(
        Number(wallet_count),
        contractAccount,
        userId,
        masterWalletId,
        isKeepMinimumBalance,
        onIterationComplete
      );

      res.status(200).json({ message: "Worker wallet creation is processing" });
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const getWorkerWallets = async (req: CustomRequest, res: Response) => {
    try {
      const { master_wallet } = req.params;

      const { limit, skip, name } = req.query;

      const filters: any = {};

      if (name && name !== "") {
        filters.$or = [{ name: { $regex: name, $options: "i" } }];
      }

      const userId = req.user?._id as string;

      if (userId) {
        filters.user = userId;
      }

      if (master_wallet && master_wallet !== "") {
        filters.master_wallet = master_wallet;
      }

      const response = await getAllWorkerWalletsHelper(
        filters,
        master_wallet,
        Number(limit),
        Number(skip),
        userId
      );
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const getWorkerWalletSingle = async (req: CustomRequest, res: Response) => {
    try {
      const { wallet_id } = req.params;
      const response = await getWorkerWalletSingleDetailsHelper(wallet_id);
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const workerWalletTransaction = async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?._id as string;
      const { limit, skip } = req.query;
      const response = await workerWalletPaymentTransactionsHelper(
        userId,
        Number(limit),
        Number(skip)
      );
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const workerWalletTransactionSingle = async (
    req: CustomRequest,
    res: Response
  ) => {
    try {
      const userId = req.user?._id as string;
      const { trasaction_id } = req.params;

      const response = await getSingleWorkerWalletTransactionDetails(
        trasaction_id,
        userId
      );
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const checkWalletBalance = async (req: CustomRequest, res: Response) => {
    try {
      const { worker_wallet } = req.body;
      const response = await checkWalletBalanceHelper(worker_wallet);

      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const verifyTokenAddress = async (req: CustomRequest, res: Response) => {
    try {
      const { token_address } = req.body;

      if (!token_address && token_address === "") {
        const err = new Error("token_address is required");
        return sendErrorResponse(res, 400, err);
      }

      const response = await verifyTokenAddressHelper(token_address);

      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  return {
    createProject,
    getWorkerWallets,
    getWorkerWalletSingle,
    workerWalletTransaction,
    workerWalletTransactionSingle,
    checkWalletBalance,
    verifyTokenAddress,
  };
};
