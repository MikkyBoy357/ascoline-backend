const express = require("express");
const router = express.Router();
const ProductOrder = require("../models/productOrderModel");
const Client = require("../models/clientModel");
const { sendMsg } = require("../helpers/fasterMessageHelper");
const { authorizeJwt, verifyAccount } = require("../helpers/verifyAccount");
const mongoose = require("mongoose");

const Transaction = require("../models/transactionModel");
const qosService = require("../helpers/qosHelper");
const cron = require("node-cron");
const {
  generateReference,
  extractAndCheckLength,
} = require("../helpers/constants");
const moment = require("moment");
const Product = require("../models/productModel");

router.get(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "commande", action: "read" }]),
  async (req, res) => {
    let count;
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "15");

    const filter = {};
    const search = req.query.search;
    const status = req.query.status && req.query.status.split(",");
    const clients = req.query.clients && req.query.clients.split(",");
    const products = req.query.products && req.query.products.split(",");
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
        { specialNote: { $regex: search, $options: "i" } },
      ];
    }

    if (status || clients || (startDate && endDate) || products) {
      filter.$and = [];

      if (status)
        filter.$and.push({
          status: {
            $in: status,
          },
        });
      if (clients)
        filter.$and.push({
          client: {
            $in: clients,
          },
        });

      if (products)
        filter.$and.push({
          product: {
            $in: products,
          },
        });

      if (startDate && endDate) {
        filter.$and.push({
          updatedAt: {
            $gt: moment(startDate).toISOString(),
            $lt: moment(endDate).toISOString(),
          },
        });
      }
    }

    try {
      count = await ProductOrder.countDocuments(filter);
      const productOrders = await ProductOrder.find(filter)
        .populate("client", "lastName firstName email phone address")
        .populate("product")
        .limit(limit)
        .skip((page - 1) * limit);

      res.status(200).json({
        productOrders,
        currentPage: page,
        limit: limit,
        totalPages: Math.ceil(count / limit),
        total: count,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.get(
  "/my",
  authorizeJwt,
  verifyAccount([{ name: "commande", action: "read" }]),
  async (req, res) => {
    const user = req.user;
    const filter = {};
    const search = req.query.search;

    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
        { specialNote: { $regex: search, $options: "i" } },
      ];
    }

    try {
      const client = await Client.findOne({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
      }).exec();

      if (client) {
        filter.client = client._id;
      }

      const productOrders = await ProductOrder.find(filter)
        .populate("client", "lastName firstName email phone address")
        .populate("product");

      res.status(200).json(productOrders);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.get(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "commande", action: "read" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const productOrder = await ProductOrder.findById(id).populate(
        "client",
        "lastName firstName email phone address",
      );

      if (!productOrder) {
        return res
          .status(404)
          .json({ message: `Cannot find any Commande with ID ${id}` });
      }
      res.status(200).json(productOrder);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.post(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "commande", action: "create" }]),
  async (req, res) => {
    try {
      const updatedRequestBody = {
        ...req.body,
        reference: generateReference(Date.now().toString(), 10),
      };

      const product = await Product.findOne({
        _id: updatedRequestBody.product,
      }).exec();

      if (!product)
        return res.status(404).json({ message: "Le produit n'existe pas" });

      if (
        product.quantity == 0 ||
        updatedRequestBody.quantity > Number(product.quantity)
      )
        return res
          .status(404)
          .json({ message: "La quantité du produit n'est pas suffisante" });

      const newProductOrder = await ProductOrder.create(updatedRequestBody);

      // Fetch the client information using the client ID from newCommande
      const clientInfo = await Client.findById(newProductOrder.client);

      if (!clientInfo) {
        return res.status(404).json({
          message: `Client with ID ${newProductOrder.client} not found`,
        });
      }

      // handle sendSMS
      {
        // Get the phone number from the updatedCommande or pass it as part of the request body
        const phoneNumber = `${clientInfo.phone.toString()}`; // Replace with your field name
        console.log(`Client Phone => ${phoneNumber}`);

        const myMessage = `Votre commande du reference: ${newProductOrder.reference.toString()} est enregistrée.\nLe statut de votre commande est: ${newProductOrder.status.toString()}`;

        console.log(phoneNumber);
        console.log(myMessage);
        // check phone number
        if (extractAndCheckLength(phoneNumber) !== null) {
          const correctPhone = `229${extractAndCheckLength(phoneNumber)}`;
          // Call the function to send SMS
          sendMsg(correctPhone, myMessage)
            .then((response) => {
              console.log("sms envoyé");
            })
            .catch((e) => {
              console.log("une erreur est survenue dans l'envoie du sms");
              console.log(e);
            }); // Customize your SMS message
        }
      }

      product.quantity = product.quantity - updatedRequestBody.quantity;

      await product.save();

      res.status(201).json(newProductOrder);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.put(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "commande", action: "update" }]),
  async (req, res) => {
    console.log("okokokkok");
    try {
      const { id } = req.params;

      console.log(req.body);

      // Fetch the initial Commande from the database
      const initialProductOrder =
        await ProductOrder.findById(id).populate("client");
      if (!initialProductOrder) {
        return res
          .status(404)
          .json({ message: `Cannot find any Commande with ID ${id}` });
      }

      // Store the initial status
      const initialStatus = initialProductOrder.status;

      // Update the Commande and get the updated version
      const updatedProductOrder = await ProductOrder.findByIdAndUpdate(
        id,
        req.body,
        {
          new: true,
          runValidators: true,
        },
      ).populate("client");
      if (!updatedProductOrder) {
        return res
          .status(404)
          .json({ message: `Cannot find any Commande with ID ${id}` });
      }

      // Fetch the client information using the client ID from updatedComande
      const clientInfo = await Client.findById(updatedProductOrder.client);

      if (!clientInfo) {
        return res.status(404).json({
          message: `Client with ID ${updatedProductOrder.client} not found`,
        });
      }

      // Compare the initial status with the updated status
      if (initialStatus !== updatedProductOrder.status) {
        console.log(
          `StatusChanges? => from ${initialStatus} to ${updatedProductOrder.status}`,
        );
        // handle sendSMS
        {
          // Get the phone number from the updatedCommande or pass it as part of the request body
          const phoneNumber = `${clientInfo.phone.toString()}`; // Replace with your field name
          console.log(`Client Phone => ${phoneNumber}`);

          const myMessage = `Votre commande du tracking id: ${updatedProductOrder.reference.toString()} est enregistrée.\nLe statut de votre commande est: ${updatedProductOrder.status.toString()}`;

          console.log(phoneNumber);
          console.log(myMessage);
          // check phone number
          if (extractAndCheckLength(phoneNumber) !== null) {
            const correctPhone = `229${extractAndCheckLength(phoneNumber)}`;
            // Call the function to send SMS
            sendMsg(correctPhone, myMessage)
              .then((response) => {
                console.log("sms envoyé");
              })
              .catch((e) => {
                console.log("une erreur est survenue dans l'envoie du sms");
                console.log(e);
              }); // Customize your SMS message
          }
        }
      } else {
        console.log("Status was not changed");
      }

      res.status(200).json(updatedProductOrder);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.delete(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "commande", action: "delete" }]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const deletedTransaction = await Transaction.findOneAndDelete({
        item: id,
      });

      const deletedOrderProduct = await ProductOrder.findByIdAndDelete(id);
      if (!deletedOrderProduct) {
        return res
          .status(404)
          .json({ message: `Cannot find any Commande with ID ${id}` });
      }
      res.status(200).json(deletedOrderProduct);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.post(
  "/pay",
  authorizeJwt,
  verifyAccount([{ name: "commande", action: "create" }]),
  async (req, res) => {
    const user = req.user;
    let { amount, network, phoneNumber, productOrderId } = req.body;
    let transactionResponse;
    const newTransactionId = new mongoose.Types.ObjectId();
    let transaction;

    try {
      if (!amount || !network || !phoneNumber || !productOrderId)
        return res
          .status(404)
          .json({ message: "Les données ne sont pas correctes" });

      const client = await Client.findOne({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
      }).exec();

      const productOrder = await ProductOrder.findOne({
        _id: productOrderId,
      }).exec();

      if (!client)
        return res.status(404).json({ message: "Le client n'existe pas" });

      if (!productOrder)
        return res.status(404).json({ message: "La commande n'existe pas" });

      if (!client._id.equals(productOrder.client))
        return res
          .status(404)
          .json({ message: "La commande n'existe pas pour ce client" });

      if (productOrder.paymentStatus === "paid")
        return res
          .status(404)
          .json({ message: "La commande a déja été payé par mobile money" });

      transaction = await Transaction.findOne({ item: productOrderId }).exec();

      amount = Number(amount);
      network = network.toUpperCase();

      if (transaction) {
        if (transaction.status === "success")
          return res
            .status(404)
            .json({ message: "La commande a déja une transaction réussie" });
      } else {
        transaction = await Transaction.create({
          _id: newTransactionId,
          reference: generateReference(newTransactionId.toString(), 10),
          name: `Paiement du produit ${productOrder.reference}`,
          amount: amount,
          status: "pending",
          step: "1",
          transactionType: "product",
          client: client,
          transactionPhone: {
            network: network,
            value: phoneNumber,
          },
          item: productOrder,
        });
      }

      const qosResponse = await qosService.makePayment(
        process.env.NODE_ENV === "development" ? "22967662166" : phoneNumber,
        process.env.NODE_ENV === "development" ? 1 : amount,
        network,
      );

      const processPayment = async () => {
        let qosTransactionResponse = await qosService.getTransactionStatus(
          qosResponse.data.transref,
          network,
        );

        transactionResponse = qosTransactionResponse.data;

        console.log(qosTransactionResponse.data.responsemsg);

        if (qosTransactionResponse.data.responsemsg !== "PENDING") {
          task.stop();
          switch (qosTransactionResponse.data.responsemsg) {
            case "SUCCESS":
            case "SUCCESSFUL":
              productOrder.paymentStatus = "paid";
              transaction.status = "success";
              transaction.step = "2";

              await productOrder.save();
              await transaction.save();

              return res.status(200).json({
                message: `Le paiement de la commande ${productOrder.reference} a reussi`,
              });
            case "FAILED":
              transaction.status = "failed";
              await transaction.save();

              return res.status(400).json({
                message: "Le paiement a échoué",
              });
            default:
              transaction.status = "failed";
              await transaction.save();

              return res.status(400).json({
                message: "Le paiement a échoué",
              });
          }
        }
      };

      const task = cron.schedule("*/15 * * * * *", processPayment);

      setTimeout(async () => {
        if (transactionResponse.responsemsg === "PENDING") {
          task.stop();

          transaction.status = "failed";
          await transaction.save();

          return res.status(400).json({
            message: "Le paiement a pris trop de temps",
          });
        }
      }, 60000);
    } catch (error) {
      if (transaction) {
        transaction.status = "failed";
        await transaction.save();
      }

      console.error(error.message);
      res.status(500).json({ message: "Erreur du serveur" });
    }
  },
);
module.exports = router;
