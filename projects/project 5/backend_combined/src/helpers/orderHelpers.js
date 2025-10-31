/**
 * Order Helper Functions
 * Part 2: Order Validation & Business Logic
 */

/**
 * Calculate order progress with accurate percentage
 * Fixes the progress bar bug (0/1000% issue)
 * 
 * @param {Object} order - Order object with completed_count and quantity
 * @returns {Object} Progress information
 */
export const calculateOrderProgress = (order) => {
  const completed = order.completedCount || order.completed_count || 0;
  const total = order.quantity || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    completed,
    total,
    percentage: Math.min(percentage, 100),
    remaining: Math.max(total - completed, 0)
  };
};

/**
 * Check if user already has an active order for the same platform+service+URL
 * Prevents duplicate orders
 * 
 * @param {Object} Order - Sequelize Order model
 * @param {string} userId - User ID
 * @param {string} platform - Social media platform
 * @param {string} service - Service name
 * @param {string} targetUrl - Target URL
 * @returns {Object|null} Existing order or null
 */
export const checkDuplicateOrder = async (Order, userId, platform, service, targetUrl) => {
  const existingOrder = await Order.findOne({
    attributes: ['id', 'status', 'createdAt'],
    where: {
      userId,
      platform,
      service,
      targetUrl,
      status: ['pending', 'processing']
    },
    raw: true
  });

  return existingOrder;
};

/**
 * Calculate refund amount based on completed tasks
 * 
 * @param {Object} order - Order object
 * @returns {Object} Refund calculation
 */
export const calculateRefundAmount = (order) => {
  const totalAmount = parseFloat(order.amount);
  const quantity = order.quantity || 0;
  const completedCount = order.completedCount || order.completed_count || 0;
  
  // Calculate unit price
  const unitPrice = order.unitPrice || order.unit_price || (totalAmount / quantity);
  
  // If no tasks completed, refund full amount
  if (completedCount === 0) {
    return {
      refundAmount: totalAmount,
      completedCount: 0,
      totalQuantity: quantity,
      unitPrice,
      isFullRefund: true
    };
  }
  
  // Calculate partial refund
  const remainingQuantity = quantity - completedCount;
  const refundAmount = unitPrice * remainingQuantity;
  
  return {
    refundAmount: Math.max(refundAmount, 0),
    completedCount,
    totalQuantity: quantity,
    remainingQuantity,
    unitPrice,
    isFullRefund: false
  };
};

/**
 * Validate order creation data
 * 
 * @param {Object} orderData - Order data to validate
 * @returns {Object} Validation result
 */
export const validateOrderData = (orderData) => {
  const errors = [];

  if (!orderData.platform) {
    errors.push('Platform is required');
  }

  if (!orderData.service) {
    errors.push('Service is required');
  }

  if (!orderData.targetUrl) {
    errors.push('Target URL is required');
  }

  if (!orderData.quantity || orderData.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }

  if (orderData.quantity > 100000) {
    errors.push('Quantity cannot exceed 100,000');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Format order for API response (hide sensitive internal data)
 * 
 * @param {Object} order - Order object
 * @param {boolean} isAdmin - Whether requester is admin
 * @returns {Object} Formatted order
 */
export const formatOrderForResponse = (order, isAdmin = false) => {
  const progress = calculateOrderProgress(order);
  
  const formatted = {
    // Use short reference ID for users, full ID for admins
    orderRef: order.id.substring(0, 8).toUpperCase(),
    platform: order.platform,
    service: order.service,
    targetUrl: order.targetUrl,
    quantity: order.quantity,
    amount: order.amount,
    status: order.status,
    progress,
    speed: order.speed,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    completedAt: order.completedAt
  };

  // Only include full ID and internal fields for admins
  if (isAdmin) {
    formatted.id = order.id;
    formatted.userId = order.userId;
    formatted.unitPrice = order.unitPrice || order.unit_price;
    formatted.priority = order.priority;
    formatted.refundAmount = order.refundAmount || order.refund_amount;
    formatted.lastStatusChange = order.lastStatusChange || order.last_status_change;
  }

  return formatted;
};
