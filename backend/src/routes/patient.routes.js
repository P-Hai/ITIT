const express = require("express");
const router = express.Router();
const {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
} = require("../controllers/patient.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authenticate);

// Create patient (Doctor/Nurse/Admin only)
router.post("/", authorize("admin", "doctor", "nurse"), createPatient);

// Get all patients (Medical staff only)
router.get(
  "/",
  authorize("admin", "doctor", "nurse", "clinic_manager"),
  getPatients
);

// Get single patient
router.get("/:patient_id", getPatient);

// Update patient (Medical staff only)
router.put(
  "/:patient_id",
  authorize("admin", "doctor", "nurse"),
  updatePatient
);

module.exports = router;
