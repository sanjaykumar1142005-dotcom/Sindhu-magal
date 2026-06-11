const authService = require("../services/auth.service");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Handle user registration
 */
const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, "Email and password required", null, 400);
    }

    // Check if user already exists
    const existingUser = await authService.findUserByEmail(email);
    if (existingUser) {
      return errorResponse(res, "User already exists", null, 400);
    }

    // Insert new user
    await authService.createUser(email, password);

    return successResponse(res, "User created successfully!");

  } catch (error) {
    next(error);
  }
};

/**
 * Handle user login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log("Login request:", email, password);

    if (!email || !password) {
      return errorResponse(res, "Email and Password required", null, 400);
    }

    const user = await authService.findUserByEmail(email);
    if (!user) {
      return errorResponse(res, "User not found", null, 401);
    }

    if (password !== user.password) {
      return errorResponse(res, "Invalid password", null, 401);
    }

    return successResponse(res, "Login successful 🎉", {
      token: process.env.ADMIN_TOKEN || "abc123",
      role: user.role,
      user: {
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login
};
