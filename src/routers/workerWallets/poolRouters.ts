import express from "express";
import { userAuth } from "../../middlewares/userAuth";
import { UserPoolControllers } from "../../controllers/workerWalletsControllers/poolControllers";

const router = express.Router();

const { allPool, createTransactionPool, singlePool } = UserPoolControllers();

router.post("/create", userAuth, createTransactionPool);
router.get("/single/:poolId", userAuth, singlePool);
router.get("/all", userAuth, allPool);

export default router;
