
import { Router } from "express";
import { getEmailStats} from "./emailStats.controller"
import { requireAuth } from "../../middleware/auth.middleware";


const router = Router();

router.get("/stats", getEmailStats,requireAuth);

export default router;
