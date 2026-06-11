const { pool } = require("../config/database");

/**
 * Find user by email
 * @param {String} email 
 * @returns {Promise<Object|null>} user object or null
 */
const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  return result.rows.length > 0 ? result.rows[0] : null;
};

/**
 * Register a new user
 * @param {String} email 
 * @param {String} password 
 * @returns {Promise<Object>} the newly created user record
 */
const createUser = async (email, password) => {
  const result = await pool.query(
    "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
    [email, password, 'user']
  );
  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  createUser
};
