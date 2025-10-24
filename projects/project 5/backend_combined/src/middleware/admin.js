import { ApiError } from "../utils/ApiError.js";

export const admin = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    // Check if user has admin role
    if (req.user.role !== "admin") {
      throw new ApiError(403, "Forbidden: Admin access required");
    }

    next();
  } catch (error) {
    next(error);
  }
};