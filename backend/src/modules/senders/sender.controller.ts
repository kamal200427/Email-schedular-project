import { getSenderSMTPConfigByUser } from "./sender.service";
import { verifySenderTransport } from "../../services/senderTransport.service";
import { Request, Response, NextFunction } from "express";
import {
  createSender,
  deleteSender,
  getSendersByUser,
  updateSender,
} from "./sender.service";
import {
  createSenderSchema,
  updateSenderSchema,
} from "./sender.validation";

export const getSenders = async (
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

    const senders = await getSendersByUser(userId);

    res.status(200).json({
      success: true,
      senders,
    });
  } catch (error) {
    next(error);
  }
};

export const addSender = async (
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

    const parsed = createSenderSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid sender details",
        errors: parsed.error.issues,
      });
      return;
    }

    const sender = await createSender(userId, parsed.data);

    res.status(201).json({
      success: true,
      message: "Sender created successfully",
      sender,
    });
  } catch (error) {
    next(error);
  }
};

export const editSender = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const senderId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!Number.isInteger(senderId) || senderId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid sender ID",
      });
      return;
    }

    const parsed = updateSenderSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid sender details",
        errors: parsed.error.issues,
      });
      return;
    }

    const sender = await updateSender(userId, senderId, parsed.data);

    res.status(200).json({
      success: true,
      message: "Sender updated successfully",
      sender,
    });
  } catch (error) {
    next(error);
  }
};

export const removeSender = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const senderId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!Number.isInteger(senderId) || senderId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid sender ID",
      });
      return;
    }

    await deleteSender(userId, senderId);

    res.status(200).json({
      success: true,
      message: "Sender deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
export const testSenderConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const senderId = Number(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    if (!Number.isInteger(senderId) || senderId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid sender ID.",
      });
      return;
    }

    const sender = await getSenderSMTPConfigByUser(
      userId,
      senderId
    );

    if (!sender) {
      res.status(404).json({
        success: false,
        message: "Active sender not found.",
      });
      return;
    }

    try {
      await verifySenderTransport(sender);

      res.status(200).json({
        success: true,
        message: "SMTP connection verified successfully.",
      });
    } catch {
      res.status(400).json({
        success: false,
        message:
          "SMTP connection verification failed. Check your host, port, security settings and credentials.",
      });
    }
  } catch (error) {
    next(error);
  }
};