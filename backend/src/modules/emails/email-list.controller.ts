
import { Request, Response, NextFunction } from "express";
import { searchEmailsByUser } from "./email-list.service";

import {
  getEmailsByType,
  EmailListType,
} from "./email-list.service";

const getEmailList = (type: EmailListType) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      const result = await getEmailsByType(userId, type);

      res.status(200).json({
        success: true,
        emails: result.emails,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  };
};

export const getScheduledEmails = getEmailList("scheduled");

export const getSentEmails = getEmailList("sent");

export const getFailedEmails = getEmailList("failed");

 
export const searchEmails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const query = typeof req.query.q === "string"
      ? req.query.q.trim()
      : "";

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!query) {
      res.status(400).json({
        success: false,
        message: "Please provide a search query.",
      });
      return;
    }

    if (query.length > 200) {
      res.status(400).json({
        success: false,
        message: "Search query cannot exceed 200 characters.",
      });
      return;
    }

    const result = await searchEmailsByUser(userId, query);

    res.status(200).json({
      success: true,
      emails: result.emails,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
};
