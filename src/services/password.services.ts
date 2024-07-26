import bcrypt from "bcrypt";

export const PasswordManagement = () => {
  const hashPassword = async (password: string) => {
    try {
      return await bcrypt.hash(password, 8);
    } catch (error) {
      throw error;
    }
  };

  const comparePassword = async (password: string, existPassword: string) => {
    try {
      return await bcrypt.compare(password, existPassword);
    } catch (error) {
      throw error;
    }
  };

  return {
    hashPassword,
    comparePassword,
  };
};
