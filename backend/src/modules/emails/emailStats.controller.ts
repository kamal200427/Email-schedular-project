
import { Request, Response, NextFunction } from "express";
import db from "../../config/database";

export const getEmailStats = async (
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

    const [result] = await db("emails")
      .where("user_id", userId)
      .select(
        db.raw("COUNT(*) as total"),
        db.raw("SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent"),
        db.raw("SUM(CASE WHEN status = 'scheduled' OR status = 'queued' OR status = 'pending' THEN 1 ELSE 0 END) as scheduled"),
        db.raw("SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed")
      );

    res.status(200).json({
      success: true,
      stats: {
        total: Number(result.total ?? 0),
        sent: Number(result.sent ?? 0),
        scheduled: Number(result.scheduled ?? 0),
        failed: Number(result.failed ?? 0),
      },
    });
  } catch (error) {
    next(error);
  }
};
