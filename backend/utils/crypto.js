import crypto from "crypto";

/**
 * Create a random opaque refresh token (raw) and its sha256 hash.
 * Return: { token, tokenHash }
 */
export const createRefreshToken = () => {
  const token = crypto.randomBytes(64).toString("hex"); // 128 chars
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
};

export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
