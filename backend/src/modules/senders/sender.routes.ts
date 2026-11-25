 
import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";

import {
  getSenders,
  addSender,
  editSender,
  removeSender,
  testSenderConnection,
} from "./sender.controller";

const router = Router();

router.use(requireAuth);

router.get("/", getSenders);
router.post("/", addSender);
router.patch("/:id", editSender);
router.delete("/:id", removeSender);
// Test SMTP connection
router.post("/:id/test", testSenderConnection);
export default router;
