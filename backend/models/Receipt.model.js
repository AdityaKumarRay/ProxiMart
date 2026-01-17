import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema(
  {
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

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    items: [
      {
        name: String,
        quantity: Number,
        price: Number,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    dueAmount: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PAID", "PARTIAL", "UNPAID"],
      default: "UNPAID",
      index: true,
    },

    generatedVia: {
      type: String,
      enum: ["VOICE", "MANUAL"],
      required: true,
    },
  },
  { timestamps: true },
);

receiptSchema.index({ vendorId: 1, customerId: 1 });

export default mongoose.model("Receipt", receiptSchema);
