import express from "express";
import "dotenv/config";
import cors from "cors";
import abcRoutes from "./routes/abc/index.js";
import beaconRoutes from "./routes/beacon/index.js";
import srsRoutes from "./routes/srs/index.js";
import hubspotRoutes from "./routes/hubspot/index.js";
import supabaseRoutes from "./routes/supabase/index.js";

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true, // Allow all origins (or specify HubSpot domains if needed)
  credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 8081;

// Mount routes
app.use("/api/abc", abcRoutes);
app.use("/api/beacon", beaconRoutes);
app.use("/api/srs", srsRoutes);
app.use("/api/hubspot", hubspotRoutes);
app.use("/api/supabase", supabaseRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
