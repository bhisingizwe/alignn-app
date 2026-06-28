const express = require("express");
const { GoogleGenAI } = require("@google/genai");
const { createClient } = require("@supabase/supabase-js");
const authenticate = require("../middleware/auth");

const router = express.Router();

const DAILY_AI_LIMIT = 5;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getFallbackResponse(userMessage) {
  const message = String(userMessage || "").toLowerCase();

  if (message.includes("overwhelmed") || message.includes("stressed")) {
    return "I hear you. When you’re feeling overwhelmed, we can start small. Would you like a calming breathing exercise, grounding technique, light workout, or journal prompt?";
  }

  if (message.includes("workout") || message.includes("exercise")) {
    return "Of course. Based on how you feel today, I can suggest something gentle, energizing, or strength-focused. What’s your energy level right now: low, medium, or high?";
  }

  if (message.includes("journal") || message.includes("prompt")) {
    return "Here’s a reflection prompt: What is one feeling you’ve been carrying lately, and what do you wish someone understood about it?";
  }

  return "I’m here with you. I can help with calming exercises, workouts, food ideas, journal prompts, routines, or reflection. What would support you most right now?";
}

const systemPrompt = `
You are Alignn AI, a warm, conversational wellness companion inside the Alignn app.

Talk like a caring human, not a robot.
Respond directly to what the user says.
Use their context.
Ask one thoughtful follow-up question when helpful.
Give small, realistic next steps.
Avoid generic, repetitive answers.

You can support journaling, mood reflection, routines, fitness ideas, nutrition ideas, recovery, grounding, self-awareness, and personal growth.

You are not a therapist, doctor, dietitian, personal trainer, or emergency service.
Do not diagnose or treat.
If the user mentions self-harm, suicide, abuse, immediate danger, or crisis, encourage them to contact emergency services or a crisis hotline right away.

Keep most replies around 2–5 short paragraphs.
`;

router.get("/usage", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = getTodayDateString();

    const { data, error } = await supabase
      .from("ai_usage")
      .select("message_count")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .maybeSingle();

    if (error) {
      console.error("AI usage fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch AI usage" });
    }

    const used = data?.message_count || 0;

    res.json({
      limit: DAILY_AI_LIMIT,
      used,
      remaining: Math.max(DAILY_AI_LIMIT - used, 0)
    });
  } catch (error) {
    console.error("AI usage route error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/chat", authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = getTodayDateString();
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    const cleanMessage = message.trim();

    const { data: existingUsage, error: fetchError } = await supabase
      .from("ai_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("usage_date", today)
      .maybeSingle();

    if (fetchError) {
      console.error("AI usage fetch error:", fetchError);
      return res.status(500).json({ error: "Failed to check AI usage" });
    }

    const currentCount = existingUsage?.message_count || 0;

    if (currentCount >= DAILY_AI_LIMIT) {
      return res.status(429).json({
        error: "AI_LIMIT_REACHED",
        reply:
          "You’ve reached today’s free Alignn AI messages. Your messages will reset at midnight, or you can unlock unlimited support with Alignn Premium when it launches.",
        limit: DAILY_AI_LIMIT,
        used: currentCount,
        remaining: 0
      });
    }

    let reply;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `${systemPrompt}\n\nUser message: ${cleanMessage}`
      });

      reply = response.text?.trim() || getFallbackResponse(cleanMessage);
    } catch (geminiError) {
      console.error("Gemini error:", geminiError);
      reply = getFallbackResponse(cleanMessage);
    }

    const newCount = currentCount + 1;

    if (existingUsage) {
      await supabase
        .from("ai_usage")
        .update({
          message_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingUsage.id);
    } else {
      await supabase.from("ai_usage").insert([
        {
          user_id: userId,
          usage_date: today,
          message_count: newCount
        }
      ]);
    }

    res.json({
      reply,
      limit: DAILY_AI_LIMIT,
      used: newCount,
      remaining: Math.max(DAILY_AI_LIMIT - newCount, 0)
    });
  } catch (error) {
    console.error("AI chat route error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;