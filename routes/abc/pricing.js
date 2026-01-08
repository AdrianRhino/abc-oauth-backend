import express from "express";
import { getSupplierConfig } from "../../utils/getSupplierConfig.js";

const router = express.Router();

function toBase64(str) {
  return Buffer.from(str).toString("base64");
}

async function getAccessToken(environment) {
  const config = getSupplierConfig("abc", environment);
  
  const tokenUrl = `${config.authBase}/v1/token`;
  const body = new URLSearchParams({ grant_type: "client_credentials" });

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
    throw new Error(`Token fetch failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

router.post("/pricing", async (req, res) => {
  try {
    const environment = req.query.env || null;
    const config = getSupplierConfig("abc", environment);
    const token = await getAccessToken(environment);
    
    // Build the request body from the incoming request
    const requestBody = req.body;
    
    // If they pass simple params, convert to ABC format
    if (req.body.itemNumber && !req.body.lines) {
      requestBody = {
        requestId: req.body.requestId || "Quote: " + Date.now(),
        shipToNumber: req.body.shipToNumber,
        branchNumber: req.body.branchNumber,
        purpose: req.body.purpose || "ordering",
        lines: [
          {
            id: "1",
            itemNumber: req.body.itemNumber,
            quantity: req.body.quantity || 1,
            uom: req.body.uom,
            length: req.body.length
          }
        ]
      };
    }
    
    if (!requestBody.shipToNumber || !requestBody.branchNumber || !requestBody.lines || requestBody.lines.length === 0) {
      return res.status(400).json({ 
        error: "shipToNumber, branchNumber, and lines array are required" 
      });
    }

    const pricingUrl = `${config.pricingBase}/api/pricing/v2/prices`;

    const response = await fetch(pricingUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;