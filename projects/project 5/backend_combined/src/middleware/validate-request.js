import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
      value: error.value,
    }));
    const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join("; ");
    throw new ApiError(400, "Validation Error: " + errorMessage, validationErrors);
  }
  next();
};

