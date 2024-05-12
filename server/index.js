const express = require('express');
const bodyParser = require('body-parser')

const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5050;

const mongoose = require('mongoose');
const RecipeModel = require('./recipe-schema');
const MealPlanModel = require('./meal-plan-schema');
const GroceryListModel = require('./grocery-schema');

mongoose.connect("mongodb+srv://varavadenik16:c8GTW6LzhLHO8ImU@cluster0.lutyet8.mongodb.net/recipesdb?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log('Connected to MongoDB')
  })
  .catch(() => {
    console.log('Error connecting to MongoDB');
  })
  
const corsOptions = {
  origin: 'http://mealbuddywp1.s3-website-eu-west-1.amazonaws.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

// Get the recipes
app.get('/recipes', (req, res, next) => {
  RecipeModel.find()
  .then((data) => {
      res.json({'recipes': data});
  })
  .catch(() => {
      console.log('Error fetching entries')
  })
});

// Add a recipe to favourites
app.post('/add-recipe', async (req, res) => {
  const recipeData = req.body;
  console.log('Received recipe data:', recipeData);

  try {
    const existingRecipe = await RecipeModel.findOne({ id: recipeData.id });

    if (existingRecipe) {
      existingRecipe.title = recipeData.title;
      existingRecipe.image = recipeData.image;
      existingRecipe.servings = recipeData.servings;
      existingRecipe.readyInMinutes = recipeData.readyInMinutes;
      existingRecipe.extendedIngredients = recipeData.extendedIngredients ? recipeData.extendedIngredients.map(ingredient => ({
        originalName: ingredient.originalName,
        amount: ingredient.amount,
        unit: ingredient.unit,
        original: ingredient.original
      })) : [];
      existingRecipe.analyzedInstructions = recipeData.analyzedInstructions ? recipeData.analyzedInstructions.map(instruction => ({
        steps: instruction.steps ? instruction.steps.map(step => ({
          step: step.step,
        })) : []
      })) : [];
      existingRecipe.nutrition = recipeData.nutrition && recipeData.nutrition.nutrients ? recipeData.nutrition.nutrients.map(nutrient => ({
        title: nutrient.title,
        amount: nutrient.amount,
        unit: nutrient.unit,
      })) : [];

      const updatedRecipe = await existingRecipe.save();
      res.status(200).json({ message: 'Recipe updated', savedRecipe: updatedRecipe });
    } else {
      const recipe = new RecipeModel({
        id: recipeData.id,
        title: recipeData.title,
        image: recipeData.image,
        servings: recipeData.servings,
        readyInMinutes: recipeData.readyInMinutes,
        extendedIngredients: recipeData.extendedIngredients
        ? recipeData.extendedIngredients.map((ingredient) => ({
            originalName: ingredient.originalName,
            amount: ingredient.amount,
            unit: ingredient.unit || 'N/A',
            original: ingredient.original,
          })) : [],
        analyzedInstructions: recipeData.analyzedInstructions ? recipeData.analyzedInstructions.map(instruction => ({
          steps: instruction.steps ? instruction.steps.map(step => ({
            step: step.step,
          })) : []
        })) : [],
        nutrition: recipeData.nutrition && recipeData.nutrition.nutrients ? recipeData.nutrition.nutrients.map(nutrient => ({
          title: nutrient.title,
          amount: nutrient.amount,
          unit: nutrient.unit,
        })) : []
      });
      const savedRecipe = await recipe.save();
      res.status(200).json({ message: 'Recipe added', savedRecipe });
    }
  } catch (error) {
    console.error('Error adding/updating recipe:', error);
    res.status(500).json({ message: 'An error occurred while adding/updating the recipe' });
  }
});

// Remove a recipe from favourites
app.delete('/remove-recipe/:id', (req, res) => {
  RecipeModel.deleteOne({ id: req.params.id })
  .then(() => {
      res.status(200).json({
        message: 'Recipe removed from favourites'
      })
  })
});

// Get the meal plan
app.get('/meal-plan', (req, res) => {
  MealPlanModel.find()
    .populate('Breakfast Lunch Dinner Snacks')
    .then((mealPlans) => {
      const structuredMealPlan = {
        Monday: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
        Tuesday: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
        Wednesday: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
        Thursday: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
        Friday: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
        Saturday: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] },
        Sunday: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] }
      };

      mealPlans.forEach((mealPlan) => {
        structuredMealPlan[mealPlan.day] = {
          Breakfast: mealPlan.Breakfast,
          Lunch: mealPlan.Lunch,
          Dinner: mealPlan.Dinner,
          Snacks: mealPlan.Snacks
        };
      });

      res.json(structuredMealPlan);
    })
    .catch((error) => {
      console.error('Error fetching meal plans:', error);
      res.status(500).json({ message: 'An error occurred while fetching meal plans' });
    });
});

