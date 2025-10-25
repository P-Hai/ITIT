const { supabaseAdmin } = require("../config/supabase");

/**
 * Ghi audit log (immutable)
 */
async function logAction(
  userId,
  action,
  resourceType,
  resourceId,
  req,
  details = {}
) {
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.headers["user-agent"],
      details,
    });

    if (error) {
      console.error("Audit log error:", error);
    }
  } catch (err) {
    console.error("Audit log exception:", err);
  }
}

module.exports = { logAction };
