import express from "express";
import {
  addItem,
  removeItem,
  checkout,
} from "../controllers/cart.controller.js";
import { auth } from "../middlewares/auth.middleware.js"; // ensure your middleware exports match
import { requireBody } from "../middlewares/validate.middleware.js";

const router = express.Router();

// all cart operations require authentication as customer
router.post("/add", auth, requireBody(["vendorId", "productId"]), addItem);
router.post(
  "/remove",
  auth,
  requireBody(["vendorId", "productId"]),
  removeItem
);
router.post("/checkout", auth, requireBody(["vendorId"]), checkout);

export default router;
