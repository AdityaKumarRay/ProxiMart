import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import Product from "../models/Product.model.js";
import Cart from "../models/Cart.model.js";
import Order from "../models/Order.model.js";

const ERR_CART_NOT_FOUND = "Cart not found";

/**
 * Add item to cart (create cart if missing).
 * - Ensures product exists and belongs to the same vendor
 */
export async function addItemToCart(
  customerId,
  vendorId,
  { productId, quantity = 1 }
) {
  if (!productId || quantity <= 0) {
    throw new ApiError(400, "Invalid productId or quantity");
  }

  // fetch product snapshot
  const product = await Product.findOne({
    _id: productId,
    vendorId,
    isActive: true,
  });
  if (!product) throw new ApiError(404, "Product not found");

  // upsert cart: unique per (customer, vendor)
  let cart = await Cart.findOne({ customerId, vendorId });

  if (!cart) {
    cart = await Cart.create({
      customerId,
      vendorId,
      items: [
        { productId, name: product.name, price: product.price, quantity },
      ],
    });
    return cart;
  }

  // find item
  const idx = cart.items.findIndex(
    (i) => String(i.productId) === String(productId)
  );
  if (idx === -1) {
    cart.items.push({
      productId,
      name: product.name,
      price: product.price,
      quantity,
    });
  } else {
    cart.items[idx].quantity += quantity;
    // update price/name snapshot in case product changed
    cart.items[idx].price = product.price;
    cart.items[idx].name = product.name;
  }

  await cart.save();
  return cart;
}

/**
 * Remove item or decrement quantity.
 */
export async function removeItemFromCart(
  customerId,
  vendorId,
  { productId, quantity = null }
) {
  const cart = await Cart.findOne({ customerId, vendorId });
  if (!cart) throw new ApiError(404, ERR_CART_NOT_FOUND);

  const idx = cart.items.findIndex(
    (i) => String(i.productId) === String(productId)
  );
  if (idx === -1) throw new ApiError(404, "Product not in cart");

  if (!quantity || cart.items[idx].quantity <= quantity) {
    // remove item
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx].quantity -= quantity;
  }

  await cart.save();
  return cart;
}

/**
 * Checkout: create Order from Cart (no stock decrement here).
 * This operation is done in a transaction to keep cart/order consistent.
 */
export async function checkoutCart(customerId, vendorId, sessionless = false) {
  const session = sessionless ? null : await mongoose.startSession();
  try {
    if (session) session.startTransaction();

    const cart = await Cart.findOne({ customerId, vendorId }).session(session);
    if (!cart || !cart.items.length) throw new ApiError(400, "Cart is empty");

    // Validate products (current price snapshot) and compute totals
    let subtotal = 0;
    const itemsSnapshot = [];

    for (const it of cart.items) {
      // fetch product to ensure still active and get latest price
      const product = await Product.findOne({
        _id: it.productId,
        vendorId,
        isActive: true,
      }).session(session);
      if (!product) {
        throw new ApiError(400, `Product ${it.productId} not available`);
      }
      const price = product.price;
      const quantity = it.quantity;
      subtotal += price * quantity;
      itemsSnapshot.push({
        productId: it.productId,
        name: product.name,
        price,
        quantity,
      });
    }

    // Tax & delivery calculation (simple, replace with your logic)
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax example
    const deliveryFee = 0; // compute as needed
    const totalAmount = subtotal + tax + deliveryFee;

    const order = await Order.create(
      [
        {
          vendorId,
          customerId,
          items: itemsSnapshot,
          subtotal,
          tax,
          deliveryFee,
          totalAmount,
          status: "CREATED",
        },
      ],
      { session }
    );

    // remove cart
    await Cart.deleteOne({ _id: cart._id }).session(session);

    if (session) await session.commitTransaction();
    return order[0];
  } catch (err) {
    if (session) await session.abortTransaction();
    throw err;
  } finally {
    if (session) session?.endSession();
  }
}
