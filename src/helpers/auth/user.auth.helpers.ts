import UserModel from "../../models/users/user.model";
import { userInterface, userSignupInterface } from "../../types/userTypes";
import { WalletsServices } from "../../utils/wallets/wallets";
import { PasswordManagement } from "../../services/password.services";
import MasterWalletModel from "../../models/wallets/master.wallet";
import generateUniqueId from "generate-unique-id";
import { sendForgotPasswordOtp } from "../../services/sendUserOTPEmail";
import UserContranctAddressModel from "../../models/wallets/userContranctAddress.model";
import WorkerWalletModel from "../../models/wallets/worker.wallets";
import workerWalletTransactionModel from "../../models/wallets/workerWalletTransaction";
import { LAMPORTS_PER_SOL, Connection, PublicKey } from "@solana/web3.js";

// const RPC_URL =
//   "https://necessary-radial-needle.solana-mainnet.quiknode.pro/88ca97b39b3085f976fb5584c04b57d2226cee16/";
export const RPC_URL =
  "https://mainnet.helius-rpc.com/?api-key=f0c11eb0-ccc8-4f5f-afb3-b11308f4e46e";

// const RPC_URL =
//   "https://mainnet.helius-rpc.com/?api-key=3aeb267f-fa6c-4dc7-b655-f198e7c2fb3d";

// const RPC_URL = "https://api.mainnet-beta.solana.com/";

// const RPC_URL = "https://rpc.solscan.com";

// const RPC_URL = "https://rpc.ankr.com/solana";

// const RPC_URL =
//   "https://mainnet.helius-rpc.com/?api-key=8fbe5865-605a-45ec-8629-8caa128be392";

// const RPC_URL =
//   "https://solana-mainnet.api.syndica.io/api-token/2g5bUixPgB7ikTo6JUA9f7ke1xErWvjp3cHFR1uJUvyTjdYUWib1WJg9VUVsdWGK9njwDL7ToJaoUESJhAi41GURkgyGWxxR9RhVH9FzMNtSKanozjZ61ZmptQmnJKNxEGxfmiGEWAsPWph7hXwGuse1pnRzNm3sGntcVqgdFtXruWhzHFt35dvhURy2MheSdtpin35M3HaNkMPPvP1H2PronHC5r1tDBwhU52EeNYSH8wBbdFkAvxtKQhvC4zULzjC5sYV3Ba2a3MyVqis3Mk1JvcEekKfEMwNGnijxfi5qiE4LwkuYvA1h97du3a3arRVJhwmPZgjiZCrhkGqK1m2vt8gd7YV3XVeAKhhynmpa6tL4yjCWctLcatZNP7n6HW2KADac6fqg3rwMWUPxv3ucVLszoujuLU9V5PyDHdqoqhgsAj9XgX4JjR8stYs4zw5ZmFzvJtKekk5pfGox7n6XTqZSEXaVpVL6KBtjQbwYEPS5wjhsyaZyy5KuQ";

// const RPC_URL =
//   "https://endpoints.omniatech.io/v1/sol/mainnet/a98f2930afc946db859a37fb8a300f8a";

export const SolanaConnection = new Connection(RPC_URL, "confirmed");

const { hashPassword, comparePassword } = PasswordManagement();

const { createWalletService } = WalletsServices();

