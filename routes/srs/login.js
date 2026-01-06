import express from "express";
import { getSupplierConfig, getAvailableEnvironments } from "../../utils/getSupplierConfig.js";

const router = express.Router();

router.get("/login", async (req, res) => {
  try {
    // Get environment from query param or use default
    const environment = req.query.env || null;
    
    // Get config for the selected environment
    const config = getSupplierConfig("srs", environment);
    
    if (!config.clientId || !config.clientSecret) {
      return res.status(400).json({ 
        error: `SRS credentials missing for environment: ${environment || "default"}`,
        availableEnvironments: getAvailableEnvironments("srs")
      });
    }

    // Build request body
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      scope: "ALL",
    });

    // Make API request
    const response = await fetch(config.authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body
    });

    // Parse response
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      return res.status(500).json({
        error: "Failed to parse SRS API response",
        parseError: parseError.message,
        status: response.status,
        statusText: response.statusText
      });
    }

    // Handle error responses
    if (!response.ok) {
      return res.status(response.status).json({
        error: "SRS authentication failed",
        status: response.status,
        statusText: response.statusText,
        url: config.authUrl,
        environment: environment || "default",
        data: data
      });
    }

    // Check if access_token exists in response
    if (!data.access_token) {
      return res.status(500).json({
        error: "No access_token in SRS response",
        responseKeys: Object.keys(data),
        data: data
      });
    }

    // Success response
    res.json({
      success: true,
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
      environment: environment || "default",
      data: data
    });
  } catch (err) {
    res.status(500).json({ 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;

