import { SocialAccountService } from "../services/social-account.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";

const socialAccountService = new SocialAccountService();

export class SocialAccountController {
  // Add social account
  addAccount = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { platform, username, credentials } = req.body;

    console.log('Received social account data:', { platform, username, credentials, body: req.body });

    const account = await socialAccountService.addAccount(userId, {
      platform,
      username,
      credentials,
    });

    res.status(201).json(account);
  });

  // Get user's social accounts
  getAccounts = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { platform } = req.query;

    const accounts = await socialAccountService.getAccounts(userId, {
      platform,
    });
    res.json(accounts);
  });

  // Get account details
  getAccountDetails = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const accountId = req.params.id;

    const account = await socialAccountService.getAccountDetails(
      userId,
      accountId
    );
    res.json(account);
  });

  // Update account settings
  updateAccountSettings = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const accountId = req.params.id;
    const { settings } = req.body;

    const account = await socialAccountService.updateAccountSettings(
      userId,
      accountId,
      settings
    );
    res.json(account);
  });

  // Delete account
  deleteAccount = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const accountId = req.params.id;

    await socialAccountService.deleteAccount(userId, accountId);
    res.status(204).send();
  });

  // Get account stats
  getAccountStats = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const accountId = req.params.id;

    const stats = await socialAccountService.getAccountStats(userId, accountId);
    res.json(stats);
  });
}
