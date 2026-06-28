const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authenticate = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// SAVE A CHECK-IN
router.post('/', authenticate, async (req, res) => {
  try {
    const { mental_state, reflection } = req.body;
    const userId = req.user.userId;

    if (!mental_state) {
      return res.status(400).json({ error: 'Mental state is required' });
    }

    const { data, error } = await supabase
      .from('checkins')
      .insert([{ user_id: userId, mental_state, reflection }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Check-in saved successfully',
      checkin: data
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// SAVE a check-in using a promptId (dice or chosen prompt)
router.post('/from-prompt', authenticate, async (req, res) => {
  try {
    const { promptId, answer } = req.body;
    const userId = req.user.userId;

    if (!promptId || !answer) {
      return res.status(400).json({ error: 'promptId and answer are required' });
    }

    // 1) Fetch the prompt question text from prompts table
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('question')
      .eq('id', promptId)
      .single();

    if (promptError || !promptData) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // 2) Save into checkins table
    const { data, error } = await supabase
      .from('checkins')
      .insert([{
        user_id: userId,
        mental_state: promptData.question,   // store the prompt question here
        reflection: answer                  // store the user's answer here
      }])
      .select()
      .single();

    if (error) {
      console.error('Check-in save error:', error);
      return res.status(500).json({ error: 'Failed to save check-in' });
    }

    res.status(201).json({
      message: 'Check-in saved from prompt successfully',
      checkin: data
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET ALL CHECK-INS for the logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ checkins: data });

  } catch (error) {
    console.error('Check-in fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;