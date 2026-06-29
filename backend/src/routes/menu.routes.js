const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");
const adminMiddleware = require("../middleware/admin.middleware");

// Public endpoints
router.get("/menu", menuController.getMenu);

// Protected administrative endpoints
router.post("/admin/menu", adminMiddleware, menuController.saveMenuItem);
router.delete("/admin/menu/:id", adminMiddleware, menuController.deleteMenuItem);

// Kitchen stock & inventory routes
router.post("/kitchen/stock", menuController.updateStock);
router.get("/kitchen/stock/usage", menuController.getUsageLog);
router.post("/kitchen/stock/usage", menuController.createUsage);
router.get("/kitchen/stock/purchases", menuController.getPurchaseLog);
router.post("/kitchen/stock/purchase", menuController.logPurchaseAndAddStock);
router.put("/kitchen/stock/purchases/:id", menuController.updatePurchaseLog);
router.delete("/kitchen/stock/purchases/:id", menuController.deletePurchaseLog);

module.exports = router;
