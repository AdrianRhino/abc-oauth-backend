import express from "express";
import "dotenv/config";

const router = express.Router();

const { HUBSPOT_API_KEY } = process.env;
const HUBSPOT_BASE_URL = "https://api.hubapi.com";

// Helper to make HubSpot API requests
async function hubspotRequest(endpoint, options = {}) {
  const url = `${HUBSPOT_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${HUBSPOT_API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`HubSpot API error: ${JSON.stringify(data)}`);
  }

  return data;
}

// Get deals (2025.2 style - using v3 API)
router.get("/deals", async (req, res) => {
  try {
    const { dealId, limit = 10, after } = req.query;
    
    if (dealId) {
      // Get single deal
      const data = await hubspotRequest(`/crm/v3/objects/deals/${dealId}`);
      return res.json(data);
    }

    // List deals with pagination
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(after && { after }),
    });

    const data = await hubspotRequest(`/crm/v3/objects/deals?${params}`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update deal
router.post("/deals", async (req, res) => {
  try {
    const { dealId, properties } = req.body;

    if (dealId) {
      // Update existing deal
      const data = await hubspotRequest(`/crm/v3/objects/deals/${dealId}`, {
        method: "PATCH",
        body: JSON.stringify({ properties }),
      });
      return res.json(data);
    }

    // Create new deal
    const data = await hubspotRequest("/crm/v3/objects/deals", {
      method: "POST",
      body: JSON.stringify({ properties }),
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get deal associations (2025.2 style - using v4 associations API)
router.get("/deals/:dealId/associations", async (req, res) => {
  try {
    const { dealId } = req.params;
    const { toObjectType } = req.query;

    if (!toObjectType) {
      return res.status(400).json({ error: "toObjectType query parameter is required" });
    }

    // Using v4 associations API
    const data = await hubspotRequest(
      `/crm/v4/associations/deals/${dealId}/${toObjectType}/batch/read`,
      {
        method: "POST",
        body: JSON.stringify({
          inputs: [{ id: dealId }],
        }),
      }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create association (2025.2 style)
router.post("/deals/:dealId/associations", async (req, res) => {
  try {
    const { dealId } = req.params;
    const { toObjectType, toObjectId } = req.body;

    if (!toObjectType || !toObjectId) {
      return res.status(400).json({ 
        error: "toObjectType and toObjectId are required in request body" 
      });
    }

    // Using v4 associations API
    const data = await hubspotRequest(
      `/crm/v4/associations/deals/${toObjectType}/batch/associate/default`,
      {
        method: "POST",
        body: JSON.stringify({
          inputs: [
            {
              from: { id: dealId },
              to: { id: toObjectId },
            },
          ],
        }),
      }
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

