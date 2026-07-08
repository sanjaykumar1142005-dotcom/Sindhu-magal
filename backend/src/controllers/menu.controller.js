const menuService = require("../services/menu.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Fetch all menu items
 */
const getMenu = async (req, res, next) => {
  try {
    const items = await menuService.getAllMenuItems();
    return successResponse(res, "Menu fetched successfully", { data: items });
  } catch (error) {
    next(error);
  }
};

/**
 * Add or Update a menu item
 */
const saveMenuItem = async (req, res, next) => {
  try {
    const { id, name, price, category } = req.body;

    if (!name || price === undefined || !category) {
      return errorResponse(res, "Missing required fields (name, price, category)", null, 400);
    }

    const itemPrice = parseInt(price) || 0;

    if (id) {
      // Update item
      await menuService.updateMenuItem(id, name, itemPrice, category);
      return successResponse(res, "Item updated ✅");
    } else {
      // Insert item
      await menuService.addMenuItem(name, itemPrice, category);
      return successResponse(res, "Item added ✅");
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a menu item by ID
 */
const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return errorResponse(res, "Missing item ID", null, 400);
    }

    const wasDeleted = await menuService.deleteMenuItem(id);
    if (!wasDeleted) {
      return errorResponse(res, "Item not found", null, 44);
    }

    return successResponse(res, "Item deleted 🗑️");
  } catch (error) {
    next(error);
  }
};

/**
 * Update stock level of a kitchen menu item
 */
const updateStock = async (req, res, next) => {
  try {
    const { id, stock, required_quantity } = req.body;

    if (id === undefined || stock === undefined) {
      return errorResponse(res, "Missing required fields (id, stock)", null, 400);
    }

    const itemStock = parseInt(stock);

    if (isNaN(itemStock) || itemStock < 0) {
      return errorResponse(res, "Stock portion must be a non-negative number", null, 400);
    }

    const updatedItem = await menuService.updateMenuItemStock(id, itemStock, required_quantity);
    if (!updatedItem) {
      return errorResponse(res, "Catering/Kitchen item not found", null, 404);
    }

    return successResponse(res, "Stock updated successfully ✅", { data: updatedItem });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch kitchen usage logs
 */
const getUsageLog = async (req, res, next) => {
  try {
    const logs = await menuService.getKitchenUsageLog();
    return successResponse(res, "Usage log fetched successfully", { data: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * Record kitchen daily usage/wastage portions
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

    const newUsage = await menuService.createKitchenUsageEntry(food_name, qty, reason);
    return successResponse(res, "Usage recorded successfully ✅", { data: newUsage });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch kitchen purchase history logs
 */
const getPurchaseLog = async (req, res, next) => {
  try {
    const logs = await menuService.getKitchenPurchaseLog();
    return successResponse(res, "Purchase log fetched successfully", { data: logs });
  } catch (error) {
    next(error);
  }
};

/**
 * Add kitchen stock portions and log as purchase entry
 */
const logPurchaseAndAddStock = async (req, res, next) => {
  try {
    const { menu_item_id, portions_added, amount } = req.body;

    if (menu_item_id === undefined || portions_added === undefined) {
      return errorResponse(res, "Missing required fields (menu_item_id, portions_added)", null, 400);
    }

    const parts = parseInt(portions_added);
    const cost = parseInt(amount) || 0;

    if (isNaN(parts) || parts < 0) {
      return errorResponse(res, "Portions added must be a non-negative number", null, 400);
    }

    const result = await menuService.addKitchenStockAndLogPurchase(menu_item_id, parts, cost);
    if (!result) {
      return errorResponse(res, "Catering/Kitchen menu item not found", null, 404);
    }

    return successResponse(res, "Stock portion added and logged successfully ✅", { data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Update kitchen purchase log entry
 */
const updatePurchaseLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { food_name, portions_added, amount } = req.body;

    if (!food_name || portions_added === undefined || amount === undefined) {
      return errorResponse(res, "Missing required fields (food_name, portions_added, amount)", null, 400);
    }

    const updatedLog = await menuService.updateKitchenPurchaseLog(id, food_name, portions_added, amount);
    if (!updatedLog) {
      return errorResponse(res, "Purchase log not found", null, 404);
    }

    return successResponse(res, "Purchase log updated successfully ✅", { data: updatedLog });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete kitchen purchase log entry
 */
const deletePurchaseLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedLog = await menuService.deleteKitchenPurchaseLog(id);
    if (!deletedLog) {
      return errorResponse(res, "Purchase log not found", null, 404);
    }

    return successResponse(res, "Purchase log deleted successfully 🗑️", { data: deletedLog });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete kitchen usage log entry
 */
const deleteUsageLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedLog = await menuService.deleteKitchenUsageLog(id);
    if (!deletedLog) {
      return errorResponse(res, "Usage log not found", null, 404);
    }

    return successResponse(res, "Usage log deleted successfully 🗑️", { data: deletedLog });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getMenu,
  saveMenuItem,
  deleteMenuItem,
  updateStock,
  getUsageLog,
  createUsage,
  getPurchaseLog,
  logPurchaseAndAddStock,
  updatePurchaseLog,
  deletePurchaseLog,
  deleteUsageLog
};
