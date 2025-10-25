const { supabase, supabaseAdmin } = require("../config/supabase");
const { logAction } = require("../services/audit.service");

/**
 * Tạo medical record mới
 */
async function createMedicalRecord(req, res) {
  try {
    const {
      patient_id,
      record_type,
      title,
      description,
      diagnosis,
      treatment,
    } = req.body;

    if (!patient_id || !record_type || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patient_id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Create record
    const { data: record, error: recordError } = await supabaseAdmin
      .from("medical_records")
      .insert({
        patient_id,
        record_type,
        title,
        description,
        diagnosis,
        treatment,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (recordError) {
      console.error("Create record error:", recordError);
      return res.status(500).json({ error: "Failed to create medical record" });
    }

    // Audit log
    await logAction(req.user.id, "create", "medical_record", record.id, req, {
      title,
    });

    return res.status(201).json({
      message: "Medical record created successfully",
      record,
    });
  } catch (error) {
    console.error("Create medical record error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get medical records của patient
 */
async function getMedicalRecords(req, res) {
  try {
    const { patient_id } = req.params;

    const { data: records, error } = await supabase
      .from("medical_records")
      .select(
        `
        *,
        patients!inner(patient_code, full_name),
        users!medical_records_created_by_fkey(full_name, role),
        files(id, original_filename, file_size, uploaded_at)
      `
      )
      .eq("patient_id", patient_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get records error:", error);
      return res.status(500).json({ error: "Failed to fetch medical records" });
    }

    // Audit log
    await logAction(req.user.id, "read", "medical_record", null, req, {
      patient_id,
    });

    return res.json({ records });
  } catch (error) {
    console.error("Get medical records error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get single medical record
 */
async function getMedicalRecord(req, res) {
  try {
    const { record_id } = req.params;

    const { data: record, error } = await supabase
      .from("medical_records")
      .select(
        `
        *,
        patients!inner(patient_code, full_name, date_of_birth, gender, blood_type),
        users!medical_records_created_by_fkey(full_name, role),
        files(id, original_filename, file_size, mime_type, uploaded_at)
      `
      )
      .eq("id", record_id)
      .single();

    if (error || !record) {
      return res
        .status(404)
        .json({ error: "Medical record not found or access denied" });
    }

    // Audit log
    await logAction(req.user.id, "read", "medical_record", record_id, req);

    return res.json({ record });
  } catch (error) {
    console.error("Get medical record error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Update medical record
 */
async function updateMedicalRecord(req, res) {
  try {
    const { record_id } = req.params;
    const { title, description, diagnosis, treatment } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (treatment !== undefined) updateData.treatment = treatment;

    const { data: record, error } = await supabase
      .from("medical_records")
      .update(updateData)
      .eq("id", record_id)
      .select()
      .single();

    if (error) {
      console.error("Update record error:", error);
      return res.status(500).json({ error: "Failed to update medical record" });
    }

    // Audit log
    await logAction(
      req.user.id,
      "update",
      "medical_record",
      record_id,
      req,
      updateData
    );

    return res.json({
      message: "Medical record updated successfully",
      record,
    });
  } catch (error) {
    console.error("Update medical record error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Delete medical record
 */
async function deleteMedicalRecord(req, res) {
  try {
    const { record_id } = req.params;

    // Note: Files will be cascade deleted via DB constraint
    const { error } = await supabaseAdmin
      .from("medical_records")
      .delete()
      .eq("id", record_id);

    if (error) {
      console.error("Delete record error:", error);
      return res.status(500).json({ error: "Failed to delete medical record" });
    }

    // Audit log
    await logAction(req.user.id, "delete", "medical_record", record_id, req);

    return res.json({ message: "Medical record deleted successfully" });
  } catch (error) {
    console.error("Delete medical record error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  createMedicalRecord,
  getMedicalRecords,
  getMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
};
