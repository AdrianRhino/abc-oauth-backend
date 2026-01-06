import express from "express";
import loginRoutes from "./login.js";
import pricingRoutes from "./pricing.js";
import ordersRoutes from "./orders.js";

const router = express.Router();

router.use("/", loginRoutes);
router.use("/", pricingRoutes);
router.use("/", ordersRoutes);

export default router;

