const { pool } = require("../config/database");

/**
 * Fetch all restaurant sales ordered by created_at descending
 */
const getAllSales = async () => {
  const result = await pool.query("SELECT * FROM restaurant_sales ORDER BY created_at DESC, id DESC");
  return result.rows;
};

/**
 * Record a new restaurant sale
 */
const createSale = async (food_name, amount, sale_portion, stock_portion) => {
  const result = await pool.query(
    "INSERT INTO restaurant_sales (food_name, amount, sale_portion, stock_portion) VALUES ($1, $2, $3, $4) RETURNING *",
    [food_name, amount, sale_portion, stock_portion]
  );

  // Decrement menu item stock
  await pool.query(
    "UPDATE restaurant_menu_items SET stock = GREATEST(0, stock - $1) WHERE name = $2",
    [sale_portion, food_name]
  );

  return result.rows[0];
};

/**
 * Delete a restaurant sale record by ID
 */
const deleteSale = async (id) => {
  // Get sale details before deleting to revert stock
  const saleRes = await pool.query("SELECT * FROM restaurant_sales WHERE id = $1", [id]);
  if (saleRes.rows.length === 0) return false;
  
  const sale = saleRes.rows[0];

  const result = await pool.query("DELETE FROM restaurant_sales WHERE id = $1 RETURNING *", [id]);
  
  // Revert stock increment
  await pool.query(
    "UPDATE restaurant_menu_items SET stock = stock + $1 WHERE name = $2",
    [sale.sale_portion, sale.food_name]
  );

  return result.rows.length > 0;
};

/**
 * Fetch all restaurant menu items ordered by category, name
 */
const getRestaurantMenuItems = async () => {
  const result = await pool.query("SELECT * FROM restaurant_menu_items ORDER BY category, name");
  return result.rows;
};

/**
 * Add a new restaurant menu item
 */
const addRestaurantMenuItem = async (name, price, category) => {
  const result = await pool.query(
    "INSERT INTO restaurant_menu_items (name, price, category) VALUES ($1, $2, $3) RETURNING *",
    [name, price, category]
  );
  return result.rows[0];
};

/**
 * Update an existing restaurant menu item
 */
const updateRestaurantMenuItem = async (id, name, price, category) => {
  const result = await pool.query(
    "UPDATE restaurant_menu_items SET name = $1, price = $2, category = $3 WHERE id = $4 RETURNING *",
    [name, price, category, id]
  );
  return result.rows[0];
};

/**
 * Delete a restaurant menu item by ID
 */
const deleteRestaurantMenuItem = async (id) => {
  const result = await pool.query("DELETE FROM restaurant_menu_items WHERE id = $1 RETURNING *", [id]);
  return result.rows.length > 0;
};

/**
 * Update stock level of a restaurant menu item by ID
 */
const updateRestaurantItemStock = async (id, stock) => {
  const result = await pool.query(
    "UPDATE restaurant_menu_items SET stock = $1 WHERE id = $2 RETURNING *",
    [stock, id]
  );
  return result.rows[0];
};

/**
 * Fetch all usage logs
 */
const getUsageLog = async () => {
  const result = await pool.query("SELECT * FROM restaurant_usage_log ORDER BY created_at DESC, id DESC");
  return result.rows;
};

/**
 * Record a usage entry (deducts stock from restaurant_menu_items)
 */
const createUsageEntry = async (food_name, quantity, reason) => {
  // Insert log
  const result = await pool.query(
    "INSERT INTO restaurant_usage_log (food_name, quantity, reason) VALUES ($1, $2, $3) RETURNING *",
    [food_name, quantity, reason]
  );

  // Decrement stock
  await pool.query(
    "UPDATE restaurant_menu_items SET stock = GREATEST(0, stock - $1) WHERE name = $2",
    [quantity, food_name]
  );

  return result.rows[0];
};

/**
 * Fetch all purchase logs (stock additions)
 */
const getPurchaseLog = async () => {
  const result = await pool.query("SELECT * FROM restaurant_purchase_log ORDER BY created_at DESC, id DESC");
  return result.rows;
};

