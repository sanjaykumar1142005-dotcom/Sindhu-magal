const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = 5000;

// ✅ Middleware
app.use(express.json());
app.use(cors());

// 🔗 PostgreSQL Connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "authdb",
  password: "1234",
  port: 5432
});

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend working ✅");
});

// 📝 SIGNUP API
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    // Check if user already exists
    const checkUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Insert new user (default role: user)
    await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1, $2, $3)",
      [email, password, 'user']
    );

    res.json({ success: true, message: "User created successfully! 🎉" });

  } catch (error) {
    console.error("🔥 Signup Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🔐 LOGIN API
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("📥    Login request:", email, password);

    // 1. Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password required"
      });
    }

    // 2. DB Query
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    // ❌ User not found
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    const user = result.rows[0];

    // ❌ Password mismatch
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid password"
      });
    }

    // ✅ Success
    return res.json({
      success: true,
      message: "Login successful 🎉",
      token: "abc123",
      role: user.role,
      user: {
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("🔥 Server Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// 🍽 MENU APIs
app.get("/menu", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM menu_items ORDER BY category, name");

    // Group by category for easier use in frontend if needed, 
    // or just return all and let frontend handle it.
    // Let's return raw data for flexibility.
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error("🔥 Menu Fetch Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🛠 ADMIN: UPDATE/ADD MENU ITEM
app.post("/admin/menu", async (req, res) => {
  try {
    const { id, name, price, category } = req.body;
    // Simple check (in production use real JWT auth)
    const token = req.headers.authorization;
    if (token !== "abc123") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (id) {
      // Update
      await pool.query(
        "UPDATE menu_items SET name = $1, price = $2, category = $3 WHERE id = $4",
        [name, price, category, id]
      );
      res.json({ success: true, message: "Item updated ✅" });
    } else {
      // Add
      await pool.query(
        "INSERT INTO menu_items (name, price, category) VALUES ($1, $2, $3)",
        [name, price, category]
      );
      res.json({ success: true, message: "Item added ✅" });
    }
  } catch (error) {
    console.error("🔥 Admin Menu Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🛠 ADMIN: DELETE MENU ITEM
app.delete("/admin/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization;
    if (token !== "abc123") {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await pool.query("DELETE FROM menu_items WHERE id = $1", [id]);
    res.json({ success: true, message: "Item deleted 🗑️" });
  } catch (error) {
    console.error("🔥 Admin Delete Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});