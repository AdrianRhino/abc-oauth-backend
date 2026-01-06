import express from "express";
import "dotenv/config";

const router = express.Router();

const { SRS_API_BASE } = process.env;

async function getAccessToken() {
  const { SRSID_STAGING, SRSSECRET_STAGING } = process.env;
  const SRS_AUTH_URL = "https://services-qa.roofhub.pro/authentication/token";

  if (!SRSID_STAGING || !SRSSECRET_STAGING) {
    throw new Error("SRSID_STAGING and SRSSECRET_STAGING environment variables are required");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: SRSID_STAGING,
    client_secret: SRSSECRET_STAGING,
    scope: "ALL",
  });

  const response = await fetch(SRS_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`SRS token fetch failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

// Get orders
router.get("/orders", async (req, res) => {
  try {
    const { orderId } = req.query;
    
    if (!SRS_API_BASE) {
      return res.status(500).json({ error: "SRS_API_BASE not configured" });
    }

    const token = await getAccessToken();
    
    const ordersUrl = orderId 
      ? `${SRS_API_BASE}/orders/${orderId}`
      : `${SRS_API_BASE}/orders`;

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
    if (!SRS_API_BASE) {
      return res.status(500).json({ error: "SRS_API_BASE not configured" });
    }

    const token = await getAccessToken();
    const ordersUrl = `${SRS_API_BASE}/orders`;

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

