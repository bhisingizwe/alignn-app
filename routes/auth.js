const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const authenticate = require("../middleware/auth");
const { Resend } = require("resend");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://127.0.0.1:5500/routes/ui";

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from("users")
      .insert([{ email, password: hashedPassword, name }])
      .select()
      .single();

    if (error) throw error;

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// FORGOT PASSWORD
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return res.json({
        message: "If that email exists, a reset link has been sent."
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expires = new Date(Date.now() + 1000 * 60 * 30).toISOString();

    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_token_hash: hashedToken,
        reset_token_expires: expires
      })
      .eq("id", user.id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ error: "Failed to create reset link" });
    }

    const resetLink = `${FRONTEND_URL}/reset-password.html?token=${rawToken}`;

    const emailResult = await resend.emails.send({
  from: process.env.RESET_EMAIL_FROM,
  to: user.email,
  subject: "Reset your 𝒜lignn password",
  html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Reset your 𝒜lignn password</h2>
      <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
      <p>
        <a href="${resetLink}" style="background:#7c5cff;color:white;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
      </p>
      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `
});

console.log("Resend email result:", emailResult);

    return res.json({
      message: "If that email exists, a reset link has been sent."
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const now = new Date().toISOString();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, reset_token_hash, reset_token_expires")
      .eq("reset_token_hash", hashedToken)
      .single();

    if (userError || !user) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    if (!user.reset_token_expires || user.reset_token_expires < now) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedPassword,
        reset_token_hash: null,
        reset_token_expires: null
      })
      .eq("id", user.id);

    if (updateError) {
      console.error(updateError);
      return res.status(500).json({ error: "Failed to reset password" });
    }

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET CURRENT USER PROFILE
router.get("/me", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, created_at")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Fetch profile error:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }

    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: data });
  } catch (error) {
    console.error("Profile route error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE CURRENT USER DISPLAY NAME
router.put("/me/name", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Name is required" });
    }

    const cleanName = name.trim();

    const { data, error } = await supabase
      .from("users")
      .update({ name: cleanName })
      .eq("id", userId)
      .select("id, email, name, created_at")
      .single();

    if (error) {
      console.error("Update name error:", error);
      return res.status(500).json({ error: "Failed to update name" });
    }

    res.json({
      message: "Name updated successfully",
      user: data
    });
  } catch (error) {
    console.error("Update name route error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE CURRENT USER ACCOUNT
router.delete("/me", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { confirmText } = req.body;

    if (confirmText !== "DELETE") {
      return res.status(400).json({ error: "Confirmation text is required" });
    }

    const userOwnedTables = [
      "moods",
      "checkins",
      "journal_entries",
      "reflections"
    ];

    for (const table of userOwnedTables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("user_id", userId);

      if (error) {
        console.error(`Delete ${table} error:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        return res.status(500).json({
          error: `Failed to delete ${table}: ${error.message}`
        });
      }
    }

    const { error: deleteUserError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (deleteUserError) {
      console.error("Delete user error:", {
        message: deleteUserError.message,
        details: deleteUserError.details,
        hint: deleteUserError.hint,
        code: deleteUserError.code
      });

      return res.status(500).json({
        error: `Failed to delete account: ${deleteUserError.message}`
      });
    }

    return res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account route error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;