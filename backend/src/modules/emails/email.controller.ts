
import type {
  Request,
  Response,
  NextFunction
} from "express";

import { scheduleEmailSchema } from "./email.validation";
import { scheduleEmails } from "./email.service";

interface AuthenticatedUser {
  id: number | string;
}

export async function scheduleEmailsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    /*
     * Passport session middleware should populate req.user.
     * Never accept userId from the request body.
     */
    const user = req.user ;

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required"
      });
      return;
    }

    const userId = Number(user.id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      res.status(401).json({
        success: false,
        message: "Invalid authenticated user"
      });
      return;
    }

    /*
     * Validate and normalize request data.
     */
    const validation = scheduleEmailSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Invalid email scheduling request",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      });
      return;
    }

    /*
     * Schedule the emails.
     */
    const result = await scheduleEmails(
      userId,
      validation.data
    );

    res.status(202).json({
      success: true,
      message: result.pendingOutboxEmails > 0
        ? "Email batch saved. Some jobs are awaiting queue dispatch."
        : "Email batch scheduled successfully",
      data: result
    });

  } catch (error) {
    const statusCode = (
      error as Error & { statusCode?: number }
    ).statusCode;

    if (statusCode) {
      res.status(statusCode).json({
        success: false,
        message: (error as Error).message
      });
      return;
    }

    next(error);
  }
}
