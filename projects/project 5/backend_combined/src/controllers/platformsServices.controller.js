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
    const { name, nameEn, nameTr, description, descriptionEn, descriptionTr, icon, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Platform name is required' });
    }

    const platform = await Platform.create({
      name,
      nameEn: nameEn || null,
      nameTr: nameTr || null,
      description,
      descriptionEn: descriptionEn || null,
      descriptionTr: descriptionTr || null,
      icon,
      isActive: isActive !== undefined ? isActive : true,
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
    const { name, nameEn, nameTr, description, descriptionEn, descriptionTr, icon, isActive } = req.body;

    const platform = await Platform.findByPk(id);
    if (!platform) {
      return res.status(404).json({ success: false, message: 'Platform not found' });
    }

    await platform.update({
      name: name || platform.name,
      nameEn: nameEn !== undefined ? nameEn : platform.nameEn,
      nameTr: nameTr !== undefined ? nameTr : platform.nameTr,
      description: description !== undefined ? description : platform.description,
      descriptionEn: descriptionEn !== undefined ? descriptionEn : platform.descriptionEn,
      descriptionTr: descriptionTr !== undefined ? descriptionTr : platform.descriptionTr,
      icon: icon !== undefined ? icon : platform.icon,
      isActive: isActive !== undefined ? isActive : platform.isActive,
    });

    // Log the action
    await AuditLog.create({
      actorId: req.user.id,
      action: 'UPDATE',
      resource: 'Platform',
      description: `Updated platform: ${platform.name}`,
      metadata: { platformId: id, changes: { name, nameEn, nameTr, description, descriptionEn, descriptionTr, icon, isActive } },
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
      attributes: ['id', 'platformId', 'name', 'nameEn', 'nameTr', 'description', 'descriptionEn', 'descriptionTr', 'pricePerUnit', 'minOrder', 'maxOrder', 'inputFieldName', 'sampleUrl', 'features', 'featuresEn', 'featuresTr', 'urlPattern', 'commissionRate', 'isActive', 'displayOrder', 'createdAt', 'updatedAt'],
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

    // Parse JSON fields and numeric strings
    const normalizedRows = rows.map(service => {
      const serviceData = service.toJSON();
      return {
        ...serviceData,
        features: typeof serviceData.features === 'string' ? JSON.parse(serviceData.features) : (serviceData.features || []),
        featuresEn: typeof serviceData.featuresEn === 'string' ? JSON.parse(serviceData.featuresEn) : (serviceData.featuresEn || []),
        featuresTr: typeof serviceData.featuresTr === 'string' ? JSON.parse(serviceData.featuresTr) : (serviceData.featuresTr || []),
        pricePerUnit: parseFloat(serviceData.pricePerUnit),
        commissionRate: parseFloat(serviceData.commissionRate),
        minOrder: parseInt(serviceData.minOrder),
        maxOrder: parseInt(serviceData.maxOrder),
      };
    });

    res.json({
      services: normalizedRows,
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

    // Normalize the response
    const normalizedService = {
      ...service.toJSON(),
      features: typeof service.features === 'string' ? JSON.parse(service.features) : (service.features || []),
      featuresEn: typeof service.featuresEn === 'string' ? JSON.parse(service.featuresEn) : (service.featuresEn || []),
      featuresTr: typeof service.featuresTr === 'string' ? JSON.parse(service.featuresTr) : (service.featuresTr || []),
      pricePerUnit: parseFloat(service.pricePerUnit),
      commissionRate: parseFloat(service.commissionRate),
      minOrder: parseInt(service.minOrder),
      maxOrder: parseInt(service.maxOrder),
    };

    res.json(normalizedService);
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
      nameEn,
      nameTr,
      description,
      descriptionEn,
      descriptionTr,
      pricePerUnit,
      minOrder,
      maxOrder,
      inputFieldName,
      sampleUrl,
      features,
      featuresEn,
      featuresTr,
      urlPattern,
      commissionRate,
      isActive,
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
      nameEn: nameEn || null,
      nameTr: nameTr || null,
      description,
      descriptionEn: descriptionEn || null,
      descriptionTr: descriptionTr || null,
      pricePerUnit,
      minOrder,
      maxOrder,
      inputFieldName,
      sampleUrl,
      features: features || [],
      featuresEn: featuresEn || [],
      featuresTr: featuresTr || [],
      urlPattern: urlPattern || null,
      commissionRate: commissionRate || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    // Log the action
    await AuditLog.create({
      actorId: req.user.id,
      action: 'CREATE',
      resource: 'Service',
      description: `Created service: ${name} for platform: ${platform.name}`,
      metadata: { serviceId: service.id, serviceName: name, platformId },
    });

    // Normalize response
    const normalizedService = {
      ...service.toJSON(),
      features: Array.isArray(features) ? features : [],
      featuresEn: Array.isArray(featuresEn) ? featuresEn : [],
      featuresTr: Array.isArray(featuresTr) ? featuresTr : [],
      pricePerUnit: parseFloat(pricePerUnit),
      commissionRate: parseFloat(commissionRate || 0),
      minOrder: parseInt(minOrder),
      maxOrder: parseInt(maxOrder),
    };

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service: normalizedService,
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
      nameEn,
      nameTr,
      description,
      descriptionEn,
      descriptionTr,
      pricePerUnit,
      minOrder,
      maxOrder,
      inputFieldName,
      sampleUrl,
      features,
      featuresEn,
      featuresTr,
      urlPattern,
      commissionRate,
      isActive,
    } = req.body;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await service.update({
      name: name || service.name,
      nameEn: nameEn !== undefined ? nameEn : service.nameEn,
      nameTr: nameTr !== undefined ? nameTr : service.nameTr,
      description: description !== undefined ? description : service.description,
      descriptionEn: descriptionEn !== undefined ? descriptionEn : service.descriptionEn,
      descriptionTr: descriptionTr !== undefined ? descriptionTr : service.descriptionTr,
      pricePerUnit: pricePerUnit !== undefined ? pricePerUnit : service.pricePerUnit,
      minOrder: minOrder !== undefined ? minOrder : service.minOrder,
      maxOrder: maxOrder !== undefined ? maxOrder : service.maxOrder,
      inputFieldName: inputFieldName || service.inputFieldName,
      sampleUrl: sampleUrl !== undefined ? sampleUrl : service.sampleUrl,
      features: features !== undefined ? features : service.features,
      featuresEn: featuresEn !== undefined ? featuresEn : service.featuresEn,
      featuresTr: featuresTr !== undefined ? featuresTr : service.featuresTr,
      urlPattern: urlPattern !== undefined ? urlPattern : service.urlPattern,
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
          nameEn,
          nameTr,
          description,
          descriptionEn,
          descriptionTr,
          pricePerUnit,
          minOrder,
          maxOrder,
          inputFieldName,
          sampleUrl,
          features,
          featuresEn,
          featuresTr,
          urlPattern,
          commissionRate,
          isActive,
        },
      },
    });

    // Normalize response
    const normalizedService = {
      ...service.toJSON(),
      features: typeof service.features === 'string' ? JSON.parse(service.features) : (service.features || []),
      featuresEn: typeof service.featuresEn === 'string' ? JSON.parse(service.featuresEn) : (service.featuresEn || []),
      featuresTr: typeof service.featuresTr === 'string' ? JSON.parse(service.featuresTr) : (service.featuresTr || []),
      pricePerUnit: parseFloat(service.pricePerUnit),
      commissionRate: parseFloat(service.commissionRate),
      minOrder: parseInt(service.minOrder),
      maxOrder: parseInt(service.maxOrder),
    };

    res.json({
      success: true,
      message: 'Service updated successfully',
      service: normalizedService,
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

    // Normalize services
    const normalizedServices = platform.services.map(service => ({
      ...service.toJSON(),
      features: typeof service.features === 'string' ? JSON.parse(service.features) : (service.features || []),
      featuresEn: typeof service.featuresEn === 'string' ? JSON.parse(service.featuresEn) : (service.featuresEn || []),
      featuresTr: typeof service.featuresTr === 'string' ? JSON.parse(service.featuresTr) : (service.featuresTr || []),
      pricePerUnit: parseFloat(service.pricePerUnit),
      commissionRate: parseFloat(service.commissionRate),
      minOrder: parseInt(service.minOrder),
      maxOrder: parseInt(service.maxOrder),
    }));

    res.json({
      success: true,
      platform,
      services: normalizedServices,
    });
  } catch (error) {
    console.error('Error fetching services by platform:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
