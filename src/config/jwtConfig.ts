import { sign } from "jsonwebtoken";

export const GenerateJWTTokens = () => {
  const generateAccessToken = async (_id: string) => {
    try {
      return await sign({ _id }, process.env.JWT_SECRET as string, {
        expiresIn: "1d",
      });
    } catch (error) {
      throw error;
    }
  };

  const generateRefreshToken = async (_id: string) => {
    try {
      return await sign({ _id }, process.env.JWT_SECRET as string, {
        expiresIn: "2d",
      });
    } catch (error) {
      throw error;
    }
  };

  return {
    generateAccessToken,
    generateRefreshToken,
  };
};
