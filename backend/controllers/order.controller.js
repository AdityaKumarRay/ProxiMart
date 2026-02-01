import asyncHandler from "../utils/asyncHandler.js";
import * as OrderService from "../services/order.service.js";
import ApiError from "../utils/ApiError.js";

/**
 * GET /orders
 * Query: ?role=vendor (optional, fallback to token)
 */
export const list = asyncHandler(async (req, res) => {
  const orders = await OrderService.listOrders({ user: req.user });
  res.status(200).json({ status: "ok", orders });
});

/**
 * GET /orders/:id
 */
export const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = await OrderService.getOrderById(id, { user: req.user });
  res.status(200).json({ status: "ok", ...payload });
});

/**
 * POST /orders/:id/confirm
 * Vendor only
 */
export const confirm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await OrderService.confirmOrder(id, { user: req.user });
  res.status(200).json({ status: "ok", order });
});

/**
 * POST /orders/:id/pack
 */
export const pack = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await OrderService.packOrder(id, { user: req.user });
  res.status(200).json({ status: "ok", order });
});

/**
 * POST /orders/:id/out-for-delivery
 */
export const outForDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await OrderService.outForDelivery(id, { user: req.user });
  res.status(200).json({ status: "ok", order });
});

/**
 * POST /orders/:id/complete
 */
export const complete = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await OrderService.completeOrder(id, { user: req.user });
  res.status(200).json({ status: "ok", order });
});

/**
 * POST /orders/:id/cancel
 */
export const cancel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await OrderService.cancelOrder(id, { user: req.user });
  res.status(200).json({ status: "ok", order });
});
