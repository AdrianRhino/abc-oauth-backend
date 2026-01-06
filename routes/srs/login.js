import express from "express";
import "dotenv/config";

const router = express.Router();

const {
    SRSID_STAGING,
    SRSSECRET_STAGING
} = process.env;

const SRS_CLIENT_ID = SRSID_STAGING;
const SRS_CLIENT_SECRET = SRSSECRET_STAGING;

const SRS_AUTH_URL = "https://services-qa.roofhub.pro/authentication/token"; // "https://services.roofhub.pro/authentication/token";

router.get("/login", async (req, res) => {
  try {
    // Check environment variables
    if (!SRS_CLIENT_ID || !SRS_CLIENT_SECRET) {
      return res.status(400).json({ 
        error: "SRSID_STAGING and SRSSECRET_STAGING environment variables are required",
      });
    }

    // Build request body
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: SRS_CLIENT_ID,
      client_secret: SRS_CLIENT_SECRET,
      scope: "ALL",
    });

    // Make API request
    const response = await fetch(SRS_AUTH_URL, {
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
        url: SRS_AUTH_URL,
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

