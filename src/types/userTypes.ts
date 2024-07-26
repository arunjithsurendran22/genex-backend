export interface userSignupInterface {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface userInterface {
  name: string;
  email: string;
  password?: string;
  _id?: string;
}
