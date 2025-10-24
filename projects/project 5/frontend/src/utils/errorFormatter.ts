// Error message mappings for user-friendly error display
const errorMessages: Record<string, string> = {
    // Validation errors
    VALIDATION_ERROR: "Please check your input and try again",
    USER_NOT_FOUND: "User not found",
    INVALID_CREDENTIALS: "Invalid email or password",
    USER_ALREADY_EXISTS: "User with this email or username already exists",
    TOKEN_MISSING: "Authentication token is missing",
    TOKEN_INVALID: "Invalid authentication token",
    TOKEN_EXPIRED: "Your session has expired, please login again",
    TOKEN_INVALID_FORMAT: "Invalid token format",
    ACCOUNT_INACTIVE: "Your account is not active",
    AUTH_REQUIRED: "Authentication is required",
    INSUFFICIENT_PERMISSIONS: "You don't have permission to perform this action",

    // Order/Task errors
    ORDER_NOT_FOUND: "Order not found",
    TASK_NOT_FOUND: "Task not found",
    INSUFFICIENT_BALANCE: "Insufficient balance to complete this action",
    INVALID_STATUS: "Invalid status transition",

    // Server errors
    INTERNAL_SERVER_ERROR: "Something went wrong on the server",
    SERVICE_UNAVAILABLE: "Service is temporarily unavailable",
};

/**
 * Clean up and humanize validation error messages
 */
const cleanValidationMessage = (message: string, field: string): string => {
    // Remove Joi error prefixes and quotes
    let cleaned = message
        .replace(/^".*?"\s+/, "")  // Remove quoted field names at start
        .replace(/["']/g, "")      // Remove all quotes
        .replace(/must be/, "must be")
        .trim();

    // Map common validation errors to friendly messages
    const patterns: [RegExp, string][] = [
        [/length must be at least (\d+)/, `must be at least $1 characters`],
        [/is required/, "is required"],
        [/must contain at least one lowercase letter/, "needs at least one lowercase letter (a-z)"],
        [/must contain at least one uppercase letter/, "needs at least one uppercase letter (A-Z)"],
        [/must contain.*number/, "needs at least one number (0-9)"],
        [/must only contain letters.*underscores.*hyphens/, "can only contain letters, numbers, underscores, and hyphens"],
        [/format is invalid/, "format is invalid"],
    ];

    for (const [pattern, replacement] of patterns) {
        if (pattern.test(cleaned)) {
            cleaned = cleaned.replace(pattern, replacement);
            break;
        }
    }

    // Capitalize field name for display
    const fieldDisplay = field
        .replace(/([A-Z])/g, " $1")  // Add space before capitals
        .replace(/^./, (str) => str.toUpperCase())  // Capitalize first letter
        .trim();

    return `${fieldDisplay} ${cleaned}`;
};

/**
 * Format error response into user-friendly message
 * @param error - The error object or string
 * @returns User-friendly error message
 */
export const formatErrorMessage = (error: any): string => {
    // If it's a simple string
    if (typeof error === "string") {
        return error;
    }

    // If it's an Error object with a message
    if (error instanceof Error) {
        try {
            const parsed = JSON.parse(error.message);
            return formatErrorMessage(parsed);
        } catch {
            return error.message;
        }
    }

    // If it's a validation error with details array
    if (error?.code === "VALIDATION_ERROR" && error?.details?.length > 0) {
        const fieldErrors = error.details
            .map((detail: any) => {
                const field = detail.field || "Field";
                const message = detail.message || "Invalid input";
                return cleanValidationMessage(message, field);
            });

        // Return formatted error messages
        if (fieldErrors.length === 1) {
            return fieldErrors[0];
        }

        return fieldErrors.join("\n");
    }

    // If it has an error code we can map
    if (error?.code && errorMessages[error.code]) {
        return errorMessages[error.code];
    }

    // If it has an error message
    if (error?.message) {
        // Check if message contains a code we can map
        const codeMatch = error.message.match(/code['":\s]+["']?([A-Z_]+)/i);
        if (codeMatch && errorMessages[codeMatch[1]]) {
            return errorMessages[codeMatch[1]];
        }
        return error.message;
    }

    // If it has just an error field
    if (error?.error) {
        return error.error;
    }

    // Default fallback
    return "An unexpected error occurred. Please try again.";
};

/**
 * Extract validation field errors from error response
 * @param error - The error object
 * @returns Object with field names as keys and error messages as values
 */
export const getFieldErrors = (
    error: any
): Record<string, string> => {
    const fieldErrors: Record<string, string> = {};

    if (error?.code === "VALIDATION_ERROR" && error?.details?.length > 0) {
        error.details.forEach((detail: any) => {
            const field = detail.field || "Field";
            fieldErrors[field] = cleanValidationMessage(detail.message, field);
        });
    }

    return fieldErrors;
};
