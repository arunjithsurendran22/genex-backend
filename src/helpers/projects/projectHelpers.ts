import { isValidObjectId } from "mongoose";
import UserContranctAddressModel from "../../models/wallets/userContranctAddress.model";
import { getUserContractTokenDetails } from "../../utils/wallets/retrieveContractTokenDetails";
import { PublicKey } from "@solana/web3.js";
import { projectEditInterface } from "../../types/projectTypes";

export const UserProjectHelpers = () => {
  const getAllProjectsHelper = async (
    userId: string,
    limit: number,
    skip: number,
    filters: any
  ) => {
    try {
      const projects = await UserContranctAddressModel.find(filters)
        .limit(limit)
        .skip(limit * skip)
        .sort({ createdAt: -1 });

      const projectCount = await UserContranctAddressModel.find({
        user: userId,
      }).countDocuments();

      return {
        projects,
        projectCount,
      };
    } catch (error) {
      throw error;
    }
  };

  const projectSingleDetailHelper = async (project_id: string) => {
    try {
      if (!isValidObjectId(project_id)) {
        throw Error("invalid project id");
      }
      return await UserContranctAddressModel.findOne({ _id: project_id });
    } catch (error) {
      throw error;
    }
  };

  const updateProjectHelper = async (
    project_id: string,
    data: projectEditInterface
  ) => {
    const project = await UserContranctAddressModel.findOne({
      _id: project_id,
    });

    if (!project) {
      throw Error("project not found invalid project id");
    }

    const checkToken = await getUserContractTokenDetails(
      new PublicKey(data.tokenAddress)
    );

    if (!checkToken) {
      throw Error("token verification failed");
    }

    const update = await UserContranctAddressModel.updateOne(
      { _id: project_id },
      {
        tokenAddress: data.tokenAddress,
        token_supply: checkToken.supply,
        decimals: checkToken.decimals,
      }
    );
    return "successfully updated";
  };

  return {
    getAllProjectsHelper,
    projectSingleDetailHelper,
    updateProjectHelper,
  };
};
