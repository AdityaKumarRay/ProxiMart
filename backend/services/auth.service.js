import dayjs from "dayjs";
import User from "../models/User.model.js";
import Vendor from "../models/Vendor.model.js";
import RefreshToken from "../models/RefreshToken.model.js";
import { createRefreshToken, hashToken } from "../utils/crypto.js";
import { signAccessToken } from "../utils/jwt.js";

// Resolve refresh token lifetime (days) from env; default to 30
const getRefreshTokenTTLays = () => {
  const REFRESH_TOKEN_TTL_DAYS = parseInt(
    process.env.REFRESH_TOKEN_TTL_DAYS || "30",
    10
  );

  if (!REFRESH_TOKEN_TTL_DAYS) {
    throw new Error(
      "REFRESH_TOKEN_TTL_DAYS is not defined in environment variables"
    );
  }
  return REFRESH_TOKEN_TTL_DAYS;
};

/* -------------------------
   Register customer
   ------------------------- */
export const registerCustomer = async ({ name, email, phone, password }) => {
  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) throw new Error("User with same email or phone already exists");

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: "CUSTOMER",
  });

  const payload = {
    userId: user._id,
    role: user.role,
    vendorId: null,
  };

  const accessToken = signAccessToken(payload);

  const refreshPair = await createAndPersistRefreshToken(user._id);
  return {
    user,
    accessToken,
    refreshToken: refreshPair.token,
    refreshExpires: refreshPair.expiresAt,
  };
};

/* -------------------------
   Register vendor (create Vendor + vendor user)
   ------------------------- */
export const registerVendor = async ({
  name,
  email,
  phone,
  password,
  shopName,
  ownerName = "",
  address,
  location,
}) => {
  const existing = await User.findOne({ $or: [{ email }, { phone }] });
  if (existing) throw new Error("User with same email or phone already exists");

  if (!shopName || !address || !location || location.coordinates.length !== 2) {
    throw new Error("Invalid vendor details");
  }

  if (!ownerName) {
    ownerName = name;
  }

  const vendor = await Vendor.create({
    shopName,
    ownerName,
    phone,
    address,
    location,
  });

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: "VENDOR",
    vendorId: vendor._id,
  });

  const accessToken = signAccessToken({
    userId: user._id,
    role: user.role,
    vendorId: vendor._id,
  });

  const refreshPair = await createAndPersistRefreshToken(user._id);
  return {
    user,
    vendor,
    accessToken,
    refreshToken: refreshPair.token,
    refreshExpires: refreshPair.expiresAt,
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new Error("Invalid credentials");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error("Invalid credentials");

  if (!user.isActive) throw new Error("Account disabled");

  const accessToken = signAccessToken({
    userId: user._id,
    role: user.role,
    vendorId: user.vendorId || null,
  });

  const refreshPair = await createAndPersistRefreshToken(user._id);
  return {
    user,
    accessToken,
    refreshToken: refreshPair.token,
    refreshExpires: refreshPair.expiresAt,
  };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new Error("User not found");
  return user;
};

export const createAndPersistRefreshToken = async (
  userId,
  createdByIp = null
) => {
  const { token, tokenHash } = createRefreshToken();

  const expiresAt = dayjs().add(getRefreshTokenTTLays(), "day").toDate();

  const doc = await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    createdByIp,
  });

  return { token, expiresAt: doc.expiresAt, tokenHash };
};

/* -------------------------
   Refresh tokens (rotate)
   - client sends raw refresh token
   - we find hashed token in DB
   - if valid and active => create new refresh token, revoke old and return new pair
   ------------------------- */
export const rotateRefreshToken = async (rawToken, ipAddress = null) => {
  const tokenHash = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored || !stored.isActive) throw new Error("Invalid refresh token");

  const { token: newToken, tokenHash: newTokenHash } = createRefreshToken();
  const newExpiresAt = dayjs().add(getRefreshTokenTTLays(), "day").toDate();

  stored.revokedAt = new Date();
  stored.revokedByIp = ipAddress;
  stored.replacedByTokenHash = newTokenHash;
  await stored.save();

  await RefreshToken.create({
    userId: stored.userId,
    tokenHash: newTokenHash,
    expiresAt: newExpiresAt,
    createdByIp: ipAddress,
  });

  const user = await User.findById(stored.userId);
  if (!user) throw new Error("User not found for refresh token");

  const accessToken = signAccessToken({
    userId: user._id,
    role: user.role,
    vendorId: user.vendorId || null,
  });

  return {
    user,
    accessToken,
    refreshToken: newToken,
    refreshExpires: newExpiresAt,
  };
};

/* -------------------------
   Revoke a refresh token (logout)
   Accepts raw token; marks as revoked
   ------------------------- */
export const revokeRefreshToken = async (rawToken, ipAddress = null) => {
  const tokenHash = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash });
  if (!stored) return false;

  stored.revokedAt = new Date();
  stored.revokedByIp = ipAddress;
  await stored.save();
  return true;
};

/* -------------------------
   Change password (user must supply old password)
   ------------------------- */
export const changePassword = async ({ userId, oldPassword, newPassword }) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new Error("User not found");

  const matched = await user.comparePassword(oldPassword);
  if (!matched) throw new Error("Invalid current password");

  user.password = newPassword;
  await user.save();

  // revoke all refresh tokens for this user (force re-login)
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date() }
  );

  return true;
};
