import { User } from '../models/User';
import { InternalServerError } from './errors';

let cachedAutoReviewUserId: string | null = null;

export const getAutoReviewUserId = async (): Promise<string> => {
  if (cachedAutoReviewUserId) {
    return cachedAutoReviewUserId;
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!adminEmail) {
    throw new InternalServerError(
      'ADMIN_EMAIL is not configured. Set it to the same email used when running the one-time admin seed.',
    );
  }

  const user = await User.findOne({ email: adminEmail, isActive: true }).select('_id');

  if (!user) {
    throw new InternalServerError(
      'Auto-review admin user was not found. Run the one-time admin seed with the same ADMIN_EMAIL.',
    );
  }

  cachedAutoReviewUserId = user._id.toString();
  return cachedAutoReviewUserId;
};
