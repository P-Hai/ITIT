const { supabase } = require("../config/supabase");

/**
 * Get audit logs (Admin/Auditor only)
 */
async function getAuditLogs(req, res) {
  try {
    const {
      user_id,
      action,
      resource_type,
      start_date,
      end_date,
      page = 1,
      limit = 50,
    } = req.query;

    const offset = (page - 1) * limit;

    let query = supabase
      .from("audit_logs")
      .select(
        `
        *,
        users(email, full_name, role)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (user_id) query = query.eq("user_id", user_id);
    if (action) query = query.eq("action", action);
    if (resource_type) query = query.eq("resource_type", resource_type);
    if (start_date) query = query.gte("created_at", start_date);
    if (end_date) query = query.lte("created_at", end_date);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("Get audit logs error:", error);
      return res.status(500).json({ error: "Failed to fetch audit logs" });
    }

    return res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getAuditLogs,
};
