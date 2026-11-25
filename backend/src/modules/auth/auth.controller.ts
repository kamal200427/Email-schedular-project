
import type {
  Request,
  Response,
  NextFunction
} from "express";

import { env } from "../../config/env";

const COOKIE_NAME = "email_scheduler.sid";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/"
};

/**
 * GET /api/v1/auth/me
 *
 * Return the currently authenticated user.
 */
export function getCurrentUser(
  req: Request,
  res: Response
): void {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: "Authentication required"
    });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      googleId: user.googleId,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    }
  });
}

/**
 * GET /api/v1/auth/google/callback
 *
 * Called after successful Google authentication.
 */
export function googleCallback(
  req: Request,
  res: Response
): void {
  if (!req.user) {
    res.redirect(
      `${env.FRONTEND_URL}/login?error=authentication_failed`
    );
    return;
  }

  // Ensure the session is saved before redirecting.
  req.session.save((error) => {
    if (error) {
      console.error("Session save failed:", error);

      res.redirect(
        `${env.FRONTEND_URL}/login?error=session_failed`
      );
      return;
    }

    res.redirect(`${env.FRONTEND_URL}/dashboard`);
  });
}

/**
 * POST /api/v1/auth/logout
 *
 * Log out the user and destroy the Redis session.
 */
export function logout(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req.logout((logoutError) => {
    if (logoutError) {
      next(logoutError);
      return;
    }

    req.session.destroy((sessionError) => {
      if (sessionError) {
        next(sessionError);
        return;
      }

      res.clearCookie(COOKIE_NAME, cookieOptions);

      res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    });
  });
}
