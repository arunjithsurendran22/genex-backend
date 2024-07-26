import { Document } from "mongoose";
import { Request } from "express";

export interface CustomRequest extends Request {
  //   file?: Express.Multer.File;
  user?: Document | null;
}
