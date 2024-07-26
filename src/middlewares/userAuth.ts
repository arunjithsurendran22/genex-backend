import { verify } from "jsonwebtoken";
import { CustomRequest } from "../types/customRequestTypes";
import { Response, NextFunction } from "express";
import { sendErrorResponse } from "./sendError";
import UserModel from "../models/users/user.model";

export const userAuth = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token: string | undefined = req.headers.authorization?.split(" ")[1];

    if (token) {
      const decode: any = verify(token, process.env.JWT_SECRET as string);
      const id: string = decode._id;

      const user = await UserModel.findById(id);
      if (!user) {
        const err = new Error("invalid token");
        return sendErrorResponse(res, 401, err);
      }

      req.user = user;
      next();
    } else {
      const err = new Error("Authrization header is missing!");
      return sendErrorResponse(res, 401, err);
    }
  } catch (error: any) {
    return sendErrorResponse(res, 403, error);
  }
};
