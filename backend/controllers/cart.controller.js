import asyncHandler from "../utils/asyncHandler.js";
import * as CartService from "../services/cart.service.js";
import ApiError from "../utils/ApiError.js";

/**
 * POST /cart/add
 * body: { vendorId, productId, quantity }
 */
export const addItem = asyncHandler(async (req, res) => {
  const { vendorId, productId, quantity } = req.body;
  const customerId = req.user.userId;

  if (!vendorId || !productId)
    throw new ApiError(400, "vendorId and productId required");

  const cart = await CartService.addItemToCart(customerId, vendorId, {
    productId,
    quantity,
  });
  res.status(200).json({ status: "ok", cart });
});

/**
 * POST /cart/remove
 * body: { vendorId, productId, quantity (optional) }
 */
export const removeItem = asyncHandler(async (req, res) => {
  const { vendorId, productId, quantity } = req.body;
  const customerId = req.user.userId;

  if (!vendorId || !productId)
    throw new ApiError(400, "vendorId and productId required");

  const cart = await CartService.removeItemFromCart(customerId, vendorId, {
    productId,
    quantity,
  });
  res.status(200).json({ status: "ok", cart });
});

/**
 * POST /cart/checkout
 * body: { vendorId }
 */
export const checkout = asyncHandler(async (req, res) => {
  const { vendorId } = req.body;
  const customerId = req.user.userId;

  if (!vendorId) throw new ApiError(400, "vendorId required");

  const order = await CartService.checkoutCart(customerId, vendorId);
  res.status(201).json({ status: "ok", order });
});