export const UserAuthHelpers = () => {
  // USER SIGNUP MANUALLY
  const userSignupHelper = async (data: userSignupInterface) => {
    try {
      const user = await UserModel.findOne({
        email: data.email,
        isDeleted: false,
      });

      if (user) throw "user already exist";

      const hashedPassword = await hashPassword(data.password);

      const userDetails: userInterface = {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      };
      const newUser = await UserModel.create(userDetails);

      const newUserMasterWallet = await createWalletService();

      const createUserWallet = await MasterWalletModel.create({
        private_key: newUserMasterWallet.privateKey,
        public_key: newUserMasterWallet.publicKey,
        user: newUser._id,
        balance: 0,
      });
      return { newUser, createUserWallet };
    } catch (error) {
      throw error;
    }
  };

  // USER MANUALLY LOGIN FOR USING EMAIL AND PASSWORD
  const userLoginHelper = async (email: string, password: string) => {
    try {
      const findExistUser = await UserModel.findOne({
        email: email,
        isDeleted: false,
      });

      if (!findExistUser) throw "invalid email";

      const compare = await comparePassword(
        password,
        findExistUser.password as string
      );

      if (!compare) throw "invalide password credentials";

      const masterWallet = await MasterWalletModel.findOne({
        user: findExistUser._id,
        isDeleted: false,
      });

      const data = {
        user: findExistUser,
        masterWallet: masterWallet,
      };

      return data;
    } catch (error) {
      throw error;
    }
  };

  // IF USER EXIST LOGIN ACCOUNT ELSE CREATE A NEW ACCOUNT
  const userEmailLoginOrSignupHelper = async (email: string, name: string) => {
    try {
      const findUser = await UserModel.findOne({ email: email });

      if (findUser) {
        if (findUser.isDeleted === false && findUser.isActive === true) {
          const masterWallet = await MasterWalletModel.findOne({
            user: findUser._id,
          });
          let data = {
            user: findUser,
            masterWallet: masterWallet,
            message: "user login successfully",
          };

          return data;
        } else {
          throw "this email already registered try another mail";
        }
      } else {
        const newUser = await UserModel.create({
          name: name,
          email: email,
          isDeleted: false,
        });
        const newUserMasterWallet = await createWalletService();

        const createUserWallet = await MasterWalletModel.create({
          private_key: newUserMasterWallet.privateKey,
          public_key: newUserMasterWallet.publicKey,
          user: newUser._id,
          balance: 0,
        });

        let data = {
          user: newUser,
          masterWallet: createUserWallet,
          message: "created a new account",
        };

        return data;
      }
    } catch (error) {
      throw error;
    }
  };

  // FORGOT PASSWORD EMAIL VERIFICATION
  const forgotPasswordEmailVerificationHelper = async (email: string) => {
    try {
      const findUser = await UserModel.findOne({
        email: email,
        isDeleted: false,
      });

      if (!findUser) throw "User not found!";

      const otp = generateUniqueId({
        length: 4,
        useNumbers: true,
        useLetters: false,
      });

      findUser.otp = Number(otp);
      findUser.save();

      await sendForgotPasswordOtp(findUser.email, Number(otp));
      return `email has been sent to ${email}`;
    } catch (error) {
      throw error;
    }
  };

  const updatePasswordHelper = async (
    email: string,
    newPassword: string,
    otp: Number
  ) => {
    try {
      const findUser = await UserModel.findOne({
        email: email,
        isDeleted: false,
      });

      if (!findUser) {
        throw "user not found";
      }

      if (Number(findUser?.otp !== Number(otp))) {
        throw "OTP is wrong";
      }

      const hashedPassword = await hashPassword(newPassword);

      if (findUser && findUser.password) {
        findUser.password = hashedPassword;
        findUser.save();
      }

      return "password updated successfully";
    } catch (error) {
      throw error;
    }
  };

  // INITIAL HELPERS
  const initialDataHelper = async (userId: string) => {
    try {
      const findUser = await UserModel.findOne({ _id: userId });

      if (!findUser) {
        throw Error("user not found");
      }

      const projectCount = await UserContranctAddressModel.find({
        user: userId,
      }).countDocuments();
      const walletsCount = await WorkerWalletModel.find({
        user: userId,
      }).countDocuments();

      const masterWallet = await MasterWalletModel.findOne({ user: userId });

      if (masterWallet) {
        const mastBal = await SolanaConnection.getBalance(
          new PublicKey(masterWallet?.public_key)
        );

        masterWallet.balance = mastBal / LAMPORTS_PER_SOL;
        await masterWallet.save();
      }

      const totalTransaction = await workerWalletTransactionModel.find({
        user: userId,
        signature_status: "success",
      });

      const totalVoliumCount = await workerWalletTransactionModel
        .find({ user: userId })
        .countDocuments();

      // Calculate the volume by summing the amount of each transaction
      const totalVolume = totalTransaction.reduce((acc, ele) => {
        if (ele.amount && ele?.signature_status === "success") {
          return acc + ele.amount / LAMPORTS_PER_SOL;
        }
        return acc;
      }, 0);

      // Multiply the total volume by the count of transactions
      const totalVolumeAmount = totalVolume;

      return {
        findUser,
        projectCount,
        walletsCount,
        masterWallet,
        totalVolumeAmount,
      };
    } catch (error) {
      throw error;
    }
  };

  return {
    userSignupHelper,
    userLoginHelper,
    userEmailLoginOrSignupHelper,
    forgotPasswordEmailVerificationHelper,
    updatePasswordHelper,
    initialDataHelper,
  };
};
