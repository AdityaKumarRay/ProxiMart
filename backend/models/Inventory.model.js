import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      unique: true,
    },

    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
    },
  },
  { timestamps: true },
);

inventorySchema.index({ vendorId: 1, productId: 1 });

export default mongoose.model("Inventory", inventorySchema);
