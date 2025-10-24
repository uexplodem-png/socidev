import { UserService } from "../services/user.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";

const userService = new UserService();

export class UserController {
  // Get profile
  getProfile = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const profile = await userService.getProfile(userId);
    res.json(profile);
  });

  // Update profile
  updateProfile = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, phone } = req.body;

    const updatedProfile = await userService.updateProfile(userId, {
      firstName,
      lastName,
      phone,
    });

    res.json(updatedProfile);
  });

  // Update password
  updatePassword = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    await userService.updatePassword(userId, currentPassword, newPassword);
    res.json({ message: "Password updated successfully" });
  });

  // Update user mode
  updateUserMode = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { userMode } = req.body;

    if (!["taskDoer", "taskGiver"].includes(userMode)) {
      throw new ApiError(400, "Invalid user mode");
    }

    const updatedUser = await userService.updateUserMode(userId, userMode);
    res.json(updatedUser);
  });

  // Get user settings
  getSettings = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const settings = await userService.getSettings(userId);
    res.json(settings);
  });

  // Update user settings
  updateSettings = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { notifications, privacy, language } = req.body;

    const updatedSettings = await userService.updateSettings(userId, {
      notifications,
      privacy,
      language,
    });

    res.json(updatedSettings);
  });
}