/**
 * Add portions to stock and log as a purchase transaction
 */
const addStockAndLogPurchase = async (menu_item_id, portions_added, amount) => {
  // Fetch food item to get its name
  const itemRes = await pool.query("SELECT * FROM restaurant_menu_items WHERE id = $1", [menu_item_id]);
  if (itemRes.rows.length === 0) return null;
  const item = itemRes.rows[0];

  // Insert purchase log
  const logResult = await pool.query(
    "INSERT INTO restaurant_purchase_log (food_name, portions_added, amount) VALUES ($1, $2, $3) RETURNING *",
    [item.name, portions_added, amount]
  );

  // Increment stock
  const updatedItemRes = await pool.query(
    "UPDATE restaurant_menu_items SET stock = stock + $1 WHERE id = $2 RETURNING *",
    [portions_added, menu_item_id]
  );

  return { log: logResult.rows[0], item: updatedItemRes.rows[0] };
};

/**
 * Fetch all kitchen purchase requirements
 */
const getKitchenRequirements = async (search = "", category = "", status = "") => {
  let query = "SELECT * FROM kitchen_purchase_requirements WHERE 1=1";
  const params = [];
  let paramIdx = 1;

  if (search) {
    query += ` AND name ILIKE $${paramIdx}`;
    params.push(`%${search}%`);
    paramIdx++;
  }

  if (category) {
    query += ` AND category = $${paramIdx}`;
    params.push(category);
    paramIdx++;
  }

  if (status) {
    query += ` AND status = $${paramIdx}`;
    params.push(status);
    paramIdx++;
  }

  query += " ORDER BY name ASC, id DESC";

  const result = await pool.query(query, params);
  return result.rows;
};

/**
 * Add or update a kitchen requirement
 */
const saveKitchenRequirement = async (id, name, category, current_stock, required_quantity, unit, status = "Pending", minimum_stock = 10) => {
  const stockVal = parseFloat(current_stock) || 0;
  const reqVal = parseFloat(required_quantity) || 0;
  const minVal = parseFloat(minimum_stock) || 10;

  if (id) {
    // Update existing item
    const result = await pool.query(
      "UPDATE kitchen_purchase_requirements SET name = $1, category = $2, current_stock = $3, required_quantity = $4, unit = $5, status = $6, minimum_stock = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *",
      [name, category, stockVal, reqVal, unit, status, minVal, id]
    );
    return result.rows[0];
  } else {
    // Insert new item
    const result = await pool.query(
      "INSERT INTO kitchen_purchase_requirements (name, category, current_stock, required_quantity, unit, status, minimum_stock) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, current_stock = EXCLUDED.current_stock, required_quantity = EXCLUDED.required_quantity, unit = EXCLUDED.unit, status = EXCLUDED.status, minimum_stock = EXCLUDED.minimum_stock, updated_at = CURRENT_TIMESTAMP RETURNING *",
      [name, category, stockVal, reqVal, unit, status, minVal]
    );
    return result.rows[0];
  }
};

/**
 * Update the status of a kitchen requirement item
 */
const updateRequirementStatus = async (id, status) => {
  const result = await pool.query(
    "UPDATE kitchen_purchase_requirements SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0];
};

/**
 * Delete a kitchen purchase requirement
 */
const deleteKitchenRequirement = async (id) => {
  const result = await pool.query("DELETE FROM kitchen_purchase_requirements WHERE id = $1 RETURNING *", [id]);
  return result.rows.length > 0;
};

module.exports = {
  getAllSales,
  createSale,
  deleteSale,
  getRestaurantMenuItems,
  addRestaurantMenuItem,
  updateRestaurantMenuItem,
  deleteRestaurantMenuItem,
  updateRestaurantItemStock,
  getUsageLog,
  createUsageEntry,
  getPurchaseLog,
  addStockAndLogPurchase,
  getKitchenRequirements,
  saveKitchenRequirement,
  updateRequirementStatus,
  deleteKitchenRequirement
};
