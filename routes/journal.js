const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authenticate = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// SAVE A JOURNAL ENTRY
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, prompt } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ error: 'Journal content is required' });
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .insert([{ user_id: userId, title, content, prompt }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Journal entry saved successfully',
      entry: data
    });

  } catch (error) {
    console.error('Journal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET ALL JOURNAL ENTRIES for the logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ entries: data });

  } catch (error) {
    console.error('Journal fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;