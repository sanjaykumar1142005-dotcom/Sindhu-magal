const { pool } = require("../config/database");

/**
 * Fetch all menu items ordered by category and name
 */
const getAllMenuItems = async () => {
  const result = await pool.query(`
    SELECT m.*, COALESCE(s.stock, 100) AS stock 
    FROM menu_items m 
    LEFT JOIN catering_stock_levels s ON m.id = s.menu_item_id 
    ORDER BY m.category, m.name
  `);
  return result.rows;
};

/**
 * Add a new menu item
 */
const addMenuItem = async (name, price, category) => {
  const result = await pool.query(
    "INSERT INTO menu_items (name, price, category) VALUES ($1, $2, $3) RETURNING *",
    [name, price, category]
  );
  return result.rows[0];
};

/**
 * Update an existing menu item
 */
const updateMenuItem = async (id, name, price, category) => {
  const result = await pool.query(
    "UPDATE menu_items SET name = $1, price = $2, category = $3 WHERE id = $4 RETURNING *",
    [name, price, category, id]
  );
  return result.rows[0];
};

/**
 * Delete a menu item by ID
 */
const deleteMenuItem = async (id) => {
  const result = await pool.query("DELETE FROM menu_items WHERE id = $1 RETURNING *", [id]);
  return result.rows.length > 0;
};

/**
 * Update stock level of a catering/kitchen menu item by ID
 */
const updateMenuItemStock = async (id, stock, required_quantity = null) => {
  // Check if it matches a requirement item (raw material)
  const reqRes = await pool.query("SELECT * FROM kitchen_purchase_requirements WHERE id = $1", [id]);
  if (reqRes.rows.length > 0) {
    let query = "UPDATE kitchen_purchase_requirements SET current_stock = $1";
    const params = [stock];
    if (required_quantity !== null && required_quantity !== undefined) {
      query += ", required_quantity = $2";
      params.push(required_quantity);
    }
    query += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);

    const updated = await pool.query(query, params);
    const item = updated.rows[0];
    return { ...item, stock: parseFloat(item.current_stock) };
  }

  // Upsert stock level for menu item (original logic)
  await pool.query(`
    INSERT INTO catering_stock_levels (menu_item_id, stock) 
    VALUES ($1, $2) 
    ON CONFLICT (menu_item_id) 
    DO UPDATE SET stock = EXCLUDED.stock
  `, [id, stock]);

  // Fetch updated item details
  const result = await pool.query(`
    SELECT m.*, COALESCE(s.stock, 100) AS stock 
    FROM menu_items m 
    LEFT JOIN catering_stock_levels s ON m.id = s.menu_item_id 
    WHERE m.id = $1
  `, [id]);

  return result.rows[0];
};

/**
 * Fetch all kitchen usage logs
 */
const getKitchenUsageLog = async () => {
  const result = await pool.query("SELECT * FROM kitchen_usage_log ORDER BY created_at DESC, id DESC");
  return result.rows;
};

/**
 * Record a kitchen usage entry (deducts stock from menu_items or raw ingredients)
 */
const createKitchenUsageEntry = async (food_name, quantity, reason) => {
  // Insert log
  const result = await pool.query(
    "INSERT INTO kitchen_usage_log (food_name, quantity, reason) VALUES ($1, $2, $3) RETURNING *",
    [food_name, quantity, reason]
  );

  // Check if it's a raw ingredient in kitchen_purchase_requirements
  const reqRes = await pool.query("SELECT id FROM kitchen_purchase_requirements WHERE name = $1", [food_name]);
  if (reqRes.rows.length > 0) {
    await pool.query(
      "UPDATE kitchen_purchase_requirements SET current_stock = GREATEST(0, current_stock - $1), updated_at = CURRENT_TIMESTAMP WHERE name = $2",
      [quantity, food_name]
    );
  } else {
    // Original menu items logic fallback
    const itemRes = await pool.query("SELECT id FROM menu_items WHERE name = $1", [food_name]);
    if (itemRes.rows.length > 0) {
      const itemId = itemRes.rows[0].id;
      // Decrement stock in catering_stock_levels
      await pool.query(`
        INSERT INTO catering_stock_levels (menu_item_id, stock)
        VALUES ($1, GREATEST(0, 100 - $2))
        ON CONFLICT (menu_item_id)
        DO UPDATE SET stock = GREATEST(0, catering_stock_levels.stock - $2)
      `, [itemId, quantity]);
    }
  }

  return result.rows[0];
};

/**
 * Fetch all kitchen purchase logs (stock additions)
 */
const getKitchenPurchaseLog = async () => {
  const result = await pool.query("SELECT * FROM kitchen_purchase_log ORDER BY created_at DESC, id DESC");
  return result.rows;
};

/**
 * Add portions to catering stock and log as a purchase transaction
 */
