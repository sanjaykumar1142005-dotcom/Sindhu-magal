const express = require("express");
const router = express.Router();
const authRoutes = require("./auth.routes");
const menuRoutes = require("./menu.routes");

// Mount modules directly at root to maintain identical URLs for the frontend
router.use("/", authRoutes);
router.use("/", menuRoutes);

module.exports = router;
