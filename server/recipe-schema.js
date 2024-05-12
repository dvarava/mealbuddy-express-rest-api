const mongoose = require('mongoose');

  const ingredientSchema = new mongoose.Schema({
    originalName: { type: String, required: true },
    amount: { type: Number, required: true },
    unit: { type: String, required: false },
    original: { type: String, required: true },
  });
  
  const instructionStepSchema = new mongoose.Schema({
    step: { type: String, required: true },
  });
  
  const analyzedInstructionSchema = new mongoose.Schema({
    steps: [instructionStepSchema],
  });
  
  const nutrientSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    unit: { type: String, required: true },
  });
  
  const nutritionSchema = new mongoose.Schema({
    nutrients: [nutrientSchema],
  });
  
  const recipeSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    image: { type: String, required: true },
    servings: { type: Number, required: false },
    readyInMinutes: { type: Number, required: false },
    extendedIngredients: [ingredientSchema],
    analyzedInstructions: [analyzedInstructionSchema],
    nutrition: [nutritionSchema]
  });

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;