// src/middlewares/vendorOnly.middleware.js

/**
 * Ensure the authenticated user is a Vendor (role === "VENDOR").
 * Assumes auth middleware has already set `req.user = { userId, role, vendorId }`.
 */
export const vendorOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "VENDOR") {
      return res.status(403).json({ message: "Vendor access only" });
    }

    // All good
    next();
  } catch (err) {
    next(err);
  }
};
