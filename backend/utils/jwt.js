// src/utils/jwt.js
import jwt from "jsonwebtoken";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return secret;
};

export const signAccessToken = (payload) => {
  const JWT_SECRET = getJwtSecret();
  const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyAccessToken = (token) => {
  const JWT_SECRET = getJwtSecret();
  return jwt.verify(token, JWT_SECRET);
};
