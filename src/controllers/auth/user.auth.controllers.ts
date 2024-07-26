import { Response } from "express";
import { CustomRequest } from "../../types/customRequestTypes";
import { sendErrorResponse } from "../../middlewares/sendError";
import { UserAuthHelpers } from "../../helpers/auth/user.auth.helpers";
import {
  updatedUserPasswordValidation,
  userEmailLoginOrSingupValidation,
  userLoginValidation,
  userSignupValidation,
} from "../../validations/users/userValidations";
import { GenerateJWTTokens } from "../../config/jwtConfig";

const {
  userSignupHelper,
  userLoginHelper,
  userEmailLoginOrSignupHelper,
  forgotPasswordEmailVerificationHelper,
  updatePasswordHelper,
  initialDataHelper,
} = UserAuthHelpers();

const { generateAccessToken, generateRefreshToken } = GenerateJWTTokens();

export const UserAuthControllers = () => {
  const userSignup = async (req: CustomRequest, res: Response) => {
    try {
      const { error, value } = userSignupValidation.validate(req.body);

      if (error) return sendErrorResponse(res, 400, error);

      const response = await userSignupHelper(req.body);
      const userId = response?.newUser?._id.toString();

      const accessToken = await generateAccessToken(userId);
      const refreshToken = await generateRefreshToken(userId);

      res.cookie("refreshtoken", refreshToken, {
        httpOnly: false,
        sameSite: "none",
        secure: true,
      });

      res.status(200).json({ data: response, token: accessToken });
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const userLogin = async (req: CustomRequest, res: Response) => {
    try {
      const { error, value } = userLoginValidation.validate(req.body);
      if (error) return sendErrorResponse(res, 400, error);

      const response = await userLoginHelper(req.body.email, req.body.password);

      const userId = response?.user?._id.toString();

      const accessToken = await generateAccessToken(userId);
      const refreshToken = await generateRefreshToken(userId);

      res.cookie("refreshtoken", refreshToken, {
        httpOnly: false,
        sameSite: "none",
        secure: true,
      });

      res.status(200).json({ response, accessToken });
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const userEmailLoginOrNewAccount = async (
    req: CustomRequest,
    res: Response
  ) => {
    try {
      const { error, value } = userEmailLoginOrSingupValidation.validate(
        req.body
      );
      if (error) return sendErrorResponse(res, 400, error);

      const response = await userEmailLoginOrSignupHelper(
        req.body.email,
        req.body.name
      );

      const userId = response?.user?._id.toString();

      const accessToken = await generateAccessToken(userId);
      const refreshToken = await generateRefreshToken(userId);

      res.cookie("refreshtoken", refreshToken, {
        httpOnly: false,
        sameSite: "none",
        secure: true,
      });

      res.status(200).json({ data: response, token: refreshToken });
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const forgotPasswordEmailVerification = async (
    req: CustomRequest,
    res: Response
  ) => {
    try {
      if (!req.body.email) {
        const err = new Error("email id is required!");
        return sendErrorResponse(res, 400, err);
      }
      const response = await forgotPasswordEmailVerificationHelper(
        req.body.email
      );
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const updatePassword = async (req: CustomRequest, res: Response) => {
    try {
      const { error, value } = updatedUserPasswordValidation.validate(req.body);

      if (error) return sendErrorResponse(res, 400, error);

      const response = await updatePasswordHelper(
        req.body.email,
        req.body.newPassword,
        Number(req.body.otp)
      );

      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  // INITIAL CONTROLLERS
  const initialDatas = async (req: CustomRequest, res: Response) => {
    try {
      const userId = req.user?._id as string;
      const response = await initialDataHelper(userId);
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  return {
    userSignup,
    userEmailLoginOrNewAccount,
    userLogin,
    forgotPasswordEmailVerification,
    updatePassword,
    initialDatas,
  };
};
