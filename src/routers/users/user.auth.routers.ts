import express from "express";
import { UserAuthControllers } from "../../controllers/auth/user.auth.controllers";
import { userAuth } from "../../middlewares/userAuth";

const router = express.Router();

const {
  userEmailLoginOrNewAccount,
  userLogin,
  userSignup,
  forgotPasswordEmailVerification,
  updatePassword,
  initialDatas,
} = UserAuthControllers();

router.post("/signup", userSignup);
router.post("/login", userLogin);
router.post("/email-login", userEmailLoginOrNewAccount);
router.post("/verify-email", forgotPasswordEmailVerification);
router.post("/update-password", updatePassword);
router.get("/initial", userAuth, initialDatas);

export default router;
