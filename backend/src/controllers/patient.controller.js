const { supabase, supabaseAdmin } = require("../config/supabase");
const { logAction } = require("../services/audit.service");

/**
 * Tạo patient mới
 */
async function createPatient(req, res) {
  try {
    const {
      user_id,
      patient_code,
      full_name,
      date_of_birth,
      gender,
      blood_type,
      allergies,
      emergency_contact_name,
      emergency_contact_phone,
      address,
    } = req.body;

    if (!patient_code || !full_name || !date_of_birth || !gender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check patient_code unique
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("patient_code", patient_code)
      .single();

    if (existing) {
      return res.status(409).json({ error: "Patient code already exists" });
    }

    const { data: patient, error } = await supabaseAdmin
      .from("patients")
      .insert({
        user_id,
        patient_code,
        full_name,
        date_of_birth,
        gender,
        blood_type,
        allergies,
        emergency_contact_name,
        emergency_contact_phone,
        address,
      })
      .select()
      .single();

    if (error) {
      console.error("Create patient error:", error);
      return res.status(500).json({ error: "Failed to create patient" });
    }

    // Audit log
    await logAction(req.user.id, "create", "patient", patient.id, req, {
      patient_code,
    });

    return res.status(201).json({
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    console.error("Create patient error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get all patients (with search & pagination)
 */
async function getPatients(req, res) {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("patients")
      .select("*, users(email, role)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,patient_code.ilike.%${search}%`
      );
    }

    const { data: patients, error, count } = await query;

    if (error) {
      console.error("Get patients error:", error);
      return res.status(500).json({ error: "Failed to fetch patients" });
    }

    return res.json({
      patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get patients error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get single patient
 */
async function getPatient(req, res) {
  try {
    const { patient_id } = req.params;

    const { data: patient, error } = await supabase
      .from("patients")
      .select(
        `
        *,
        users(email, phone, role),
        medical_records(id, title, record_type, created_at)
      `
      )
      .eq("id", patient_id)
      .single();

    if (error || !patient) {
      return res
        .status(404)
        .json({ error: "Patient not found or access denied" });
    }

    // Audit log
    await logAction(req.user.id, "read", "patient", patient_id, req);

    return res.json({ patient });
  } catch (error) {
    console.error("Get patient error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Update patient
 */
async function updatePatient(req, res) {
  try {
    const { patient_id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.patient_code;
    delete updateData.created_at;

    const { data: patient, error } = await supabase
      .from("patients")
      .update(updateData)
      .eq("id", patient_id)
      .select()
      .single();

    if (error) {
      console.error("Update patient error:", error);
      return res.status(500).json({ error: "Failed to update patient" });
    }

    // Audit log
    await logAction(
      req.user.id,
      "update",
      "patient",
      patient_id,
      req,
      updateData
    );

    return res.json({
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    console.error("Update patient error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
};
