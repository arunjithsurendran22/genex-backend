import { Response } from "express";
import { CustomRequest } from "../../types/customRequestTypes";
import { sendErrorResponse } from "../../middlewares/sendError";
import { userTransactionHelpers } from "../../helpers/workerWallets/transactionHelper";
import mongoose from "mongoose";
import {
  transactionPoolValidation,
  withdrawValidation,
  workerToMasterWalletTransferValidation,
} from "../../validations/wallets/transactionValidations";

const {
  allTransactionHelper,
  singleTransactionDetailsHelper,
  userWithdrawSolanaHelper,
  transferWorkerToMaster,
  getAllTransactionsWorkerBaseHelper,
  workerWalletWasePaymentHistoryHelper,
} = userTransactionHelpers();

export const UserTransactions = () => {
  const allTransaction = async (req: CustomRequest, res: Response) => {
    try {
      const {
        limit,
        skip,
        fromDate,
        toDate,
        type,
        signature,
        highest,
        lowest,
        sort,
        wallet,
        project,
      } = req.query;
      const userId = req.user?._id as string;

      const filters: any = {};

      const otherFilter: any = {};

      if (wallet && wallet !== "") {
        otherFilter.wallet = wallet;
      }

      if (project && project !== "") {
        otherFilter.project = project;
      }

      if (signature && signature !== "") {
        filters.$or = [{ signature: { $regex: signature, $options: "i" } }];
      }

      if (highest && highest !== "") {
        filters.$or = [{ amount: { $gte: highest } }];
      }

      if (lowest && lowest !== "") {
        filters.$or = [{ amount: { $lte: lowest } }];
      }

      // if (sort && sort === "amtAsc") {
      //   filters.$or = [{ amount: { $gte: 1 } }];
      // }

      // if (sort && sort === "amtDsc") {
      //   filters.$or = [{ amount: { $gte: -1 } }];
      // }

      if (type && type !== "") {
        filters.$or = [{ type: { $regex: type, $options: "i" } }];
      }

      if (fromDate && fromDate !== "") {
        filters.createdAt = [{ $gte: fromDate }];
      }

      if (toDate && toDate !== toDate) {
        filters.createdAt = [{ $lte: toDate }];
      }

      if (userId) {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        filters.user = userObjectId;
      }

      const response = await allTransactionHelper(
        userId,
        Number(limit),
        Number(skip),
        filters,
        otherFilter,
        sort
      );
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const singleTransactionDetails = async (
    req: CustomRequest,
    res: Response
  ) => {
    try {
      const { id } = req.params;
      const response = await singleTransactionDetailsHelper(id);
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const withdrawSolana = async (req: CustomRequest, res: Response) => {
    try {
      const { error, value } = withdrawValidation.validate(req.body);
      if (error) return sendErrorResponse(res, 400, error);

      const userId = req.user?._id as string;
      const response = await userWithdrawSolanaHelper(req.body, userId);
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const transferSolanaWorkerToMaster = async (
    req: CustomRequest,
    res: Response
  ) => {
    try {
      const { wallets, master_wallet, amount } = req.body;
      const { error, value } = workerToMasterWalletTransferValidation.validate(
        req.body
      );

      if (error) return sendErrorResponse(res, 400, error);
      const response = await transferWorkerToMaster(
        wallets,
        master_wallet,
        Number(amount)
      );

      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const transactionsWorkerWalletbase = async (
    req: CustomRequest,
    res: Response
  ) => {
    try {
      const user = req.user?._id as string;
      const { worker_wallet } = req.params;
      const { limit, skip } = req.query;
      const response = await getAllTransactionsWorkerBaseHelper(
        worker_wallet,
        user,
        Number(limit),
        Number(skip)
      );

      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const getWorkerWalletPayments = async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?._id as string;
      const { worker_wallet } = req.params;
      const { limit, skip } = req.query;

      const response = await workerWalletWasePaymentHistoryHelper(
        userId,
        worker_wallet,
        Number(limit),
        Number(skip)
      );

      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  return {
    allTransaction,
    singleTransactionDetails,
    withdrawSolana,
    transferSolanaWorkerToMaster,
    transactionsWorkerWalletbase,
    getWorkerWalletPayments,
  };
};
