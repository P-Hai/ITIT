const { supabase, supabaseAdmin } = require("../config/supabase");
const {
  encryptFile,
  decryptFile,
  generateEncryptedFilename,
} = require("../services/encryption.service");
const { logAction } = require("../services/audit.service");
const { v4: uuidv4 } = require("uuid");

/**
 * Upload file (encrypted) và lưu metadata
 */
async function uploadFile(req, res) {
  try {
    const { medical_record_id } = req.body;
    const file = req.file;

    if (!file || !medical_record_id) {
      return res
        .status(400)
        .json({ error: "Missing file or medical_record_id" });
    }

    // Verify medical record exists và user có quyền
    const { data: record, error: recordError } = await supabase
      .from("medical_records")
      .select("id, patient_id")
      .eq("id", medical_record_id)
      .single();

    if (recordError || !record) {
      return res
        .status(404)
        .json({ error: "Medical record not found or access denied" });
    }

    // Encrypt file
    const fileBuffer = file.buffer;
    const { encryptedData, iv, authTag } = encryptFile(fileBuffer);

    // Generate encrypted filename
    const encryptedFilename = generateEncryptedFilename(file.originalname);
    const storagePath = `medical-records/${medical_record_id}/${encryptedFilename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("ehr-encrypted-files")
      .upload(storagePath, encryptedData, {
        contentType: "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return res
        .status(500)
        .json({ error: "Failed to upload file to storage" });
    }

    // Save file metadata to DB
    const { data: fileData, error: dbError } = await supabaseAdmin
      .from("files")
      .insert({
        medical_record_id,
        original_filename: file.originalname,
        encrypted_filename: encryptedFilename,
        file_size: file.size,
        mime_type: file.mimetype,
        storage_path: storagePath,
        iv: iv.toString("hex"),
        auth_tag: authTag.toString("hex"),
        uploaded_by: req.user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Rollback: xóa file đã upload
      await supabaseAdmin.storage
        .from("ehr-encrypted-files")
        .remove([storagePath]);
      return res.status(500).json({ error: "Failed to save file metadata" });
    }

    // Audit log
    await logAction(req.user.id, "create", "file", fileData.id, req, {
      filename: file.originalname,
      size: file.size,
    });

    return res.status(201).json({
      message: "File uploaded successfully",
      file: {
        id: fileData.id,
        filename: file.originalname,
        size: file.size,
        uploaded_at: fileData.uploaded_at,
      },
    });
  } catch (error) {
    console.error("Upload file error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Download file (decrypt)
 */
async function downloadFile(req, res) {
  try {
    const { file_id } = req.params;

    // Get file metadata từ DB (RLS sẽ check quyền)
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("*, medical_records!inner(patient_id)")
      .eq("id", file_id)
      .single();

    if (fileError || !fileData) {
      return res.status(404).json({ error: "File not found or access denied" });
    }

    // Download encrypted file from storage
    const { data: encryptedFile, error: downloadError } =
      await supabaseAdmin.storage
        .from("ehr-encrypted-files")
        .download(fileData.storage_path);

    if (downloadError) {
      console.error("Storage download error:", downloadError);
      return res.status(500).json({ error: "Failed to download file" });
    }

    // Convert blob to buffer
    const encryptedBuffer = Buffer.from(await encryptedFile.arrayBuffer());

    // Decrypt file
    const iv = Buffer.from(fileData.iv, "hex");
    const authTag = Buffer.from(fileData.auth_tag, "hex");
    const decryptedBuffer = decryptFile(encryptedBuffer, iv, authTag);

    // Audit log
    await logAction(req.user.id, "download", "file", fileData.id, req, {
      filename: fileData.original_filename,
    });

    // Send file to client
    res.setHeader("Content-Type", fileData.mime_type);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileData.original_filename}"`
    );
    res.setHeader("Content-Length", decryptedBuffer.length);

    return res.send(decryptedBuffer);
  } catch (error) {
    console.error("Download file error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get file info
 */
async function getFileInfo(req, res) {
  try {
    const { file_id } = req.params;

    const { data: fileData, error } = await supabase
      .from("files")
      .select(
        `
        id,
        original_filename,
        file_size,
        mime_type,
        uploaded_at,
        uploaded_by,
        users!files_uploaded_by_fkey(full_name, role)
      `
      )
      .eq("id", file_id)
      .single();

    if (error || !fileData) {
      return res.status(404).json({ error: "File not found or access denied" });
    }

    return res.json({ file: fileData });
  } catch (error) {
    console.error("Get file info error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Delete file
 */
async function deleteFile(req, res) {
  try {
    const { file_id } = req.params;

    // Get file metadata
    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .select("storage_path, original_filename")
      .eq("id", file_id)
      .single();

    if (fileError || !fileData) {
      return res.status(404).json({ error: "File not found or access denied" });
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from("ehr-encrypted-files")
      .remove([fileData.storage_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
    }

    // Delete from DB
    const { error: dbError } = await supabaseAdmin
      .from("files")
      .delete()
      .eq("id", file_id);

    if (dbError) {
      return res.status(500).json({ error: "Failed to delete file metadata" });
    }

    // Audit log
    await logAction(req.user.id, "delete", "file", file_id, req, {
      filename: fileData.original_filename,
    });

    return res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  uploadFile,
  downloadFile,
  getFileInfo,
  deleteFile,
};
