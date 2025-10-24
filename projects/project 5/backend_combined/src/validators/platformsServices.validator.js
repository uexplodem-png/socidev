export const validatePlatformInput = (req, res, next) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Platform name is required and must be a non-empty string',
    });
  }

  next();
};

export const validateServiceInput = (req, res, next) => {
  const {
    platformId,
    name,
    pricePerUnit,
    minOrder,
    maxOrder,
    inputFieldName,
  } = req.body;

  if (!platformId) {
    return res.status(400).json({
      success: false,
      message: 'Platform ID is required',
    });
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Service name is required and must be a non-empty string',
    });
  }

  if (pricePerUnit === undefined || isNaN(parseFloat(pricePerUnit))) {
    return res.status(400).json({
      success: false,
      message: 'Price per unit is required and must be a valid number',
    });
  }

  if (minOrder === undefined || isNaN(parseInt(minOrder))) {
    return res.status(400).json({
      success: false,
      message: 'Min order is required and must be a valid number',
    });
  }

  if (maxOrder === undefined || isNaN(parseInt(maxOrder))) {
    return res.status(400).json({
      success: false,
      message: 'Max order is required and must be a valid number',
    });
  }

  if (parseInt(minOrder) > parseInt(maxOrder)) {
    return res.status(400).json({
      success: false,
      message: 'Min order must be less than or equal to max order',
    });
  }

  if (!inputFieldName || typeof inputFieldName !== 'string' || inputFieldName.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Input field name is required and must be a non-empty string',
    });
  }

  next();
};
