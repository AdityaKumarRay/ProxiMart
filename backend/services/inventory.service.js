import Inventory from "../models/Inventory.model.js"; // you have this model
import ApiError from "../utils/ApiError.js";

/**
 * Try to decrement stock for a list of items (inside session).
 * items: [{ productId, quantity }]
 * session: mongoose session
 *
 * Throws ApiError(409) on insufficient stock
 */
export async function decrementStockBulk(items = [], vendorId, session) {
  for (const it of items) {
    const filter = {
      productId: it.productId,
      vendorId,
      stockQuantity: { $gte: it.quantity },
    };

    const update = { $inc: { stockQuantity: -it.quantity } };

    const updated = await Inventory.findOneAndUpdate(filter, update, {
      new: true,
      session,
    });

    if (!updated) {
      throw new ApiError(409, `Insufficient stock for product ${it.productId}`);
    }

    // Optionally: produce low-stock events (placeholder)
    // if (updated.stockQuantity <= updated.lowStockThreshold) { ... }
  }
}

/**
 * Increment stock (used on cancellation/rollback). session optional.
 */
export async function incrementStockBulk(items = [], vendorId, session) {
  for (const it of items) {
    const filter = { productId: it.productId, vendorId };
    const update = { $inc: { stockQuantity: it.quantity } };

    await Inventory.findOneAndUpdate(filter, update, {
      new: true,
      upsert: false, // we expect inventory exists
      session,
    });
  }
}
