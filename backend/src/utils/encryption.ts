
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "crypto";
import { env } from "../config/env";

const algorithm = "aes-256-gcm";

const encryptionKey = Buffer.from(env.ENCRYPTION_KEY, "hex");

if (encryptionKey.length !== 32) {
  throw new Error(
    "ENCRYPTION_KEY must contain exactly 64 hexadecimal characters."
  );
}

export const encrypt = (text: string): string => {
  const iv = randomBytes(12);

  const cipher = createCipheriv(algorithm, encryptionKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

export const decrypt = (encryptedText: string): string => {
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted credential format.");
  }

  const decipher = createDecipheriv(
    algorithm,
    encryptionKey,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
};
