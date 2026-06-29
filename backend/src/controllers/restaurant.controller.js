const restaurantService = require("../services/restaurant.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Fetch all restaurant sales
 */
const getSales = async (req, res, next) => {
  try {
    const sales = await restaurantService.getAllSales();
    return successResponse(res, "Sales fetched successfully", { data: sales });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a new sale item
 */
const createSale = async (req, res, next) => {
  try {
    const { food_name, amount, sale_portion, stock_portion } = req.body;

    if (!food_name || amount === undefined || sale_portion === undefined || stock_portion === undefined) {
      return errorResponse(res, "Missing required fields (food_name, amount, sale_portion, stock_portion)", null, 400);
    }

    const saleAmount = parseInt(amount);
    const salePortionVal = parseInt(sale_portion);
    const stockPortionVal = parseInt(stock_portion);

    if (isNaN(saleAmount) || isNaN(salePortionVal) || isNaN(stockPortionVal)) {
      return errorResponse(res, "Fields (amount, sale_portion, stock_portion) must be numbers", null, 400);
    }

    const newSale = await restaurantService.createSale(food_name, saleAmount, salePortionVal, stockPortionVal);
    return successResponse(res, "Sale recorded successfully ✅", { data: newSale });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a sale item by ID
 */
const deleteSale = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Missing sale ID", null, 400);
    }

    const wasDeleted = await restaurantService.deleteSale(id);
    if (!wasDeleted) {
      return errorResponse(res, "Sale record not found", null, 404);
    }

    return successResponse(res, "Sale record deleted 🗑️");
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch all restaurant menu items
 */
const getRestaurantMenu = async (req, res, next) => {
  try {
    const items = await restaurantService.getRestaurantMenuItems();
    return successResponse(res, "Restaurant menu fetched successfully", { data: items });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or Update a restaurant menu item
 */
const saveRestaurantMenuItem = async (req, res, next) => {
  try {
    const { id, name, price, category } = req.body;

    if (!name || price === undefined || !category) {
      return errorResponse(res, "Missing required fields (name, price, category)", null, 400);
    }

    const itemPrice = parseInt(price) || 0;

    if (id) {
      // Update item
      await restaurantService.updateRestaurantMenuItem(id, name, itemPrice, category);
      return successResponse(res, "Restaurant item updated ✅");
    } else {
      // Insert item
      await restaurantService.addRestaurantMenuItem(name, itemPrice, category);
      return successResponse(res, "Restaurant item added ✅");
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a restaurant menu item by ID
 */
const deleteRestaurantMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Missing item ID", null, 400);
    }

    const wasDeleted = await restaurantService.deleteRestaurantMenuItem(id);
    if (!wasDeleted) {
      return errorResponse(res, "Restaurant item not found", null, 404);
    }

    return successResponse(res, "Restaurant item deleted 🗑️");
  } catch (error) {
    next(error);
  }
};

/**
 * Update stock level of a restaurant menu item
 */
const updateStock = async (req, res, next) => {
  try {
    const { id, stock } = req.body;

    if (id === undefined || stock === undefined) {
      return errorResponse(res, "Missing required fields (id, stock)", null, 400);
    }

    const itemStock = parseInt(stock);

    if (isNaN(itemStock) || itemStock < 0) {
      return errorResponse(res, "Stock portion must be a non-negative number", null, 400);
    }

    const updatedItem = await restaurantService.updateRestaurantItemStock(id, itemStock);
    if (!updatedItem) {
      return errorResponse(res, "Restaurant item not found", null, 404);
    }

    return successResponse(res, "Stock updated successfully ✅", { data: updatedItem });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch usage logs
 */
const getUsageLog = async (req, res, next) => {
  try {
    const logs = await restaurantService.getUsageLog();
    return successResponse(res, "Usage log fetched successfully", { data: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * Record daily usage/wastage portions
 */
const createUsage = async (req, res, next) => {
  try {
    const { food_name, quantity, reason } = req.body;

    if (!food_name || quantity === undefined || !reason) {
      return errorResponse(res, "Missing required fields (food_name, quantity, reason)", null, 400);
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return errorResponse(res, "Quantity must be a positive number", null, 400);
    }

    const newUsage = await restaurantService.createUsageEntry(food_name, qty, reason);
    return successResponse(res, "Usage recorded successfully ✅", { data: newUsage });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch purchase history logs
 */
const getPurchaseLog = async (req, res, next) => {
  try {
    const logs = await restaurantService.getPurchaseLog();
    return successResponse(res, "Purchase log fetched successfully", { data: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * Add stock portions and log as purchase entry
 */
const logPurchaseAndAddStock = async (req, res, next) => {
  try {
    const { menu_item_id, portions_added, amount } = req.body;

    if (menu_item_id === undefined || portions_added === undefined) {
      return errorResponse(res, "Missing required fields (menu_item_id, portions_added)", null, 400);
    }

    const parts = parseInt(portions_added);
    const cost = parseInt(amount) || 0;

    if (isNaN(parts) || parts <= 0) {
      return errorResponse(res, "Portions added must be a positive number", null, 400);
    }

    const result = await restaurantService.addStockAndLogPurchase(menu_item_id, parts, cost);
    if (!result) {
      return errorResponse(res, "Restaurant menu item not found", null, 404);
    }

    return successResponse(res, "Stock portion added and logged successfully ✅", { data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch kitchen purchase requirements
 */
const getKitchenRequirements = async (req, res, next) => {
  try {
    const { search, category, status } = req.query;
    const items = await restaurantService.getKitchenRequirements(search, category, status);
    return successResponse(res, "Kitchen requirements fetched successfully", { data: items });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or update a kitchen requirement
 */
const saveKitchenRequirement = async (req, res, next) => {
  try {
    const { id, name, category, current_stock, required_quantity, unit, status, minimum_stock } = req.body;

    if (!name || !category || current_stock === undefined || required_quantity === undefined || !unit) {
      return errorResponse(res, "Missing required fields (name, category, current_stock, required_quantity, unit)", null, 400);
    }

    const item = await restaurantService.saveKitchenRequirement(id, name, category, current_stock, required_quantity, unit, status, minimum_stock);
    return successResponse(res, id ? "Requirement updated ✅" : "Requirement added ✅", { data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * Update requirement status
 */
const updateRequirementStatus = async (req, res, next) => {
  try {
    const { id, status } = req.body;

    if (id === undefined || !status) {
      return errorResponse(res, "Missing required fields (id, status)", null, 400);
    }

    const item = await restaurantService.updateRequirementStatus(id, status);
    if (!item) {
      return errorResponse(res, "Requirement not found", null, 404);
    }

    return successResponse(res, `Status updated to ${status} ✅`, { data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a kitchen requirement
 */
const deleteKitchenRequirement = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return errorResponse(res, "Missing requirement ID", null, 400);
    }

    const wasDeleted = await restaurantService.deleteKitchenRequirement(id);
    if (!wasDeleted) {
      return errorResponse(res, "Requirement not found", null, 404);
    }

    return successResponse(res, "Requirement deleted 🗑️");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSales,
  createSale,
  deleteSale,
  getRestaurantMenu,
  saveRestaurantMenuItem,
  deleteRestaurantMenuItem,
  updateStock,
  getUsageLog,
  createUsage,
  getPurchaseLog,
  logPurchaseAndAddStock,
  getKitchenRequirements,
  saveKitchenRequirement,
  updateRequirementStatus,
  deleteKitchenRequirement
};
