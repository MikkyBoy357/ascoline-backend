const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const mongoose = require("mongoose");
const {authorizeJwt, verifyAccount} = require("../helpers/verifyAccount"); // Import the Pricing model

// GET all products
router.get('/', authorizeJwt, verifyAccount([{name: 'product', action: "read"}]), async (req, res) => {

  const filter = {};
  const search = req.query.search;

  if (search) {
    filter.$or = [
      { description: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ];

    if (!isNaN(Number(search))) {

      filter["$or"].push({ price: { $eq: Number(search) } });
    }

  }

  try {
    const products = await Product.find(filter);
    res.status(200).json(products);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET a product by ID
router.get('/:id', authorizeJwt, verifyAccount([{name: 'product', action: "read"}]),async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: `Cannot find any Product with ID ${id}` });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Create a new product
router.post('/', authorizeJwt, verifyAccount([{name: 'product', action: "create"}]),async (req, res) => {

  // Generate a new ObjectId for the _id field
  const newId = new mongoose.Types.ObjectId();

  // Assign the generated _id to req.body
  req.body._id = newId;

  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update a product by ID
router.put('/:id', authorizeJwt, verifyAccount([{name: 'product', action: "update"}]),async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: `Cannot find any Product with ID ${id}` });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Delete a product by ID
router.delete('/:id', authorizeJwt, verifyAccount([{name: 'product', action: "delete"}]),async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: `Cannot find any Product with ID ${id}` });
    }
    res.status(200).json(deletedProduct);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;