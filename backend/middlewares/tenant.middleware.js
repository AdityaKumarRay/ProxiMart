// src/middlewares/tenant.middleware.js

/**
 * Enforce vendor-scoped requests.
 * Requires auth middleware before it.
 * If user does not have vendorId (i.e. customer), reject.
 * Sets `req.vendorId` for downstream controllers.
 */
export const enforceVendorScope = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const vendorId = req.user.vendorId || null;
    if (!vendorId) {
      return res.status(403).json({ message: "Vendor scope missing" });
    }

    req.vendorId = vendorId;
    next();
  } catch (err) {
    next(err);
  }
};
