const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const authenticateToken = require('../middleware/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// GET /api/nutrition
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('nutrition')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ nutrition: data });
  } catch (err) {
    console.error('Get nutrition error:', err);
    res.status(500).json({ error: 'Server error while loading nutrition options' });
  }
});

// GET /api/nutrition/recommended?mood=overwhelmed
router.get('/recommended', authenticateToken, async (req, res) => {
  try {
    const mood = req.query.mood;

    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    const normalizedMood = mood.toLowerCase().trim().replaceAll(' ', '_');

    const { data, error } = await supabase
      .from('nutrition')
      .select('*')
      .eq('mood_tag', normalizedMood)
      .limit(5);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      mood: normalizedMood,
      recommendations: data
    });
  } catch (err) {
    console.error('Recommended nutrition error:', err);
    res.status(500).json({ error: 'Server error while loading nutrition recommendations' });
  }
});

// GET /api/nutrition/meal/dinner
router.get('/meal/:mealType', authenticateToken, async (req, res) => {
  try {
    const mealType = req.params.mealType.toLowerCase().trim().replaceAll(' ', '_');

    const { data, error } = await supabase
      .from('nutrition')
      .select('*')
      .eq('meal_type', mealType)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      meal_type: mealType,
      nutrition: data
    });
  } catch (err) {
    console.error('Nutrition meal type error:', err);
    res.status(500).json({ error: 'Server error while loading meals' });
  }
});

// GET /api/nutrition/category/easy_meals
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const category = req.params.category.toLowerCase().trim().replaceAll(' ', '_');

    const { data, error } = await supabase
      .from('nutrition')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      category,
      nutrition: data
    });
  } catch (err) {
    console.error('Nutrition category error:', err);
    res.status(500).json({ error: 'Server error while loading nutrition category' });
  }
});

// GET /api/nutrition/filter?mood=low_energy&meal=dinner
router.get('/filter', authenticateToken, async (req, res) => {
  try {
    const mood = req.query.mood;
    const meal = req.query.meal;

    let query = supabase
      .from('nutrition')
      .select('*')
      .order('created_at', { ascending: false });

    if (mood) {
      const normalizedMood = mood.toLowerCase().trim().replaceAll(' ', '_');
      query = query.eq('mood_tag', normalizedMood);
    }

    if (meal) {
      const normalizedMeal = meal.toLowerCase().trim().replaceAll(' ', '_');
      query = query.eq('meal_type', normalizedMeal);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      mood: mood || null,
      meal: meal || null,
      nutrition: data
    });
  } catch (err) {
    console.error('Nutrition filter error:', err);
    res.status(500).json({ error: 'Server error while filtering nutrition' });
  }
});

module.exports = router;