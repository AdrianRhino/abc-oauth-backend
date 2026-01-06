import express from "express";
import dealsRoutes from "./deals.js";

const router = express.Router();

router.use("/", dealsRoutes);

export default router;

