import { User } from '../models/User';
import { InternalServerError } from './errors';

let cachedAutoReviewUserId: string | null = null;

export const getAutoReviewUserId = async (): Promise<string> => {
  if (cachedAutoReviewUserId) {
    return cachedAutoReviewUserId;
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@accrediassist.edu';
  const user = await User.findOne({ email: adminEmail, isActive: true }).select('_id');

  if (!user) {
    throw new InternalServerError(
      `Auto-review user not found for ${adminEmail}. Run database seed to create the admin account.`,
    );
  }

  cachedAutoReviewUserId = user._id.toString();
  return cachedAutoReviewUserId;
};
