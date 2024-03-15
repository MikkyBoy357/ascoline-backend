const express = require("express");
const router = express.Router();
const Employee = require("../models/employeeModel");
const User = require("../models/userModel");
const { authorizeJwt, verifyAccount } = require("../helpers/verifyAccount");

router.get(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "employee", action: "read" }]),
  async (req, res) => {
    let count;
    const page = parseInt(req.query.page ?? "1");
    const limit = parseInt(req.query.limit ?? "15");

    const filter = {};
    const search = req.query.search;

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    try {
      count = await Employee.countDocuments(filter);
      const employees = await Employee.find(filter)
        .limit(limit)
        .skip((page - 1) * limit);
      res.status(200).json({
        employees,
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
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "employee", action: "read" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await Employee.findById(id);

      if (!employee) {
        return res
          .status(404)
          .json({ message: `Employee with ID ${id} not found` });
      }

      res.status(200).json(employee);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.post(
  "/",
  authorizeJwt,
  verifyAccount([{ name: "employee", action: "create" }]),
  async (req, res) => {
    try {
      const employee = await Employee.create(req.body);
      res.status(201).json(employee);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.put(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "employee", action: "update" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await Employee.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      if (!employee) {
        return res
          .status(404)
          .json({ message: `Cannot find any employee with ID ${id}` });
      }
      res.status(200).json(employee);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

router.delete(
  "/:id",
  authorizeJwt,
  verifyAccount([{ name: "employee", action: "delete" }]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const employee = await Employee.findById(id);
      if (!employee) {
        return res
          .status(404)
          .json({ message: `Cannot find any employee with ID ${id}` });
      }

      const deletedEmployee = await Employee.deleteOne({ _id: id });
      const deletedUser = await User.deleteOne({ email: employee.email });

      res.status(200).json(employee);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  },
);

module.exports = router;
