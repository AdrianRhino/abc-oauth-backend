import express from "express";
import "dotenv/config";
import abcRoutes from "./routes/abc/index.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8081;

app.use("/api/abc", abcRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
