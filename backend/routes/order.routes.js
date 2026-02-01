import express from "express";
import {
  list,
  getOne,
  confirm,
  pack,
  outForDelivery,
  complete,
  cancel,
} from "../controllers/order.controller.js";

import { auth } from "../middlewares/auth.middleware.js";
import { vendorOnly } from "../middlewares/vendorOnly.middleware.js";
import { requireParams } from "../middlewares/validate.middleware.js";

const router = express.Router();

router.get("/", auth, list);
router.get("/:id", auth, requireParams(["id"]), getOne);

// vendor-only endpoints
router.post("/:id/confirm", auth, vendorOnly, requireParams(["id"]), confirm);
router.post("/:id/pack", auth, vendorOnly, requireParams(["id"]), pack);

// these endpoints can be called by vendor or (in some cases) delivery agents
router.post(
  "/:id/out-for-delivery",
  auth,
  requireParams(["id"]),
  outForDelivery
);
router.post("/:id/complete", auth, requireParams(["id"]), complete);

// cancel can be called by either authorized actor
router.post("/:id/cancel", auth, requireParams(["id"]), cancel);

export default router;
