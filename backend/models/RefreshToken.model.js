// src/models/RefreshToken.model.js
import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    replacedByTokenHash: {
      type: String,
      default: null,
    },

    createdByIp: {
      type: String,
      default: null,
    },

    revokedByIp: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

refreshTokenSchema.virtual("isExpired").get(function () {
  return Date.now() >= this.expiresAt.getTime();
});

refreshTokenSchema.virtual("isActive").get(function () {
  return !this.revokedAt && !this.isExpired;
});

export default mongoose.model("RefreshToken", refreshTokenSchema);
