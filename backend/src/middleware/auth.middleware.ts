
import { Request, Response, NextFunction } from "express";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check whether Passport has authenticated the user
    if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized. Please log in first.",
      });
      return;
    }

    // User is authenticated
    next();
  } catch (error) {
    next(error);
  }
};
