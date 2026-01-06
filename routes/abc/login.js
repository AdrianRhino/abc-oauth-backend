import express from "express";
import "dotenv/config";

const router = express.Router();

const {
  ABC_AUTH_BASE,
  ABC_CLIENT_ID_SANDBOX,
  ABC_CLIENT_SECRET_SANDBOX
} = process.env;

function toBase64(str) {
  return Buffer.from(str).toString("base64");
}

router.get("/login", async (req, res) => {
  try {
    const tokenUrl = `${ABC_AUTH_BASE}/v1/token`;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
    });

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
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
