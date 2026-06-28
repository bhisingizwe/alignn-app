const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const FEELING_TO_CATEGORIES = {
  anxious: ["grounding", "processing"],
  overwhelmed: ["grounding", "processing"],
  stressed: ["grounding"],
  
  lonely: ["processing", "hope"],
  sad: ["processing", "hope"],
  numb: ["processing", "grounding"],
  angry: ["processing", "grounding"],
  stuck: ["growth", "processing"],

  hopeful: ["hope", "growth"],
  happy: ["hope", "growth"]
};

// GET prompts (filter by type and/or category)
// Examples:
// /api/prompts?type=reflection
// /api/prompts?type=reflection&category=grounding
router.get('/', async (req, res) => {
  try {
    const { type, category } = req.query;

    let query = supabase
      .from('prompts')
      .select('id, type, category, question, created_at')
      .order('created_at', { ascending: true });

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) {
      console.error('Fetch prompts error:', error);
      return res.status(500).json({ error: 'Failed to fetch prompts' });
    }

    res.json({ prompts: data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET one random prompt (optional filters: type, category)
// Example: /api/prompts/random?type=reflection&category=grounding
router.get('/random', async (req, res) => {
  try {
    const { type, category } = req.query;

    let query = supabase
      .from('prompts')
      .select('id, type, category, question');

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) {
      console.error('Fetch random prompt error:', error);
      return res.status(500).json({ error: 'Failed to fetch prompt' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No prompts found for that filter' });
    }

    const randomPrompt = data[Math.floor(Math.random() * data.length)];
    res.json({ prompt: randomPrompt });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET unique categories for a type
// Example: /api/prompts/categories?type=reflection
router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;

    let query = supabase
      .from('prompts')
      .select('category');

    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) {
      console.error('Fetch categories error:', error);
      return res.status(500).json({ error: 'Failed to fetch categories' });
    }

    const categories = [...new Set((data || []).map(row => row.category))].sort();
    res.json({ categories });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET gentle suggested prompts based on "feeling"
// Example: /api/prompts/suggested?type=reflection&feeling=anxious
router.get('/suggested', async (req, res) => {
  try {
    const { type = "reflection", feeling } = req.query;

    if (!feeling) {
      return res.status(400).json({ error: "feeling is required" });
    }

    const categories = FEELING_TO_CATEGORIES[feeling.toLowerCase()];

    if (!categories) {
      return res.status(404).json({ error: `No mapping found for feeling: ${feeling}` });
    }

    const { data, error } = await supabase
      .from("prompts")
      .select("id, type, category, question")
      .eq("type", type)
      .or(categories.map((cat) => `category.eq.${cat}`).join(","))
      .limit(5);

    if (error) {
      console.error("Suggested prompts error:", error);
      return res.status(500).json({ error: "Failed to fetch suggested prompts" });
    }

    res.json({
      feeling,
      categories,
      suggested: data || []
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET one prompt by id
// Example: /api/prompts/0d2b3f7b-3e7d-4a22-81c0-d2f9b30edbce
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('prompts')
      .select('id, type, category, question, created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fetch prompt by id error:', error);
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.json({ prompt: data });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;