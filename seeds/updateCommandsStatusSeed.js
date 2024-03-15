const mongoose = require("mongoose");
const PermissionModel = require("../models/permissionModel");
const CommandeModel = require("../models/commandeModel");
const {validPermissionNames} = require("../helpers/constants");



require("dotenv").config();

const updateCommandeTable = async () => {
  try {

    const oldCommandes = await CommandeModel.find().exec();


    if (oldCommandes) {

      for (let oldCommande of oldCommandes) {
        console.log(oldCommande.status);
        if (oldCommande.status === "En attente de confirmation") oldCommande.status = "En attente";
        if (oldCommande.status === "Réceptionée") oldCommande.status = "Réceptionnée";
        if (oldCommande.status === "Commande arrivée") oldCommande.status = "Arrivée";
        if (oldCommande.status === "Commande livré") oldCommande.status = "Livrée";

        await oldCommande.save();

        console.log("commande updated")
        console.log(oldCommande.status);

      }

    } else {
      console.log("no commands found");
    }
  } catch (e) {
    console.log(e.message);
  }
};

const mongoUri = `mongodb+srv://mikkyboy:mikkyboy@tutorial.sbvct.mongodb.net/ascoline?retryWrites=true&w=majority`;
mongoose.set("strictQuery", false);
mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log("Connected to MongoDB");





      await updateCommandeTable();


    mongoose.disconnect();
  })
  .catch((err) => console.log("Failed to connect to MongoDB", err));
