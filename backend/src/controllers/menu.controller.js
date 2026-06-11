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

module.exports = {
  getMenu,
  saveMenuItem,
  deleteMenuItem
};
