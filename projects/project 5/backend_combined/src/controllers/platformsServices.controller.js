import { Platform, Service, AuditLog } from '../models/index.js';
import { Op } from 'sequelize';

// Platforms CRUD Operations
export const getPlatforms = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    let where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Platform.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [[sortBy, sortOrder]],
    });

    res.json({
      platforms: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPlatformById = async (req, res) => {
  try {
    const { id } = req.params;
    const platform = await Platform.findByPk(id, {
      include: [
        {
          model: Service,
          as: 'services',
        },
      ],
    });

    if (!platform) {
      return res.status(404).json({ success: false, message: 'Platform not found' });
    }

    res.json(platform);
  } catch (error) {
    console.error('Error fetching platform:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPlatform = async (req, res) => {
  try {
    const { name, description, icon } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Platform name is required' });
    }

    const platform = await Platform.create({
      name,
      description,
      icon,
    });

    // Log the action
    await AuditLog.create({
      actorId: req.user.id,
      action: 'CREATE',
      resource: 'Platform',
      description: `Created platform: ${name}`,
      metadata: { platformId: platform.id, platformName: name },
    });

    res.status(201).json({
      success: true,
      message: 'Platform created successfully',
      platform,
    });
  } catch (error) {
    console.error('Error creating platform:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePlatform = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;

    const platform = await Platform.findByPk(id);
    if (!platform) {
      return res.status(404).json({ success: false, message: 'Platform not found' });
    }

    await platform.update({
      name: name || platform.name,
      description: description !== undefined ? description : platform.description,
      icon: icon !== undefined ? icon : platform.icon,
      isActive: isActive !== undefined ? isActive : platform.isActive,
    });

    // Log the action
    await AuditLog.create({
      actorId: req.user.id,
      action: 'UPDATE',
      resource: 'Platform',
      description: `Updated platform: ${platform.name}`,
      metadata: { platformId: id, changes: { name, description, icon, isActive } },
    });

    res.json({
      success: true,
      message: 'Platform updated successfully',
      platform,
    });
  } catch (error) {
    console.error('Error updating platform:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePlatform = async (req, res) => {
  try {
    const { id } = req.params;

    const platform = await Platform.findByPk(id);
    if (!platform) {
      return res.status(404).json({ success: false, message: 'Platform not found' });
    }

    const platformName = platform.name;
    await platform.destroy();

    // Log the action
    await AuditLog.create({
      actorId: req.user.id,
      action: 'DELETE',
      resource: 'Platform',
      description: `Deleted platform: ${platformName}`,
      metadata: { platformId: id, platformName },
    });

    res.json({
      success: true,
      message: 'Platform deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting platform:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Services CRUD Operations
export const getServices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      platformId,
      search,
      isActive,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    let where = {};
    if (platformId) {
      where.platformId = platformId;
    }
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const offset = (page - 1) * limit;
    
    // Define valid columns for Service model
    const validSortColumns = ['name', 'pricePerUnit', 'minOrder', 'maxOrder', 'commissionRate', 'createdAt', 'updatedAt'];
    const orderBy = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    
    const { count, rows } = await Service.findAndCountAll({
      where,
      attributes: ['id', 'platformId', 'name', 'description', 'pricePerUnit', 'minOrder', 'maxOrder', 'inputFieldName', 'sampleUrl', 'features', 'commissionRate', 'isActive', 'displayOrder', 'createdAt', 'updatedAt'],
      include: [
        {
          model: Platform,
          as: 'platform',
          attributes: ['id', 'name', 'icon'],
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [[orderBy, sortOrder]],
      subQuery: false,
    });

    res.json({
      services: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByPk(id, {
      include: [
        {
          model: Platform,
          as: 'platform',
        },
      ],
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const {
      platformId,
      name,
      description,
      pricePerUnit,
      minOrder,
      maxOrder,
      inputFieldName,
      sampleUrl,
      features,
      commissionRate,
    } = req.body;

    if (!platformId || !name || !pricePerUnit || !minOrder || !maxOrder || !inputFieldName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: platformId, name, pricePerUnit, minOrder, maxOrder, inputFieldName',
      });
    }

    // Verify platform exists
    const platform = await Platform.findByPk(platformId);
    if (!platform) {
      return res.status(404).json({ success: false, message: 'Platform not found' });
    }

    const service = await Service.create({
      platformId,
      name,
      description,
      pricePerUnit,
      minOrder,
      maxOrder,
      inputFieldName,
      sampleUrl,
      features: features || [],
      commissionRate: commissionRate || 0,
    });

    // Log the action
    await AuditLog.create({
      actorId: req.user.id,
      action: 'CREATE',
      resource: 'Service',
      description: `Created service: ${name} for platform: ${platform.name}`,
      metadata: { serviceId: service.id, serviceName: name, platformId },
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service,
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      pricePerUnit,
      minOrder,
      maxOrder,
      inputFieldName,
      sampleUrl,
      features,
      commissionRate,
      isActive,
    } = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await service.update({
      name: name || service.name,
      description: description !== undefined ? description : service.description,
      pricePerUnit: pricePerUnit !== undefined ? pricePerUnit : service.pricePerUnit,
      minOrder: minOrder !== undefined ? minOrder : service.minOrder,
      maxOrder: maxOrder !== undefined ? maxOrder : service.maxOrder,
      inputFieldName: inputFieldName || service.inputFieldName,
      sampleUrl: sampleUrl !== undefined ? sampleUrl : service.sampleUrl,
      features: features !== undefined ? features : service.features,
      commissionRate: commissionRate !== undefined ? commissionRate : service.commissionRate,
      isActive: isActive !== undefined ? isActive : service.isActive,
    });

    // Log the action
    await AuditLog.create({
      actorId: req.user.id,
      action: 'UPDATE',
      resource: 'Service',
      description: `Updated service: ${service.name}`,
      metadata: {
        serviceId: id,
        changes: {
          name,
          description,
          pricePerUnit,
          minOrder,
          maxOrder,
          inputFieldName,
          sampleUrl,
          features,
          commissionRate,
          isActive,
        },
      },
    });

    res.json({
      success: true,
      message: 'Service updated successfully',
      service,
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const serviceName = service.name;
    await service.destroy();

    // Log the action
    await AuditLog.create({
      actorId: req.user.id,
      action: 'DELETE',
      resource: 'Service',
      description: `Deleted service: ${serviceName}`,
      metadata: { serviceId: id, serviceName },
    });

    res.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get services for a specific platform
export const getServicesByPlatform = async (req, res) => {
  try {
    const { platformId } = req.params;

    const platform = await Platform.findByPk(platformId, {
      include: [
        {
          model: Service,
          as: 'services',
        },
      ],
    });

    if (!platform) {
      return res.status(404).json({ success: false, message: 'Platform not found' });
    }

    res.json({
      success: true,
      platform,
      services: platform.services,
    });
  } catch (error) {
    console.error('Error fetching services by platform:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
