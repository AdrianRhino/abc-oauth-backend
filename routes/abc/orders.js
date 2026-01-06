import express from "express";
import "dotenv/config";

const router = express.Router();

const { ABC_API_BASE } = process.env;

async function getAccessToken() {
  const { ABC_AUTH_BASE, ABC_CLIENT_ID_SANDBOX, ABC_CLIENT_SECRET_SANDBOX } = process.env;
  
  function toBase64(str) {
    return Buffer.from(str).toString("base64");
  }

  const tokenUrl = `${ABC_AUTH_BASE}/v1/token`;
  const body = new URLSearchParams({ grant_type: "client_credentials" });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: "Basic " + toBase64(`${ABC_CLIENT_ID_SANDBOX}:${ABC_CLIENT_SECRET_SANDBOX}`),
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

// Get orders
router.get("/orders", async (req, res) => {
  try {
    const { orderId } = req.query;
    const token = await getAccessToken();
    
    const ordersUrl = orderId 
      ? `${ABC_API_BASE}/v1/orders/${orderId}`
      : `${ABC_API_BASE}/v1/orders`;

    const response = await fetch(ordersUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
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

// Submit order
router.post("/orders", async (req, res) => {
  try {
    const token = await getAccessToken();
    const ordersUrl = `${ABC_API_BASE}/v1/orders`;

    const response = await fetch(ordersUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
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

