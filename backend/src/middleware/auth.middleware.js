const { supabase } = require("../config/supabase");

/**
 * Verify Supabase JWT token
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token với Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Lấy thông tin user từ DB (bao gồm role)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return res.status(403).json({ error: "User not found in database" });
    }

    if (!userData.is_active) {
      return res.status(403).json({ error: "User account is disabled" });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: userData.role,
      fullName: userData.full_name,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Check if user has required role
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied",
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
