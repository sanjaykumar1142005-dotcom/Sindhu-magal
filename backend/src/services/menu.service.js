const { pool } = require("../config/database");

/**
 * Fetch all menu items ordered by category and name
 */
const getAllMenuItems = async () => {
  const result = await pool.query("SELECT * FROM menu_items ORDER BY category, name");
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

module.exports = {
  getAllMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
};
