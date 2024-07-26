import UserModel from "../models/users/user.model";
import { verify } from "jsonwebtoken";

export const verifyToken = async (token: string) => {
  try {
    const decoded: any = verify(token, process.env.JWT_SECRET as string);
    const userId = decoded?._id.toString();
    const user = await UserModel.findOne({ _id: userId });
    return user?._id;
  } catch (err: any) {
    console.log("Token verification failed:", err);
    return null;
  }
};
