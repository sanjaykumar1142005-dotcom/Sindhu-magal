const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");
const adminMiddleware = require("../middleware/admin.middleware");

// Public endpoints
router.get("/menu", menuController.getMenu);

// Protected administrative endpoints
router.post("/admin/menu", adminMiddleware, menuController.saveMenuItem);
router.delete("/admin/menu/:id", adminMiddleware, menuController.deleteMenuItem);

module.exports = router;
