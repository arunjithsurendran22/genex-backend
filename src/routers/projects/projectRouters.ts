import express from "express";
import { userAuth } from "../../middlewares/userAuth";
import { userProjectControllers } from "../../controllers/projects/projectControllers";
import { workerWalletsControllers } from "../../controllers/workerWalletsControllers/workerWallets.controller";

const { verifyTokenAddress } = workerWalletsControllers();

const { allProjects, singleDetails, updateProject } = userProjectControllers();

const router = express.Router();

router.get("/all", userAuth, allProjects);
router.get("/single/:project_id", userAuth, singleDetails);
router.patch("/update/:project_id", userAuth, updateProject);
router.post("/verify-token", userAuth, verifyTokenAddress);

export default router;
