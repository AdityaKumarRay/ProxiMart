import express from "express";
import {
  registerCustomer,
  registerVendor,
  login,
  logout,
  refresh,
  getMe,
  changePassword,
} from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import {
  loginLimiter,
  authSlowDown,
} from "../middlewares/rateLimit.middleware.js";

console.info("[Routes] auth routes initialized");

const router = express.Router();

router.post("/register/customer", registerCustomer);
router.post("/register/vendor", registerVendor);
router.post("/login", authSlowDown, loginLimiter, login);

// refresh token (uses cookie or body)
router.post("/refresh", loginLimiter, refresh);

// logout (revokes refresh token)
router.post("/logout", auth, logout);

// protected
router.get("/protected", auth, (req, res) => {
  res.json({ message: "You have accessed a protected route", user: req.user });
});
router.get("/me", auth, getMe);
router.post("/change-password", auth, changePassword);

export default router;
