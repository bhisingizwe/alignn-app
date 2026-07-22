const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const authenticate = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// SAVE A REFLECTION
router.post('/', authenticate, async (req, res) => {
  try {
    const { prompt, answer } = req.body;
    const userId = req.user.userId;

    if (!prompt || !answer) {
      return res.status(400).json({ error: 'Prompt and answer are required' });
    }

    const { data, error } = await supabase
      .from('reflections')
      .insert([{ user_id: userId, prompt, answer }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Reflection saved successfully',
      reflection: data
    });

  } catch (error) {
    console.error('Reflection error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET ALL REFLECTIONS for the logged-in user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ reflections: data });

  } catch (error) {
    console.error('Reflection fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// SAVE a reflection using a promptId (dice or chosen prompt)
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
      console.error('Prompt lookup error:', promptError);
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // Save the reflection using the existing database schema
    const { data, error } = await supabase
      .from('reflections')
      .insert([{ user_id: userId, prompt: promptData.question, answer }])
      .select()
      .single();

    if (error) {
      console.error('Reflection save error:', error);
      return res.status(500).json({ error: 'Failed to save reflection' });
    }

    res.status(201).json({
      message: 'Reflection saved from prompt successfully',
      reflection: data
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;