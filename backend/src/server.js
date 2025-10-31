require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { globalLimiter } = require("./middleware/rateLimit.middleware");

// Import routes
const authRoutes = require("./routes/auth.routes");
const patientRoutes = require("./routes/patient.routes");
const medicalRecordRoutes = require("./routes/medicalRecord.routes");
const fileRoutes = require("./routes/file.routes");
const auditRoutes = require("./routes/audit.routes");

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://your-frontend.vercel.app"]
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(globalLimiter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/audit", auditRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend: ${PORT}`);
});
