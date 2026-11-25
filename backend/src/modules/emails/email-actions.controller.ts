
import { Request, Response, NextFunction } from "express";
import { cancelEmailForUser } from "./email-actions.service";

export const cancelEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const emailId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!Number.isSafeInteger(emailId) || emailId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid email ID.",
      });
      return;
    }

    const result = await cancelEmailForUser(userId, emailId);

    if (result.status === "not_found") {
      res.status(404).json({
        success: false,
        message: "Email not found.",
      });
      return;
    }

    if (result.status === "not_cancellable") {
      res.status(409).json({
        success: false,
        message: `Email cannot be cancelled because its current status is ${result.currentStatus}.`,
      });
      return;
    }

    if (result.status === "already_cancelled") {
      res.status(200).json({
        success: true,
        message: "Email was already cancelled.",
        emailId: String(emailId),
        status: "cancelled",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Email cancelled successfully.",
      emailId: String(emailId),
      status: "cancelled",
      queueJobRemoved: result.queueJobRemoved,
    });
  } catch (error) {
    next(error);
  }
};
