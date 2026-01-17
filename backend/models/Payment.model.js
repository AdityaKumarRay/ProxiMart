import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Receipt",
      required: true,
      index: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    method: {
      type: String,
      enum: ["UPI", "CASH", "WALLET", "CARD"],
      required: true,
    },

    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Payment", paymentSchema);
