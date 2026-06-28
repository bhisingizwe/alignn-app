const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const authenticateToken = require('../middleware/auth');

// GET /api/workouts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ workouts: data });
  } catch (err) {
    console.error('Get workouts error:', err);
    res.status(500).json({ error: 'Server error while loading workouts' });
  }
});

// GET /api/workouts/recommended?mood=overwhelmed
router.get('/recommended', authenticateToken, async (req, res) => {
  try {
    const mood = req.query.mood;

    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    const normalizedMood = mood.toLowerCase().trim().replaceAll(' ', '_');

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('mood_tag', normalizedMood)
      .limit(3);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      mood: normalizedMood,
      recommendations: data
    });
  } catch (err) {
    console.error('Recommended workout error:', err);
    res.status(500).json({ error: 'Server error while loading recommendation' });
  }
});

module.exports = router;