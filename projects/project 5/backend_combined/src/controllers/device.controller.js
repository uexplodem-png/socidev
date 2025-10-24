import { DeviceService } from "../services/device.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";

const deviceService = new DeviceService();

export class DeviceController {
  // Register new device
  registerDevice = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { name, type } = req.body;

    const device = await deviceService.registerDevice(userId, {
      name,
      type,
    });

    res.status(201).json(device);
  });

  // Get user's devices
  getDevices = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;

    const devices = await deviceService.getDevices(userId, { status });
    res.json(devices);
  });

  // Update device settings
  updateDeviceSettings = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const deviceId = req.params.id;
    const { settings } = req.body;

    const device = await deviceService.updateDeviceSettings(
      userId,
      deviceId,
      settings
    );
    res.json(device);
  });

  // Update device status
  updateDeviceStatus = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const deviceId = req.params.id;
    const { status } = req.body;

    const device = await deviceService.updateDeviceStatus(
      userId,
      deviceId,
      status
    );
    res.json(device);
  });

  // Delete device
  deleteDevice = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const deviceId = req.params.id;

    await deviceService.deleteDevice(userId, deviceId);
    res.status(204).send();
  });

  // Get device stats
  getDeviceStats = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const deviceId = req.params.id;

    const stats = await deviceService.getDeviceStats(userId, deviceId);
    res.json(stats);
  });
}
