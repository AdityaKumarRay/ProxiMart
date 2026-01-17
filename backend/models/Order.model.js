import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
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

    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        quantity: Number,
      },
    ],

    subtotal: Number,
    tax: Number,
    deliveryFee: Number,
    totalAmount: Number,

    status: {
      type: String,
      enum: [
        "CREATED",
        "CONFIRMED",
        "PACKED",
        "OUT_FOR_DELIVERY",
        "COMPLETED",
        "CANCELLED",
      ],
      default: "CREATED",
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Order", orderSchema);
