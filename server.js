import express from "express";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 8081;

const {
  ABC_AUTH_BASE,
  ABC_CLIENT_ID_SANDBOX,
  ABC_CLIENT_SECRET_SANDBOX
} = process.env;

// Base64 helper
function toBase64(str) {
  return Buffer.from(str).toString("base64");
}

app.get("/api/get-token", async (req, res) => {
  try {
    const tokenUrl = `${ABC_AUTH_BASE}/v1/token`;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      // Optionally include a scopes parameter here
      // scope: "location.read product.read pricing.read"
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

    // return the token as JSON
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
