import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import Order from "../models/Order.model.js";
import OrderStatusHistory from "../models/OrderStatusHistory.model.js";
import { decrementStockBulk, incrementStockBulk } from "./inventory.service.js";

/**
 * Query orders:
 * - if user is vendor: vendorId is required and returned orders for vendor
 * - if customer: return orders for given customerId
 */
export async function listOrders({ user }) {
  if (user.role === "VENDOR") {
    return Order.find({ vendorId: user.vendorId }).sort({ createdAt: -1 });
  } else {
    return Order.find({ customerId: user.userId }).sort({ createdAt: -1 });
  }
}

/**
 * Get single order with status history
 */
export async function getOrderById(orderId, { user }) {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  // Authorization check
  if (
    user.role === "VENDOR" &&
    String(order.vendorId) !== String(user.vendorId)
  ) {
    throw new ApiError(403, "Unauthorized");
  }
  if (
    user.role === "CUSTOMER" &&
    String(order.customerId) !== String(user.userId)
  ) {
    throw new ApiError(403, "Unauthorized");
  }

  const history = await OrderStatusHistory.find({ orderId }).sort({
    changedAt: 1,
  });
  return { order, history };
}

/**
 * Confirm order: vendor action -> decrement inventory (atomic)
 */
export async function confirmOrder(orderId, { user }) {
  if (user.role !== "VENDOR") throw new ApiError(403, "Vendor only");
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) throw new ApiError(404, "Order not found");
    if (String(order.vendorId) !== String(user.vendorId))
      throw new ApiError(403, "Unauthorized");

    if (order.status !== "CREATED") {
      throw new ApiError(
        400,
        `Order cannot be confirmed from status ${order.status}`
      );
    }

    // build items for inventory service
    const items = order.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    }));

    // decrement stock (will throw if insufficient)
    await decrementStockBulk(items, order.vendorId, session);

    // update order status
    order.status = "CONFIRMED";
    await order.save({ session });

    await OrderStatusHistory.create(
      [{ orderId: order._id, status: "CONFIRMED" }],
      { session }
    );

    // Placeholder: emit order confirmed notification/event (not included)
    // eventBus.emit("order.confirmed", { orderId: order._id });

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Pack -> vendor action
 */
export async function packOrder(orderId, { user }) {
  if (user.role !== "VENDOR") throw new ApiError(403, "Vendor only");
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");
  if (String(order.vendorId) !== String(user.vendorId))
    throw new ApiError(403, "Unauthorized");

  if (order.status !== "CONFIRMED")
    throw new ApiError(400, "Only confirmed orders can be packed");

  order.status = "PACKED";
  await order.save();

  await OrderStatusHistory.create({ orderId: order._id, status: "PACKED" });

  // Placeholder: notification/event
  return order;
}

/**
 * Out for delivery -> vendor/delivery action
 */
export async function outForDelivery(orderId, { user }) {
  // vendor or delivery role (if exists) can call
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  // vendor guard (only vendor that owns order can set)
  if (
    user.role === "VENDOR" &&
    String(order.vendorId) !== String(user.vendorId)
  )
    throw new ApiError(403, "Unauthorized");

  if (order.status !== "PACKED")
    throw new ApiError(400, "Only packed orders can go out for delivery");

  order.status = "OUT_FOR_DELIVERY";
  await order.save();

  await OrderStatusHistory.create({
    orderId: order._id,
    status: "OUT_FOR_DELIVERY",
  });

  // Placeholder: notification/event
  return order;
}

/**
 * Complete order -> called by delivery OR system after confirmation of delivery
 */
export async function completeOrder(orderId, { user }) {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (
    user.role === "VENDOR" &&
    String(order.vendorId) !== String(user.vendorId)
  )
    throw new ApiError(403, "Unauthorized");
  if (
    user.role === "CUSTOMER" &&
    String(order.customerId) !== String(user.userId)
  )
    throw new ApiError(403, "Unauthorized");

  if (order.status !== "OUT_FOR_DELIVERY")
    throw new ApiError(400, "Only out for delivery orders can be completed");

  order.status = "COMPLETED";
  await order.save();

  await OrderStatusHistory.create({ orderId: order._id, status: "COMPLETED" });

  // Link to receipts/payments handled elsewhere

  return order;
}

/**
 * Cancel order (can be by customer or vendor)
 * If cancelling a CONFIRMED order, we must restock (atomic)
 */
export async function cancelOrder(orderId, { user }) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);
    if (!order) throw new ApiError(404, "Order not found");

    // Authorization: owner or vendor
    const isVendor =
      user.role === "VENDOR" &&
      String(order.vendorId) === String(user.vendorId);
    const isCustomer =
      user.role === "CUSTOMER" &&
      String(order.customerId) === String(user.userId);
    if (!isVendor && !isCustomer) throw new ApiError(403, "Unauthorized");

    // Disallowed states
    if (["PACKED", "OUT_FOR_DELIVERY", "COMPLETED"].includes(order.status)) {
      throw new ApiError(400, "Order cannot be cancelled at this stage");
    }

    // If CONFIRMED -> we must increment stock back
    if (order.status === "CONFIRMED") {
      const items = order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
      await incrementStockBulk(items, order.vendorId, session);
    }

    order.status = "CANCELLED";
    await order.save({ session });

    await OrderStatusHistory.create(
      [{ orderId: order._id, status: "CANCELLED" }],
      { session }
    );

    // Placeholder: notify customer/vendor etc.

    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
