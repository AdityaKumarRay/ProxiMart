import mongoose from "mongoose";

const notificationJobSchema = new mongoose.Schema(
  {
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receipt",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["DUE_REMINDER"],
      required: true,
    },

    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "SENT", "CANCELLED"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

export default mongoose.model("NotificationJob", notificationJobSchema);
