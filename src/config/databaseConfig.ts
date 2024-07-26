import mongoose, { ConnectOptions } from "mongoose";

interface MyDbConnection extends ConnectOptions {
  //   useNewUrlParser: boolean;
  //   useUnifiedTopology: boolean;
}

const dbOptions: MyDbConnection = {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
};

export const ConnectToDatabase = () => {
  try {
    const DATABASE_URL = process.env.DATABASE_URL || "";
    mongoose
      .connect(DATABASE_URL, dbOptions)
      .then(() => {
        console.log("Database Connected Successfully!");
      })
      .catch((error) => {
        console.log("Database error : ", error);
      });
  } catch (error) {
    throw error;
  }
};
