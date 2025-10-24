import express from 'express';
import {
  getPlatforms,
  getPlatformById,
  createPlatform,
  updatePlatform,
  deletePlatform,
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByPlatform,
} from '../../controllers/platformsServices.controller.js';
import { validatePlatformInput, validateServiceInput } from '../../validators/platformsServices.validator.js';

const router = express.Router();

// Platform routes
router.get('/platforms', getPlatforms);
router.get('/platforms/:id', getPlatformById);
router.post('/platforms', validatePlatformInput, createPlatform);
router.put('/platforms/:id', validatePlatformInput, updatePlatform);
router.delete('/platforms/:id', deletePlatform);

// Service routes
router.get('/services', getServices);
router.get('/services/:id', getServiceById);
router.post('/services', validateServiceInput, createService);
router.put('/services/:id', validateServiceInput, updateService);
router.delete('/services/:id', deleteService);

// Get services by platform
router.get('/platforms/:platformId/services', getServicesByPlatform);

export default router;
