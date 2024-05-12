const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  Breakfast: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
  Lunch: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
  Dinner: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
  Snacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
});

module.exports = mongoose.model("MealPlan", mealPlanSchema);