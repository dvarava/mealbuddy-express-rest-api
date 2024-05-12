const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  amount: { type: Number, required: true },
  unit: { type: String, required: true },
  original: { type: String, required: true }
});

const groceryListSchema = new mongoose.Schema({
  items: [ingredientSchema]
});

const GroceryList = mongoose.model('GroceryList', groceryListSchema);

module.exports = GroceryList;