
import nodemailer, {
  SendMailOptions,
  SentMessageInfo,
  Transporter,
} from "nodemailer";

import { env } from "./env";

// Create SMTP transporter.
const emailTransporter: Transporter =
  nodemailer.createTransport({
    host: env.SMTP_HOST,

    port: env.SMTP_PORT,

    secure: env.SMTP_SECURE,

    ...(env.SMTP_USER && env.SMTP_PASS
      ? {
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        }
      : {}),

    connectionTimeout: 15000,

    greetingTimeout: 15000,

    socketTimeout: 30000,

    pool: true,

    maxConnections: 5,

    maxMessages: 100,
  });

// Verify SMTP connection.
export const verifyEmailConnection = async (): Promise<void> => {
  try {
    await emailTransporter.verify();

    console.log("SMTP email service connected successfully.");
  } catch (error) {
    console.error("SMTP connection failed:", error);

    throw error;
  }
};

// Send an email.
export const sendEmail = async (
  options: SendMailOptions
): Promise<SentMessageInfo> => {
  try {
    const result = await emailTransporter.sendMail(options);

    console.log("Email accepted by SMTP server:", result.messageId);

    // Ethereal preview URL is available for test messages.
    const previewUrl = nodemailer.getTestMessageUrl(result);

    if (previewUrl) {
      console.log("Ethereal preview URL:", previewUrl);
    }

    return result;
  } catch (error) {
    console.error("Email sending failed:", error);

    throw error;
  }
};

// Close SMTP transporter.
export const closeEmailConnection = async (): Promise<void> => {
  emailTransporter.close();

  console.log("SMTP transporter closed.");
};

export default emailTransporter;
