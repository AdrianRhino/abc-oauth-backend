import express from "express";
import { getSupplierConfig } from "../../utils/getSupplierConfig.js";

const router = express.Router();

function toBase64(str) {
  return Buffer.from(str).toString("base64");
}

async function getAccessToken(environment) {
  const config = getSupplierConfig("abc", environment);
  
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
    let requestBody = req.body;
    
    // If they pass simple params, convert to ABC format
    if (req.body.itemNumber && !req.body.lines) {
      // Ensure quantity is an integer
      var quantity = req.body.quantity || 1;
      quantity = parseInt(quantity, 10);
      if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
      }
      
      requestBody = {
        requestId: req.body.requestId || `Quote: ${Date.now()}`,
        shipToNumber: req.body.shipToNumber,
        branchNumber: req.body.branchNumber,
        purpose: req.body.purpose || "ordering",
        lines: [
          {
            id: "1",
            itemNumber: req.body.itemNumber,
            quantity: quantity  // Ensure it's an integer
          }
        ]
      };
      
      // Only add uom if it's provided and not null/undefined
      if (req.body.uom && req.body.uom.trim() !== "") {
        requestBody.lines[0].uom = req.body.uom;
      }
      
      // Only add length if it's provided as an object
      if (req.body.length && typeof req.body.length === "object") {
        requestBody.lines[0].length = req.body.length;
      }
    }
    
    // Validate required fields
    if (!requestBody.shipToNumber || !requestBody.branchNumber) {
      return res.status(400).json({ 
        error: "shipToNumber and branchNumber are required" 
      });
    }
    
    if (!requestBody.lines || requestBody.lines.length === 0) {
      return res.status(400).json({ 
        error: "lines array is required and must not be empty" 
      });
    }
    
    // Validate each line item
    for (var i = 0; i < requestBody.lines.length; i++) {
      var line = requestBody.lines[i];
      if (!line.id || !line.itemNumber) {
        return res.status(400).json({ 
          error: `Line ${i + 1} is missing required fields: id and itemNumber are required` 
        });
      }
      if (!line.quantity || typeof line.quantity !== "number") {
        return res.status(400).json({ 
          error: `Line ${i + 1} quantity must be a number` 
        });
      }
      // Ensure quantity is integer
      line.quantity = parseInt(line.quantity, 10);
    }

    const pricingUrl = `${config.pricingBase}/api/pricing/v2/prices`;

    // Log the request for debugging
    console.log("ABC Pricing Request:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(pricingUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    if (!response.ok) {
      // Log the error for debugging
      console.log("ABC Pricing Error:", JSON.stringify(data, null, 2));
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;