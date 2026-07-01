const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const authRoutes = require("./routes/auth");
const moodRoutes = require("./routes/mood");
const checkinRoutes = require("./routes/checkin");
const journalRoutes = require("./routes/journal");
const reflectionRoutes = require("./routes/reflection");
const promptsRoutes = require("./routes/prompts");
const workoutRoutes = require("./routes/workouts");
const nutritionRoutes = require("./routes/nutrition");
const workoutPlansRoutes = require("./routes/workoutPlans");
const aiRoutes = require("./routes/ai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "routes", "ui"), {
  index: false
}));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/checkin", checkinRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/reflection", reflectionRoutes);
app.use("/api/prompts", promptsRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/workout-plans", workoutPlansRoutes);
app.use("/api/ai", aiRoutes);

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "routes", "ui", "home.html"));
});

// Keep server running locally
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});