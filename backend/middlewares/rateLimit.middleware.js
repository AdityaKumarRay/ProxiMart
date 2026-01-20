import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

/* -------------------------
   LOGIN PROTECTION
------------------------- */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message: "Too many login attempts. Try again later.",
  },
  keyGenerator: (req) => `${req.ip}-${req.body.email || "unknown"}`,
});

/* -------------------------
   GLOBAL AUTH SLOWDOWN
------------------------- */
export const authSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: () => 500,
});
