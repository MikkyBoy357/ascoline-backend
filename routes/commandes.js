const express = require('express');
const router = express.Router();
const Commande = require('../models/commandeModel');
const Client = require('../models/clientModel');
const Pricing = require('../models/pricingModel');

const { sendMsg } = require('../helpers/fasterMessageHelper');
const {authorizeJwt, verifyAccount} = require("../helpers/verifyAccount");

router.get('/', authorizeJwt, verifyAccount([{name: 'commande', action: "read"}]), async (req, res) => {

  const filter = {};
  const search = req.query.search;

  if (search) {
    filter.$or = [
      { trackingId: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { pays: { $regex: search, $options: "i" } },
      { ville: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { specialNote: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const commandes = await Commande.find(filter)
      .populate('client', 'lastName firstName email phone address')
      .populate({
        path: 'pricing',
        populate: {
          path: 'typeColis transportType unit',
          select: 'label description', // select specific fields to populate
        },
      })
      .populate('unit typeColis transportType', '_id label description');

    res.status(200).json(commandes);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get('/my', authorizeJwt, verifyAccount([{name: 'commande', action: "read"}]), async (req, res) => {

  const user = req.user
  const filter = {};
  const search = req.query.search;

  if (search) {
    filter.$or = [
      { trackingId: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { pays: { $regex: search, $options: "i" } },
      { ville: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { specialNote: { $regex: search, $options: "i" } },
    ];
  }

  try {

    const client = await Client.findOne({firstName: user.firstName , lastName: user.lastName, phone: user.phone, email: user.email}).exec();

    if (client) {
      filter.client = client._id;
    }

    const commandes = await Commande.find(filter)
        .populate('client', 'lastName firstName email phone address')
        .populate({
          path: 'pricing',
          populate: {
            path: 'typeColis transportType unit',
            select: 'label description', // select specific fields to populate
          },
        })
        .populate('unit typeColis transportType', '_id label description');


    res.status(200).json(commandes);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authorizeJwt, verifyAccount([{name: 'commande', action: "read"}]),async (req, res) => {
  try {
    const { id } = req.params;
    const commande = await Commande.findById(id)
      .populate('client', 'lastName firstName email phone address')
      .populate('unit');

    if (!commande) {
      return res.status(404).json({ message: `Cannot find any Commande with ID ${id}` });
    }
    res.status(200).json(commande);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authorizeJwt, verifyAccount([{name: 'commande', action: "create"}]), async (req, res) => {
  try {
    // get pricing
    const pricing = await Pricing.findOne({ typeColis: req.body.typeColis, transportType: req.body.transportType, unit: req.body.unit })

    const updatedRequestBody = { ...req.body };

    if (pricing) {
      // Create a copy of req.body and update the copied object
      updatedRequestBody.pricing = pricing._id;

      // console.log(`==Omo2==> ${updatedRequestBody.pricing}`);
    } else {
      return res.status(404).json({ message: `Could NOT find Pricing for specified unit, typeColis and transportType` });
    }

    const newCommande = await Commande.create(updatedRequestBody);

    // Fetch the client information using the client ID from newCommande
    const clientInfo = await Client.findById(newCommande.client);

    if (!clientInfo) {
      return res.status(404).json({ message: `Client with ID ${newCommande.client} not found` });
    }

    // handle sendSMS
    {
      // Get the phone number from the updatedCommande or pass it as part of the request body
      const phoneNumber = `229${clientInfo.phone.toString()}`; // Replace with your field name
      console.log(`Client Phone => ${phoneNumber}`)



      const myMessage = `Votre commande du tracking id: ${newCommande.trackingId.toString()} est enregistrée.\nLe statut de votre commande est: ${newCommande.status.toString()}`;

      console.log(phoneNumber)
      console.log(myMessage)
      // Call the function to send SMS
      sendMsg(phoneNumber, myMessage); // Customize your SMS message
    }

    res.status(201).json(newCommande);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authorizeJwt, verifyAccount([{name: 'commande', action: "update"}]), async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the initial Commande from the database
    const initialCommande = await Commande.findById(id).populate('client');
    if (!initialCommande) {
      return res.status(404).json({ message: `Cannot find any Commande with ID ${id}` });
    }

    // Store the initial status
    const initialStatus = initialCommande.status;

    // Update the Commande and get the updated version
    const updatedCommande = await Commande.findByIdAndUpdate(id, req.body, { new: true, runValidators: true }).populate('client');
    if (!updatedCommande) {
      return res.status(404).json({ message: `Cannot find any Commande with ID ${id}` });
    }

    // Fetch the client information using the client ID from updatedComande
    const clientInfo = await Client.findById(updatedCommande.client);

    if (!clientInfo) {
      return res.status(404).json({ message: `Client with ID ${updatedCommande.client} not found` });
    }

    // Compare the initial status with the updated status
    if (initialStatus !== updatedCommande.status) {
      console.log(`StatusChanges? => from ${initialStatus} to ${updatedCommande.status}`);
      // handle sendSMS
      {
        // Get the phone number from the updatedCommande or pass it as part of the request body
        const phoneNumber = `229${clientInfo.phone.toString()}`; // Replace with your field name
        console.log(`Client Phone => ${phoneNumber}`)



        const myMessage = `Votre commande du tracking id: ${updatedCommande.trackingId.toString()} est enregistrée.\nLe statut de votre commande est: ${updatedCommande.status.toString()}`;

        console.log(phoneNumber)
        console.log(myMessage)
        // Call the function to send SMS
        sendMsg(phoneNumber, myMessage); // Customize your SMS message
      }
    } else {
      console.log('Status was not changed')
    }

    res.status(200).json(updatedCommande);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', authorizeJwt, verifyAccount([{name: 'commande', action: "delete"}]), async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCommande = await Commande.findByIdAndDelete(id);
    if (!deletedCommande) {
      return res.status(404).json({ message: `Cannot find any Commande with ID ${id}` });
    }
    res.status(200).json(deletedCommande);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
