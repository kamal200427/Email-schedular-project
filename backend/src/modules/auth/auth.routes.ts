
import { Router } from "express";

import passport from "../../config/passport";
import { env } from "../../config/env";

import {
  getCurrentUser,
  googleCallback,
  logout
} from "./auth.controller";

const router = Router();

/**
 * Start Google OAuth login.
 *
 * GET /api/v1/auth/google
 */
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

/**
 * Google OAuth callback.
 *
 * GET /api/v1/auth/google/callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${env.FRONTEND_URL}/login?error=google_auth_failed`
  }),
  googleCallback
);

/**
 * Get the currently authenticated user.
 *
 * GET /api/v1/auth/me
 */
router.get(
  "/me",
  getCurrentUser
);

/**
 * Logout.
 *
 * POST /api/v1/auth/logout
 */
router.post(
  "/logout",
  logout
);

export default router;
