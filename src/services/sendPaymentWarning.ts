import { sendEmail } from "../config/emailConfig";

export const workerWalletCreationPaymentWarning = async (
  email: string,
  walletCount: Number,
  walletNames: string[],
  user_name: string
) => {
  try {
    const walletList = walletNames.map((name) => `<li>${name}</li>`).join("");

    sendEmail(
      email,
      `Action Required: Payment Needed for Created Wallets`,
      `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">${process.env.COMPANY_NAME}</a>
              </div>
              <p style="font-size:1.1em">Hi,${user_name}</p>
              <p>We have successfully created <strong>${walletCount}</strong> wallets. The details are as follows:</p>
              <ul style="background: #f9f9f9; padding: 20px; border-radius: 5px; list-style: none;">
                ${walletList}
              </ul>
              <p>Please note that the fees for these wallets will be deducted from your master wallet upon recharge. Ensure sufficient funds are available to avoid any disruptions.</p>
              <p>Thank you for choosing ${process.env.COMPANY_NAME}.</p>
              <p style="font-size:0.9em;">Regards,<br />${process.env.COMPANY_NAME} Team</p>
            </div>
         </div>`
    );
  } catch (error) {
    throw error;
  }
};
