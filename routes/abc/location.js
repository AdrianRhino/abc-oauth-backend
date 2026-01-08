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

router.get("/branch/:branchNumber", async (req, res) => {
  try {
    const environment = req.query.env || null;
    const config = getSupplierConfig("abc", environment);
    const token = await getAccessToken(environment);
    const { branchNumber } = req.params;
    
    if (!branchNumber) {
      return res.status(400).json({ 
        error: "branchNumber is required" 
      });
    }
    
    const url = `${config.pricingBase}/api/location/v1/branches/${branchNumber}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
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
