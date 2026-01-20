// src/controllers/auth.controller.js
import * as AuthService from "../services/auth.service.js";

console.info("[Controller] auth controller loaded");

/**
 * Helper to set refresh token cookie.
 * Mobile clients may still want the raw refresh token in the JSON response.
 */
const setRefreshCookie = (res, token, expiresAt) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  };
  res.cookie("refreshToken", token, cookieOptions);
};

export const registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    console.info("[Auth] registerCustomer", email, phone);
    const { user, accessToken, refreshToken, refreshExpires } =
      await AuthService.registerCustomer({
        name,
        email,
        phone,
        password,
      });

    setRefreshCookie(res, refreshToken, refreshExpires);

    const response = {
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
      accessToken,
      expiresAt: refreshExpires,
    };

    const isMobile = req.headers["x-client-type"] === "mobile";
    if (isMobile) {
      response.refreshToken = refreshToken;
    }

    res.status(201).json(response);
  } catch (err) {
    console.error("Error in registerCustomer:", err);
    res.status(400).json({ message: err.message || "Registration failed" });
  }
};

export const registerVendor = async (req, res) => {
  try {
    const payload = req.body;
    console.info("[Auth] registerVendor", payload?.email);
    const { user, vendor, accessToken, refreshToken, refreshExpires } =
      await AuthService.registerVendor(payload);

    setRefreshCookie(res, refreshToken, refreshExpires);

    const response = {
      vendor: { id: vendor._id, shopName: vendor.shopName },
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        vendorId: user.vendorId,
      },
      accessToken,
      expiresAt: refreshExpires,
    };

    const isMobile = req.headers["x-client-type"] === "mobile";
    if (isMobile) {
      response.refreshToken = refreshToken;
    }

    res.status(201).json(response);
  } catch (err) {
    res
      .status(400)
      .json({ message: err.message || "Vendor registration failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.info("[Auth] login", email);
    const { user, accessToken, refreshToken, refreshExpires } =
      await AuthService.loginUser({ email, password });

    setRefreshCookie(res, refreshToken, refreshExpires);

    const response = {
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        vendorId: user.vendorId || null,
      },
      accessToken,
      expiresAt: refreshExpires,
    };

    const isMobile = req.headers["x-client-type"] === "mobile";
    if (isMobile) {
      response.refreshToken = refreshToken;
    }

    res.json(response);
  } catch (err) {
    res.status(401).json({ message: err.message || "Invalid credentials" });
  }
};

/* Use cookie or body to get refresh token. For mobile clients we accept token in body. */
export const refresh = async (req, res) => {
  try {
    console.info("[Auth] refresh token request");
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!rawToken)
      return res.status(400).json({ message: "No refresh token provided" });

    const ip = req.ip || req.headers["x-forwarded-for"] || null;
    const { user, accessToken, refreshToken, refreshExpires } =
      await AuthService.rotateRefreshToken(rawToken, ip);

    setRefreshCookie(res, refreshToken, refreshExpires);

    const response = {
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        vendorId: user.vendorId || null,
      },
      accessToken,
      expiresAt: refreshExpires,
    };

    const isMobile = req.headers["x-client-type"] === "mobile";
    if (isMobile) {
      response.refreshToken = refreshToken;
    }

    res.json(response);
  } catch (err) {
    res.status(401).json({ message: err.message || "Invalid refresh token" });
  }
};

export const logout = async (req, res) => {
  try {
    console.info("[Auth] logout request");
    const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (rawToken) {
      await AuthService.revokeRefreshToken(rawToken, req.ip || null);
    }

    res.clearCookie("refreshToken", { path: "/" });
    res.json({ message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed" });
  }
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    console.info("[Auth] getMe", userId);
    const user = await AuthService.getUserById(userId);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    console.info("[Auth] changePassword", userId);
    const { oldPassword, newPassword } = req.body;
    await AuthService.changePassword({ userId, oldPassword, newPassword });
    res.json({
      message: "Password changed. All sessions revoked. Please login again.",
    });
  } catch (err) {
    res.status(400).json({ message: err.message || "Change password failed" });
  }
};
