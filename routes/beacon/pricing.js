import express from "express";
import "dotenv/config";

const router = express.Router();

const BEACON_BASE_URL = "https://beaconproplus.com/v1/rest/com/becn";

// Helper to get session cookies
async function getSessionCookies() {
  const {
    BEACON_USERNAME,
    BEACON_PASSWORD,
    BEACON_API_SITE_ID
  } = process.env;

  if (!BEACON_USERNAME || !BEACON_PASSWORD) {
    throw new Error("BEACON_USERNAME and BEACON_PASSWORD environment variables are required");
  }

  const loginPayload = {
    username: BEACON_USERNAME,
    password: BEACON_PASSWORD,
    siteId: "homeSite",
    persistentLoginType: "RememberMe",
    userAgent: "desktop",
  };

  if (BEACON_API_SITE_ID && BEACON_API_SITE_ID.trim() !== "") {
    loginPayload.apiSiteId = BEACON_API_SITE_ID;
  }

  const response = await fetch(`${BEACON_BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginPayload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Beacon login failed: ${JSON.stringify(error)}`);
  }

  const rawCookies = response.headers.get("set-cookie");
  if (!rawCookies) {
    throw new Error("No cookies received from Beacon login");
  }

  const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
  return cookies.map((cookie) => cookie.split(";")[0]).join("; ");
}

router.get("/pricing", async (req, res) => {
  try {
    const { skuIds, accountId } = req.query;
    
    if (!skuIds) {
      return res.status(400).json({ error: "skuIds query parameter is required" });
    }

    const cookies = await getSessionCookies();
    const pricingUrl = `${BEACON_BASE_URL}/pricing?skuIds=${skuIds}${accountId ? `&accountId=${accountId}` : ""}`;

    const response = await fetch(pricingUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookies,
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

