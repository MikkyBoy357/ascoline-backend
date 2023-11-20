const express = require('express');
const router = express.Router();
const Pricing = require('../models/pricingModel'); // Import the Pricing model

// GET all pricings
router.get('/', async (req, res) => {
  try {
    const pricings = await Pricing.find({});
    res.status(200).json(pricings);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET a pricing by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pricing = await Pricing.findById(id);
    if (!pricing) {
      return res.status(404).json({ message: `Cannot find any Pricing with ID ${id}` });
    }
    res.status(200).json(pricing);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a new pricing
router.post('/', async (req, res) => {
  try {
    const newPricing = await Pricing.create(req.body);
    res.status(201).json(newPricing);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update a pricing by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPricing = await Pricing.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedPricing) {
      return res.status(404).json({ message: `Cannot find any Pricing with ID ${id}` });
    }
    res.status(200).json(updatedPricing);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a pricing by ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPricing = await Pricing.findByIdAndDelete(id);
    if (!deletedPricing) {
      return res.status(404).json({ message: `Cannot find any Pricing with ID ${id}` });
    }
    res.status(200).json(deletedPricing);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;