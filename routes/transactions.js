const express = require('express');
const router = express.Router();
const Commande = require('../models/commandeModel');
const Client = require('../models/clientModel');
const Pricing = require('../models/pricingModel');

const { sendMsg } = require('../helpers/fasterMessageHelper');
const {authorizeJwt, verifyAccount} = require("../helpers/verifyAccount");
const mongoose = require("mongoose");
const Product = require("../models/productModel");
const Transaction = require("../models/transactionModel");
const qosService = require("../helpers/qosHelper");
const cron = require("node-cron");

router.get('/', authorizeJwt, verifyAccount([{name: 'transaction', action: "read"}]), async (req, res) => {

  const filter = {};
  const search = req.query.search;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { transactionType: { $regex: search, $options: "i" } },
      { step: { $regex: search, $options: "i" } },
      {transactionPhone: { network: { $regex: search, $options: "i" } }},
      {transactionPhone: { value: { $regex: search, $options: "i" } }},
    ];
  }

  try {
    const transactions = await Transaction.find(filter)
      .populate('client', 'lastName firstName email phone address')
        .populate({
          path: 'item',
          populate: [
            { path: 'client', strictPopulate: false,
              select: 'lastName firstName email phone address'
            },
            { path: 'pricing', strictPopulate: false,
              populate: {
                path: 'typeColis transportType unit',
                select: 'label description', // select specific fields to populate
              },
            },
            { path: 'typeColis', strictPopulate: false },
            { path: 'transportType', strictPopulate: false, },
            { path: 'unit', strictPopulate: false }
          ]
        });

    res.status(200).json(transactions);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get('/my', authorizeJwt, verifyAccount([{name: 'transaction', action: "read"}]), async (req, res) => {

  const user = req.user
  const filter = {};
  const search = req.query.search;

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { transactionType: { $regex: search, $options: "i" } },
      { step: { $regex: search, $options: "i" } },
      {transactionPhone: { network: { $regex: search, $options: "i" } }},
      {transactionPhone: { value: { $regex: search, $options: "i" } }},
    ];
  }

  try {

    const client = await Client.findOne({firstName: user.firstName , lastName: user.lastName, phone: user.phone, email: user.email}).exec();

    if (client) {
      filter.client = client._id;
    }

    const transactions = await Transaction.find(filter)
        .populate('client', 'lastName firstName email phone address')
        .populate({
          path: 'item',
          populate: [
            { path: 'client', strictPopulate: false,
              select: 'lastName firstName email phone address'
            },
            { path: 'pricing', strictPopulate: false,
              populate: {
                path: 'typeColis transportType unit',
                select: 'label description', // select specific fields to populate
              },
            },
            { path: 'typeColis', strictPopulate: false },
            { path: 'transportType', strictPopulate: false, },
            { path: 'unit', strictPopulate: false }
          ]
        });


    res.status(200).json(transactions);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});


module.exports = router;