const addKitchenStockAndLogPurchase = async (menu_item_id, portions_added, amount) => {
  // Check if it matches a requirement item (raw material)
  const reqRes = await pool.query("SELECT * FROM kitchen_purchase_requirements WHERE id = $1", [menu_item_id]);
  if (reqRes.rows.length > 0) {
    const reqItem = reqRes.rows[0];
    
    // Insert purchase log
    const logResult = await pool.query(
      "INSERT INTO kitchen_purchase_log (food_name, portions_added, amount) VALUES ($1, $2, $3) RETURNING *",
      [reqItem.name, portions_added, amount]
    );

    // Increment current_stock in kitchen_purchase_requirements
    const updatedReq = await pool.query(
      "UPDATE kitchen_purchase_requirements SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [portions_added, menu_item_id]
    );

    return { log: logResult.rows[0], item: { ...updatedReq.rows[0], stock: parseFloat(updatedReq.rows[0].current_stock) } };
  }

  // Fetch food item to get its name
  const itemRes = await pool.query("SELECT * FROM menu_items WHERE id = $1", [menu_item_id]);
  if (itemRes.rows.length === 0) return null;
  const item = itemRes.rows[0];

  // Insert purchase log
  const logResult = await pool.query(
    "INSERT INTO kitchen_purchase_log (food_name, portions_added, amount) VALUES ($1, $2, $3) RETURNING *",
    [item.name, portions_added, amount]
  );

  // Increment stock in catering_stock_levels
  await pool.query(`
    INSERT INTO catering_stock_levels (menu_item_id, stock)
    VALUES ($1, 100 + $2)
    ON CONFLICT (menu_item_id)
    DO UPDATE SET stock = catering_stock_levels.stock + $2
  `, [menu_item_id, portions_added]);

  // Fetch updated item details
  const updatedItemRes = await pool.query(`
    SELECT m.*, COALESCE(s.stock, 100) AS stock 
    FROM menu_items m 
    LEFT JOIN catering_stock_levels s ON m.id = s.menu_item_id 
    WHERE m.id = $1
  `, [menu_item_id]);

  return { log: logResult.rows[0], item: updatedItemRes.rows[0] };
};

/**
 * Delete a purchase log entry and adjust stock accordingly
 */
const deleteKitchenPurchaseLog = async (id) => {
  const existingRes = await pool.query("SELECT * FROM kitchen_purchase_log WHERE id = $1", [id]);
  if (existingRes.rows.length === 0) return null;
  const existingLog = existingRes.rows[0];

  await pool.query("DELETE FROM kitchen_purchase_log WHERE id = $1", [id]);

  // Adjust stock in kitchen_purchase_requirements
  await pool.query(
    "UPDATE kitchen_purchase_requirements SET current_stock = GREATEST(0, current_stock - $1), updated_at = CURRENT_TIMESTAMP WHERE LOWER(name) = LOWER($2)",
    [existingLog.portions_added, existingLog.food_name]
  );

  return existingLog;
};

/**
 * Delete a usage log entry and adjust stock accordingly
 */
const deleteKitchenUsageLog = async (id) => {
  const existingRes = await pool.query("SELECT * FROM kitchen_usage_log WHERE id = $1", [id]);
  if (existingRes.rows.length === 0) return null;
  const existingLog = existingRes.rows[0];

  await pool.query("DELETE FROM kitchen_usage_log WHERE id = $1", [id]);

  // Adjust stock in kitchen_purchase_requirements (restore the deducted quantity)
  await pool.query(
    "UPDATE kitchen_purchase_requirements SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(name) = LOWER($2)",
    [existingLog.quantity, existingLog.food_name]
  );

  return existingLog;
};


/**
 * Update a purchase log entry and rebalance stock
 */
const updateKitchenPurchaseLog = async (id, food_name, portions_added, amount) => {
  const existingRes = await pool.query("SELECT * FROM kitchen_purchase_log WHERE id = $1", [id]);
  if (existingRes.rows.length === 0) return null;
  const existingLog = existingRes.rows[0];

  const oldPortions = existingLog.portions_added;
  const oldFoodName = existingLog.food_name;

  const newPortions = parseInt(portions_added);
  const newAmount = parseInt(amount);
  const newFoodName = food_name.trim();

  const updatedRes = await pool.query(
    "UPDATE kitchen_purchase_log SET food_name = $1, portions_added = $2, amount = $3 WHERE id = $4 RETURNING *",
    [newFoodName, newPortions, newAmount, id]
  );

  if (oldFoodName.toLowerCase() === newFoodName.toLowerCase()) {
    const diff = newPortions - oldPortions;
    if (diff !== 0) {
      await pool.query(
        "UPDATE kitchen_purchase_requirements SET current_stock = GREATEST(0, current_stock + $1), updated_at = CURRENT_TIMESTAMP WHERE LOWER(name) = LOWER($2)",
        [diff, newFoodName]
      );
    }
  } else {
    await pool.query(
      "UPDATE kitchen_purchase_requirements SET current_stock = GREATEST(0, current_stock - $1), updated_at = CURRENT_TIMESTAMP WHERE LOWER(name) = LOWER($2)",
      [oldPortions, oldFoodName]
    );
    await pool.query(
      "UPDATE kitchen_purchase_requirements SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(name) = LOWER($2)",
      [newPortions, newFoodName]
    );
  }

  return updatedRes.rows[0];
};

module.exports = {
  getAllMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateMenuItemStock,
  getKitchenUsageLog,
  createKitchenUsageEntry,
  getKitchenPurchaseLog,
  addKitchenStockAndLogPurchase,
  deleteKitchenPurchaseLog,
  updateKitchenPurchaseLog,
  deleteKitchenUsageLog
};
