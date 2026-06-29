const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurant.controller");
const adminMiddleware = require("../middleware/admin.middleware");

// Restaurant sales endpoints
router.get("/restaurant/sales", restaurantController.getSales);
router.post("/restaurant/sales", restaurantController.createSale);
router.delete("/restaurant/sales/:id", restaurantController.deleteSale);

// Restaurant menu endpoints
router.get("/restaurant/menu", restaurantController.getRestaurantMenu);
router.post("/restaurant/stock", restaurantController.updateStock);

// Restaurant inventory & logs endpoints
router.get("/restaurant/stock/usage", restaurantController.getUsageLog);
router.post("/restaurant/stock/usage", restaurantController.createUsage);
router.get("/restaurant/stock/purchases", restaurantController.getPurchaseLog);
router.post("/restaurant/stock/purchase", restaurantController.logPurchaseAndAddStock);

// Kitchen purchase requirements endpoints
router.get("/restaurant/kitchen-requirements", restaurantController.getKitchenRequirements);
router.post("/restaurant/kitchen-requirements", restaurantController.saveKitchenRequirement);
router.post("/restaurant/kitchen-requirements/status", restaurantController.updateRequirementStatus);
router.delete("/restaurant/kitchen-requirements/:id", restaurantController.deleteKitchenRequirement);

// Admin restaurant menu management endpoints (accessible from restaurant page)
router.post("/admin/restaurant/menu", restaurantController.saveRestaurantMenuItem);
router.delete("/admin/restaurant/menu/:id", restaurantController.deleteRestaurantMenuItem);

module.exports = router;
