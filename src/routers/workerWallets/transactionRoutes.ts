import express from "express";
import { UserTransactions } from "../../controllers/workerWalletsControllers/transactionControllers";
import { userAuth } from "../../middlewares/userAuth";

const router = express.Router();
const {
  allTransaction,
  singleTransactionDetails,

  withdrawSolana,
  transferSolanaWorkerToMaster,
  transactionsWorkerWalletbase,
  getWorkerWalletPayments,
} = UserTransactions();

router.get("/all", userAuth, allTransaction);
router.get("/single/:id", userAuth, singleTransactionDetails);
router.post("/withdraw-solana", userAuth, withdrawSolana);
router.post("/workerToMasterwallet", userAuth, transferSolanaWorkerToMaster);
router.get(
  "/all/worker/:worker_wallet",
  userAuth,
  transactionsWorkerWalletbase
);

router.get(
  "/worker/payment/all/:worker_wallet",
  userAuth,
  getWorkerWalletPayments
);

export default router;
