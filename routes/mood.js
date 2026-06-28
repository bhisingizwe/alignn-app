const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Middleware to verify JWT token
const authenticateToken = require('../middleware/auth');

// Log a new mood
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { mood, intensity, notes } = req.body;
    const userId = req.user.userId;

    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    if (intensity && (intensity < 1 || intensity > 10)) {
      return res.status(400).json({ error: 'Intensity must be between 1 and 10' });
    }

    const { data, error } = await supabase
      .from('moods')
      .insert([{ user_id: userId, mood, intensity, notes }])
      .select()
      .single();

    if (error) {
      console.error('Mood logging error:', error);
      return res.status(500).json({ error: 'Failed to log mood' });
    }

    res.status(201).json({ message: 'Mood logged successfully', mood: data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all moods for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('moods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch moods error:', error);
      return res.status(500).json({ error: 'Failed to fetch moods' });
    }

    res.json({ moods: data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get mood statistics (for pie chart)
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('moods')
      .select('mood')
      .eq('user_id', userId);

    if (error) {
      console.error('Fetch stats error:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }

    // Count mood occurrences
    const moodCounts = data.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {});

    res.json({ stats: moodCounts, total: data.length });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a mood entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const moodId = req.params.id;
    const userId = req.user.userId;

    const { error } = await supabase
      .from('moods')
      .delete()
      .eq('id', moodId)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete mood error:', error);
      return res.status(500).json({ error: 'Failed to delete mood' });
    }

    res.json({ message: 'Mood deleted successfully' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;