import { InstagramAccountService } from "../services/instagram-account.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { ApiError } from "../utils/ApiError.js";

const instagramAccountService = new InstagramAccountService();

export class InstagramAccountController {
  // Add new account
  addAccount = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { username, password } = req.body;

    const account = await instagramAccountService.addAccount(userId, {
      username,
      password,
    });

    res.status(201).json(account);
  });

  // Get user's Instagram accounts
  getAccounts = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const accounts = await instagramAccountService.getAccounts(userId);
    res.json(accounts);
  });

  // Get account details
  getAccountDetails = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const accountId = req.params.id;

    const account = await instagramAccountService.getAccountDetails(
      userId,
      accountId
    );
    res.json(account);
  });

  // Update account settings
  updateSettings = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const accountId = req.params.id;
    const settings = req.body;

    const updatedAccount = await instagramAccountService.updateSettings(
      userId,
      accountId,
      settings
    );
    res.json(updatedAccount);
  });

  // Delete account
  deleteAccount = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const accountId = req.params.id;

    await instagramAccountService.deleteAccount(userId, accountId);
    res.status(204).send();
  });

  // Get account stats
  getAccountStats = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const accountId = req.params.id;

    const stats = await instagramAccountService.getAccountStats(
      userId,
      accountId
    );
    res.json(stats);
  });
}
