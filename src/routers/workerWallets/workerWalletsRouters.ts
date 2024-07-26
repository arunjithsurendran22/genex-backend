import express from "express";
import { userAuth } from "../../middlewares/userAuth";
import { workerWalletsControllers } from "../../controllers/workerWalletsControllers/workerWallets.controller";

const router = express.Router();

const {
  createProject,
  getWorkerWallets,
  getWorkerWalletSingle,
  workerWalletTransaction,
  workerWalletTransactionSingle,
  checkWalletBalance,
} = workerWalletsControllers();

router.post("/create-project", userAuth, createProject);
router.get("/all/worker-wallets/:master_wallet", userAuth, getWorkerWallets);
router.get("/single/worker-wallet/:wallet_id", userAuth, getWorkerWalletSingle);
router.get("/worker-wallet/transactions", userAuth, workerWalletTransaction);
router.get(
  "/worker-wallet/transaction/single/:trasaction_id",
  userAuth,
  workerWalletTransactionSingle
);
router.post("/check-worker-balance", userAuth, checkWalletBalance);

export default router;
