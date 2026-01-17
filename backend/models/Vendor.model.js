import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: true,
      trim: true,
    },

    ownerName: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },

    deliveryEnabled: {
      type: Boolean,
      default: true,
    },

    pickupEnabled: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

vendorSchema.index({ location: "2dsphere" });

export default mongoose.model("Vendor", vendorSchema);
