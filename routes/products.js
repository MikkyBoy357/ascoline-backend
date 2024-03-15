const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const ProductOrder = require("../models/productOrderModel");
const Transaction = require("../models/transactionModel");
const mongoose = require("mongoose");
const { authorizeJwt, verifyAccount } = require("../helpers/verifyAccount");
const Client = require("../models/clientModel"); // Import the Pricing model
const qosService = require("../helpers/qosHelper");
const cron = require("node-cron");
const { generateReference } = require("../helpers/constants");
const { formidable } = require("formidable");
const Commande = require("../models/commandeModel");
const { uploadFileAWS, deleteFileAWS } = require("../helpers/awsMiddleware");

// GET all products
router.get(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "product", action: "read" }]),
  async (req, res) => {
    let count;
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "15");

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
      count = await Product.countDocuments(filter);
      const products = await Product.find(filter)
        .limit(limit)
        .skip((page - 1) * limit);
      res.status(200).json({
        products,
        currentPage: page,
        limit: limit,
        totalPages: Math.ceil(count / limit),
        total: count,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server Error" });
    }
  },
);

// GET a product by ID
router.get(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "product", action: "read" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Cannot find any Product with ID ${id}` });
      }
      res.status(200).json(product);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server Error" });
    }
  },
);

// Create a new product
router.post(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "product", action: "create" }]),
  async (req, res) => {
    // Generate a new ObjectId for the _id field
    const newId = new mongoose.Types.ObjectId();

    // Assign the generated _id to req.body
    req.body._id = newId;

    try {
      const newProduct = await Product.create(req.body);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server Error" });
    }
  },
);

// Update a product by ID
router.put(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "product", action: "update" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!updatedProduct) {
        return res
          .status(404)
          .json({ message: `Cannot find any Product with ID ${id}` });
      }
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server Error" });
    }
  },
);

// Delete a product by ID
router.delete(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "product", action: "delete" }]),
  async (req, res) => {
    try {
      const { id } = req.params;

      const deletedProduct = await Product.findByIdAndDelete(id);
      if (!deletedProduct) {
        return res
          .status(404)
          .json({ message: `Cannot find any Product with ID ${id}` });
      }
      res.status(200).json(deletedProduct);
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server Error" });
    }
  },
);

router.post(
  "/pay",
  authorizeJwt,
  verifyAccount([{ name: "product", action: "create" }]),
  async (req, res) => {
    const user = req.user;
    let { amount, network, phoneNumber, productId, quantity } = req.body;
    let transactionResponse;
    const newTransactionId = new mongoose.Types.ObjectId();

    try {
      if (!amount || !network || !phoneNumber || !productId || !quantity)
        return res
          .status(404)
          .json({ message: "Les données ne sont pas correctes" });

      const client = await Client.findOne({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
      }).exec();

      const product = await Product.findOne({ _id: productId }).exec();

      if (!client)
        return res.status(404).json({ message: "Le client n'existe pas" });

      if (!product)
        return res.status(404).json({ message: "Le produit n'existe pas" });

      if (product.quantity == 0 || quantity > Number(product.quantity))
        return res
          .status(404)
          .json({ message: "La quantité du produit n'est pas suffisante" });

      amount = Number(amount);
      network = network.toUpperCase();

      const newTransaction = await Transaction.create({
        _id: newTransactionId,
        reference: generateReference(newTransactionId.toString(), 10),
        name: `Achat de ${product.name}`,
        amount: amount,
        status: "pending",
        transactionType: "product",
        client: client,
        transactionPhone: {
          network: network,
          value: phoneNumber,
        },
        item: product,
      });

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
              const productQuantity = Number(product.quantity);

              product.quantity = productQuantity - quantity;
              newTransaction.status = "success";
              newTransaction.step = "2";

              await product.save();
              await newTransaction.save();

              return res.status(200).json({
                message: `Le paiement de ${product.name} a reussi`,
              });
            case "FAILED":
              newTransaction.status = "failed";
              await newTransaction.save();

              return res.status(400).json({
                message: "Le paiement a échoué",
              });
            default:
              newTransaction.status = "failed";
              await newTransaction.save();

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

          newTransaction.status = "failed";
          await newTransaction.save();

          return res.status(400).json({
            message: "Le paiement a pris trop de temps",
          });
        }
      }, 60000);
    } catch (error) {
      const transaction = await Transaction.findOne({
        _id: newTransactionId,
      }).exec();

      if (transaction) {
        transaction.status = "failed";
        await transaction.save();
      }

      console.error(error.message);
      res.status(500).json({ message: "Server Error" });
    }
  },
);

router.post(
  "/:id/add-files",
  authorizeJwt,
  verifyAccount([{ name: "product", action: "update" }]),
  async (req, res) => {
    const { id } = req.params;
    let fields;
    let files;

    let options = {
      maxFileSize: 100 * 1024 * 1024, //100 MBs converted to bytes,
      allowEmptyFiles: false,
    };

    const form = formidable(options);
    try {
      // Fetch the initialProduct from the database
      const initialProduct = await Product.findById(id);
      if (!initialProduct) {
        return res
          .status(404)
          .json({ message: `Le produit avec l'id ${id} est introuvable` });
      }

      [fields, files] = await form.parse(req);

      if (!files.images)
        return res
          .status(400)
          .json({ message: `Veuillez vérifier le champs images` });

      const aws = await uploadFileAWS(files.images, id, "products");

      const filesLink = aws.map((item) => {
        return item[1].Location;
      });

      initialProduct.images = initialProduct.images.concat(filesLink);
      await initialProduct.save();

      res.status(200).json("good upload");
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.post(
  "/:id/remove-files",
  authorizeJwt,
  verifyAccount([{ name: "product", action: "update" }]),
  async (req, res) => {
    const { id } = req.params;
    const { images } = req.body;

    try {
      // Fetch the initialProduct from the database
      const initialProduct = await Product.findById(id);
      if (!initialProduct) {
        return res
          .status(404)
          .json({ message: `La produit avec l'id ${id} est introuvable` });
      }

      if (!images)
        return res
          .status(400)
          .json({ message: `Veuillez vérifier le champs images` });

      if (
        !images.every((img) => {
          return initialProduct.images.includes(img);
        })
      )
        return res.status(400).json({
          message: `Le ou les fichiers n'existent pas dans la produit`,
        });

      await deleteFileAWS(images);
      initialProduct.images = initialProduct.images.filter(
        (item) => !images.includes(item),
      );
      await initialProduct.save();

      res.status(200).json("good upload");
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

module.exports = router;
