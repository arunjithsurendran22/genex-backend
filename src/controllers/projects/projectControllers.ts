import { Response } from "express";
import { CustomRequest } from "../../types/customRequestTypes";
import { sendErrorResponse } from "../../middlewares/sendError";
import { UserProjectHelpers } from "../../helpers/projects/projectHelpers";
import mongoose from "mongoose";
import { updateProjectValidations } from "../../validations/porjects/projectValidations";

const { getAllProjectsHelper, projectSingleDetailHelper, updateProjectHelper } =
  UserProjectHelpers();

export const userProjectControllers = () => {
  const allProjects = async (req: CustomRequest, res: Response) => {
    try {
      const { limit, skip, token } = req.query;

      const userId = req.user?._id as string;

      const filters: any = {};

      if (token && token !== "") {
        filters.$or = [{ tokenAddress: { $regex: token, $options: "i" } }];
      }

      if (userId) {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        filters.user = userObjectId;
      }

      const response = await getAllProjectsHelper(
        userId,
        Number(limit),
        Number(skip),
        filters
      );

      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const singleDetails = async (req: CustomRequest, res: Response) => {
    try {
      const { project_id } = req.params;
      const response = await projectSingleDetailHelper(project_id);
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  const updateProject = async (req: CustomRequest, res: Response) => {
    try {
      const { project_id } = req.params;
      const { error, value } = updateProjectValidations.validate(req.body);

      if (error) return sendErrorResponse(res, 400, error);

      const response = await updateProjectHelper(project_id, req.body);
      res.status(200).json(response);
    } catch (error: any) {
      sendErrorResponse(res, 500, error);
    }
  };

  return {
    allProjects,
    singleDetails,
    updateProject,
  };
};
