const { supabase, supabaseAdmin } = require("../config/supabase");
const { logAction } = require("../services/audit.service");

/**
 * Login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Supabase Auth login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await logAction(null, "login", "auth", null, req, {
        email,
        success: false,
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Get user profile
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (!userProfile || !userProfile.is_active) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    // Audit log
    await logAction(data.user.id, "login", "auth", data.user.id, req, {
      success: true,
    });

    return res.json({
      message: "Login successful",
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userProfile.role,
        full_name: userProfile.full_name,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get current user profile
 */
async function getProfile(req, res) {
  try {
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.json({ profile });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Logout
 */
async function logout(req, res) {
  try {
    await logAction(req.user.id, "logout", "auth", req.user.id, req);

    // Note: Frontend sẽ clear token
    return res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  login,
  getProfile,
  logout,
};
