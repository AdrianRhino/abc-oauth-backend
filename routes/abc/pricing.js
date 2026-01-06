import express from "express";
import "dotenv/config";

const router = express.Router();

const { ABC_API_BASE } = process.env;

// Helper to get access token (you can cache this in production)
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

router.get("/pricing", async (req, res) => {
  try {
    const { itemNumber, locationId } = req.query;
    
    if (!itemNumber) {
      return res.status(400).json({ error: "itemNumber query parameter is required" });
    }

    const token = await getAccessToken();
    const pricingUrl = `${ABC_API_BASE}/v1/pricing?itemNumber=${itemNumber}${locationId ? `&locationId=${locationId}` : ""}`;

    const response = await fetch(pricingUrl, {
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

export default router;

