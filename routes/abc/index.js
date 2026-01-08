import express from "express";
import loginRoutes from "./login.js";
import pricingRoutes from "./pricing.js";
import ordersRoutes from "./orders.js";
import accountRoutes from "./account.js";
import locationRoutes from "./location.js";

const router = express.Router();

router.use("/", loginRoutes);
router.use("/", pricingRoutes);
router.use("/", ordersRoutes);
router.use("/", accountRoutes);
router.use("/", locationRoutes);

export default router;

