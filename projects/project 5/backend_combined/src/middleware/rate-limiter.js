import { RateLimiterMemory } from "rate-limiter-flexible";
import { ApiError } from "../utils/ApiError.js";

export const rateLimiter = ({ windowMs, max }) => {
  const limiter = new RateLimiterMemory({
    points: max,
    duration: windowMs / 10000,
  });

  return async (req, res, next) => {
    try {
      const userId = req.user?.id || req.ip;
      await limiter.consume(userId);
      next();
    } catch (error) {
      next(new ApiError(429, "Too many requests, please try again later"));
    }
  };
};
