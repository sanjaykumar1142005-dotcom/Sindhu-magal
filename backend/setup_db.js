require('dotenv').config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "postgres",
  password: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : "postgres",
  port: process.env.DB_PORT || 5432
});

async function setup() {
  try {
    console.log("Setting up database...");

    // 1. Create users table if it doesn't exist, and add role column
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user'
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
    `);
    console.log("✅ Users table and role column verified.");

    // 2. Create menu_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price INTEGER NOT NULL,
        category VARCHAR(20) NOT NULL -- 'breakfast', 'lunch', 'dinner'
      );
    `);
    console.log("✅ menu_items table created.");

    // 3. Seed menu items if empty
    const checkMenu = await pool.query("SELECT COUNT(*) FROM menu_items");
    if (parseInt(checkMenu.rows[0].count) === 0) {
      console.log("Seeding menu items...");
      const items = [
        // Breakfast
        ['கேசரி', 40, 'breakfast'], ['மெது வடை', 10, 'breakfast'], ['இட்லி', 40, 'breakfast'],
        ['மினி வெஜிடபிள் ஊத்தப்பம்', 50, 'breakfast'], ['நெய் பொங்கல்', 60, 'breakfast'],
        ['பூரி', 40, 'breakfast'], ['Tea/Coffee', 15, 'breakfast'], ['Payasam', 40, 'breakfast'],
        // Lunch
        ['Meals', 120, 'lunch'], ['Sweet', 20, 'lunch'], ['Chicken Biryani', 180, 'lunch'], ['Fry', 90, 'lunch'],
        // Dinner
        ['Sweet', 20, 'dinner'], ['Uthappam', 50, 'dinner'], ['Biryani', 100, 'dinner'], ['Naan', 60, 'dinner'],
        ['Roti', 60, 'dinner'], ['65', 80, 'dinner'], ['Masala', 100, 'dinner'], ['Fry', 100, 'dinner']
      ];

      for (const [name, price, category] of items) {
        await pool.query("INSERT INTO menu_items (name, price, category) VALUES ($1, $2, $3)", [name, price, category]);
      }
      console.log("✅ Menu items seeded.");
    }

    // 4. Update a user to be admin for testing (optional but helpful)
    // You might want to update a specific user via email
    // await pool.query("UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'");

    console.log("Database setup complete! 🚀");
    process.exit(0);
  } catch (err) {
    console.error("❌ Setup failed:", err);
    process.exit(1);
  }
}

setup();
