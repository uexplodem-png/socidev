import { body } from "express-validator";
import { validateRequest } from "../middleware/validate-request.js";

export const validateTaskCompletion = [
  body("proof").isObject().withMessage("Proof must be an object"),

  validateRequest,
];
