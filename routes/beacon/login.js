import express from "express";
import { getSupplierConfig } from "../../utils/getSupplierConfig.js";

const router = express.Router();

router.get("/login", async (req, res) => {
  try {
    // Get environment from query param or use default
    const environment = req.query.env || null;
    const config = getSupplierConfig("beacon", environment);
    
    if (!config.username || !config.password) {
      return res.status(400).json({ 
        error: `Beacon credentials missing for environment: ${environment || "default"}`
      });
    }

    const loginPayload = {
      username: config.username,
      password: config.password,
      siteId: "homeSite",
      persistentLoginType: "RememberMe",
      userAgent: "desktop",
    };

    // Only include apiSiteId if configured
    if (config.apiSiteId && config.apiSiteId.trim() !== "") {
      loginPayload.apiSiteId = config.apiSiteId;
    }

    const response = await fetch(config.loginUrl, {
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
      environment: environment || "default",
      data: data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

