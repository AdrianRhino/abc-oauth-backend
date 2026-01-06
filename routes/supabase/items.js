import express from "express";
import "dotenv/config";

const router = express.Router();

const { SUPABASE_URL, SUPABASEKEY } = process.env;

function getSupabaseHeaders() {
  if (!SUPABASEKEY) {
    throw new Error("SUPABASEKEY environment variable not set");
  }

  return {
    apikey: SUPABASEKEY,
    Authorization: `Bearer ${SUPABASEKEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

// Get items/products from Supabase
router.get("/items", async (req, res) => {
  try {
    const { supplier, itemNumber, search, limit = 100, offset = 0 } = req.query;

    if (!SUPABASE_URL) {
      return res.status(500).json({ error: "SUPABASE_URL not configured" });
    }

    let url = `${SUPABASE_URL}/rest/v1/products?limit=${limit}&offset=${offset}`;

    // Add filters
    const filters = [];
    if (supplier) filters.push(`supplier=eq.${supplier}`);
    if (itemNumber) filters.push(`itemnumber=eq.${itemNumber}`);
    if (search) filters.push(`itemdescription=ilike.*${search}*`);

    if (filters.length > 0) {
      url += `&${filters.join("&")}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: getSupabaseHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single item by supplier and itemNumber
router.get("/items/:supplier/:itemNumber", async (req, res) => {
  try {
    const { supplier, itemNumber } = req.params;

    if (!SUPABASE_URL) {
      return res.status(500).json({ error: "SUPABASE_URL not configured" });
    }

    const url = `${SUPABASE_URL}/rest/v1/products?supplier=eq.${supplier}&itemnumber=eq.${itemNumber}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getSupabaseHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    res.json(data.length > 0 ? data[0] : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

