import express from "express";
import { userAuth } from "../../middlewares/userAuth";
import { SwapControllers } from "../../controllers/swap/buyAndSellControllers";

const router = express.Router();

const { singleBuy, transferSolanaWorkerWallet, transferTokens, bulkBuyOrSell } =
  SwapControllers();

router.post("/buy-sell", userAuth, singleBuy);
router.post("/transfer-solana", userAuth, transferSolanaWorkerWallet);
router.post("/transfer-token", userAuth, transferTokens);
router.post("/bulk-buy-sell", userAuth, bulkBuyOrSell);

export default router;
