import express from 'express';
import { Service, Platform } from '../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// Get all platforms
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    let where = { isActive: true };
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const offset = (page - 1) * limit;
    const { count, rows } = await Platform.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
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
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get all services
router.get('/services', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;
    const { count, rows } = await Service.findAndCountAll({
      where: { isActive: true },
      offset,
      limit: parseInt(limit),
      order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']],
    });

    // Normalize services
    const normalizedServices = rows.map(service => ({
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
      services: normalizedServices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get services by platform (accepts either platform ID or platform name)
router.get('/:platformId/services', async (req, res) => {
  try {
    const { platformId } = req.params;

    // Try to find platform by ID first, then by name
    let platform = await Platform.findByPk(platformId, {
      include: [
        {
          model: Service,
          as: 'services',
          where: { isActive: true },
          order: [['displayOrder', 'ASC']],
        },
      ],
    });

    // If not found by ID, try by name
    if (!platform) {
      platform = await Platform.findOne({
        where: { name: platformId.toLowerCase() },
        include: [
          {
            model: Service,
            as: 'services',
            where: { isActive: true },
            order: [['displayOrder', 'ASC']],
          },
        ],
      });
    }

    if (!platform) {
      return res.status(404).json({ error: 'Platform not found', code: 'PLATFORM_NOT_FOUND' });
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
    })).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    res.json({
      platform,
      services: normalizedServices,
    });
  } catch (error) {
    console.error('Error fetching services by platform:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export { router as platformsRouter };

