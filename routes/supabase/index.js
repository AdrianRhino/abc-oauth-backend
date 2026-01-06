import express from "express";
import itemsRoutes from "./items.js";

const router = express.Router();

router.use("/", itemsRoutes);

export default router;

