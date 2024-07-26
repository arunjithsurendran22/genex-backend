import joi from "joi";

const passwordRegx =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const passswordError = new Error(
  "Password must be strong. At least one alphabet. At least one digit. At least one special character. Minimum eight in length"
);

export const userSignupValidation = joi.object({
  name: joi.string(),
  email: joi.string().required(),
  password: joi.string().regex(passwordRegx).error(passswordError).required(),
  confirmPassword: joi
    .string()
    .valid(joi.ref("password"))
    .error(new Error("Confirm password must be equal to new password"))
    .required(),
});

export const userLoginValidation = joi.object({
  email: joi.string().required(),
  password: joi.string().required(),
});

export const userEmailLoginOrSingupValidation = joi.object({
  name: joi.string().required(),
  email: joi.string().required(),
});

export const updatedUserPasswordValidation = joi.object({
  email: joi.string().required(),
  newPassword: joi
    .string()
    .regex(passwordRegx)
    .error(passswordError)
    .required(),
  confirmPassword: joi
    .string()
    .valid(joi.ref("newPassword"))
    .error(new Error("Confirm password must be equal to new password"))
    .required(),
  otp: joi.number().required(),
});
