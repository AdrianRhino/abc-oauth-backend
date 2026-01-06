import express from "express";
import "dotenv/config";

const router = express.Router();

const {
  BEACON_USERNAME,
  BEACON_PASSWORD,
  BEACON_API_SITE_ID
} = process.env;

const BEACON_LOGIN_URL = "https://beaconproplus.com/v1/rest/com/becn/login";

router.get("/login", async (req, res) => {
  try {
    if (!BEACON_USERNAME || !BEACON_PASSWORD) {
      return res.status(400).json({ 
        error: "BEACON_USERNAME and BEACON_PASSWORD environment variables are required" 
      });
    }

    const loginPayload = {
      username: BEACON_USERNAME,
      password: BEACON_PASSWORD,
      siteId: "homeSite",
      persistentLoginType: "RememberMe",
      userAgent: "desktop",
    };

    // Only include apiSiteId if configured
    if (BEACON_API_SITE_ID && BEACON_API_SITE_ID.trim() !== "") {
      loginPayload.apiSiteId = BEACON_API_SITE_ID;
    }

    const response = await fetch(BEACON_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginPayload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Extract cookies from response
    const rawCookies = response.headers.get("set-cookie");
    let cookieString = "";
    
    if (rawCookies) {
      // Handle both single cookie string and array
      const cookies = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      cookieString = cookies
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
    }

    res.json({
      success: true,
      cookies: cookieString,
      data: data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

