import mongoose from "mongoose";

const orderStatusHistorySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true,
  },
  status: String,
  changedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("OrderStatusHistory", orderStatusHistorySchema);
