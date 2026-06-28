const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const authenticateToken = require("../middleware/auth");

// GET /api/workout-plans
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("workout_plans")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("Workout plans error:", err);
    res.status(500).json({ error: "Server error while loading workout plans" });
  }
});

// GET /api/workout-plans/:slug
router.get("/:slug", authenticateToken, async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: plan, error: planError } = await supabase
      .from("workout_plans")
      .select("*")
      .eq("slug", slug)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ message: "Workout plan not found." });
    }

    const { data: levels, error: levelsError } = await supabase
      .from("workout_levels")
      .select(`
        *,
        workout_exercises (*)
      `)
      .eq("workout_plan_id", plan.id)
      .order("sort_order", { ascending: true });

    if (levelsError) {
      return res.status(400).json({ error: levelsError.message });
    }

    const { data: videos, error: videosError } = await supabase
      .from("workout_videos")
      .select("*")
      .eq("workout_plan_id", plan.id)
      .order("sort_order", { ascending: true });

    if (videosError) {
      return res.status(400).json({ error: videosError.message });
    }

    res.json({
      ...plan,
      levels: levels || [],
      videos: videos || []
    });
  } catch (err) {
    console.error("Workout plan detail error:", err);
    res.status(500).json({ error: "Server error while loading workout plan details" });
  }
});

module.exports = router;