// Add a recipe to the meal plan
app.post('/meal-plan', async (req, res) => {
  const { id, day, mealType } = req.body;

  try {
    const recipe = await RecipeModel.findOne({ id });

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const updatedMealPlan = await MealPlanModel.findOneAndUpdate(
      { day },
      { $addToSet: { [mealType]: recipe._id } },
      { upsert: true, new: true }
    );

    console.log('Meal plan updated:', updatedMealPlan);
    res.status(200).json({ message: 'Recipe added to meal plan' });
  } catch (error) {
    console.error('Error adding recipe to meal plan:', error);
    res.status(500).json({ message: 'An error occurred while adding the recipe to meal plan' });
  }
});

// Remove a recipe from the meal plan
app.delete('/meal-plan', async (req, res) => {
  const { id, day, mealType } = req.body;

  try {
    const recipe = await RecipeModel.findOne({ id });

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const updatedMealPlan = await MealPlanModel.findOneAndUpdate(
      { day },
      { $pull: { [mealType]: recipe._id } },
      { new: true }
    );

    console.log('Meal plan updated:', updatedMealPlan);
    res.status(200).json({ message: 'Recipe removed from meal plan' });
  } catch (error) {
    console.error('Error removing recipe from meal plan:', error);
    res.status(500).json({ message: 'An error occurred while removing the recipe from meal plan' });
  }
});

// Get the grocery list
app.get('/grocery-list', async (req, res) => {
  try {
    const groceryList = await GroceryListModel.findOne({});
    if (groceryList) {
      res.json(groceryList.items);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching grocery list:', error);
    res.status(500).json({ message: 'An error occurred while fetching the grocery list' });
  }
});

// Add ingredients to the grocery list
app.post('/grocery-list', async (req, res) => {
  try {
    const { items } = req.body;
    console.log('Received items:', items);

    let groceryList = await GroceryListModel.findOne({});

    if (!groceryList) {
      groceryList = new GroceryListModel({ items });
    } else {
      groceryList.items = [...groceryList.items, ...items];
    }

    const updatedGroceryList = await groceryList.save();
    res.status(200).json({ message: 'Ingredients added to the grocery list', groceryList: updatedGroceryList.items });
  } catch (error) {
    console.error('Error adding ingredients to grocery list:', error);
    res.status(500).json({ message: 'An error occurred while adding ingredients to the grocery list' });
  }
});

// Add a single ingredient to the grocery list
app.post('/grocery-list/item', async (req, res) => {
  try {
    const { item } = req.body;
    let groceryList = await GroceryListModel.findOne({});

    if (!groceryList) {
      groceryList
    } else {
      groceryList.items.push(item);
    }

    const updatedGroceryList = await groceryList.save();
    res.status(200).json({ message: 'Ingredient added to the grocery list', groceryList: updatedGroceryList.items });
  } catch (error) {
    console.error('Error adding ingredient to grocery list:', error);
    res.status(500).json({ message: 'An error occurred while adding the ingredient to the grocery list' });
  }
});

// Remove an ingredient from the grocery list
app.delete('/grocery-list/item/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const groceryList = await GroceryListModel.findOne({});

    if (groceryList) {
      groceryList.items.splice(index, 1);
      const updatedGroceryList = await groceryList.save();
      res.status(200).json({ message: 'Ingredient removed from the grocery list', groceryList: updatedGroceryList.items });
    } else {
      res.status(404).json({ message: 'Grocery list not found' });
    }
  } catch (error) {
    console.error('Error removing ingredient from grocery list:', error);
    res.status(500).json({ message: 'An error occurred while removing the ingredient from the grocery list' });
  }
});

// Clear the grocery list
app.delete('/grocery-list', async (req, res) => {
  try {
    await GroceryListModel.deleteOne({});
    res.status(200).json({ message: 'Grocery list cleared' });
  } catch (error) {
    console.error('Error clearing grocery list:', error);
    res.status(500).json({ message: 'An error occurred while clearing the grocery list' });
  }
});

module.exports = app;
