
import nodemailer, { type Transporter } from "nodemailer";

import { decrypt } from "../utils/encryption";

export interface SenderSMTPConfig {
  id: number;
  email: string;

  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;

  smtp_username_encrypted: string;
  smtp_password_encrypted: string;
}

/**
 * Create a Nodemailer transporter for an individual sender.
 */
export function createSenderTransport(
  sender: SenderSMTPConfig
): Transporter {

  if (!sender.smtp_host) {
    throw new Error("SMTP host is missing.");
  }

  if (!sender.smtp_port || sender.smtp_port <= 0) {
    throw new Error("Invalid SMTP port.");
  }

  if (
    !sender.smtp_username_encrypted ||
    !sender.smtp_password_encrypted
  ) {
    throw new Error("SMTP credentials are missing.");
  }

  // Decrypt sender-specific SMTP credentials.
  const username = decrypt(sender.smtp_username_encrypted);
  const password = decrypt(sender.smtp_password_encrypted);

  // Create an independent transporter for this sender.
  const transporter = nodemailer.createTransport({
    host: sender.smtp_host,
    port: Number(sender.smtp_port),
    secure: Boolean(sender.smtp_secure),

    auth: {
      user: username,
      pass: password,
    },

    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,

    pool: false,
  });

  return transporter;
}

/**
 * Verify whether the sender's SMTP server is accessible
 * and the provided credentials are accepted.
 */
export async function verifySenderTransport(
  sender: SenderSMTPConfig
): Promise<boolean> {

  const transporter = createSenderTransport(sender);

  try {
    await transporter.verify();

    console.log(
      `SMTP connection verified for sender: ${sender.email}`
    );

    return true;
  } catch (error) {
    console.error(
      `SMTP verification failed for sender: ${sender.email}`,
      error
    );

    throw new Error(
      "Unable to verify SMTP credentials. Please check your SMTP configuration."
    );
  } finally {
    transporter.close();
  }
}
