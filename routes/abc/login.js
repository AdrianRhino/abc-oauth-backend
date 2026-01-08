import express from "express";
import { getSupplierConfig } from "../../utils/getSupplierConfig.js";

const router = express.Router();

function toBase64(str) {
  return Buffer.from(str).toString("base64");
}

router.get("/login", async (req, res) => {
  try {
    // Get environment from query param or use default
    const environment = req.query.env || null;
    const config = getSupplierConfig("abc", environment);
    
    if (!config.clientId || !config.clientSecret) {
      return res.status(400).json({ 
        error: `ABC credentials missing for environment: ${environment || "default"}`
      });
    }

    const tokenUrl = `${config.authBase}/v1/token?grant_type=client_credentials&scope=location.read product.read pricing.read account.read order.write order.read`;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      scope: "location.read product.read pricing.read account.read order.write order.read"
    });

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: "Basic " + toBase64(`${config.clientId}:${config.clientSecret}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json({
      ...data,
      environment: environment || "default"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
