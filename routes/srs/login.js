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
    if (!SRS_CLIENT_ID || !SRS_CLIENT_SECRET) {
      return res.status(400).json({ 
        error: "SRSID_STAGING and SRS_SECRET_STAGING environment variables are required" 
      });
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: SRS_CLIENT_ID,
      client_secret: SRS_CLIENT_SECRET,
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
      return res.status(response.status).json(data);
    }

    res.json({
      success: true,
      access_token: data.access_token,
      expires_in: data.expires_in,
      data: data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

