const express = require("express");
const cors = require("cors");
const routes = require("./routes/index.routes");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

// Standard middleware stack
app.use(express.json());
app.use(cors());

// Root test endpoint
app.get("/", (req, res) => {
  res.send("Backend working ✅");
});

// Main router registration
app.use("/", routes);

// Centralized global error handling middleware
app.use(errorMiddleware);

module.exports = app;
