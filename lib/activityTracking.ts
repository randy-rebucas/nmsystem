import User, { IUser } from '@/models/User';

const ACTIVITY_PERIOD_DAYS = 30;

/**
 * Check if a user is active (purchased within last 30 days)
 */
export function isUserActive(user: IUser): boolean {
  if (!user.lastPurchaseDate) {
    return false;
  }

  const lastPurchase = new Date(user.lastPurchaseDate);
  const now = new Date();
  const daysSinceLastPurchase =
    (now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceLastPurchase <= ACTIVITY_PERIOD_DAYS;
}

/**
 * Get days until user becomes inactive
 */
export function getDaysUntilInactive(user: IUser): number | null {
  if (!user.lastPurchaseDate) {
    return null;
  }

  const lastPurchase = new Date(user.lastPurchaseDate);
  const now = new Date();
  const daysSinceLastPurchase =
    (now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24);
  const daysRemaining = ACTIVITY_PERIOD_DAYS - daysSinceLastPurchase;

  return Math.max(0, Math.ceil(daysRemaining));
}

/**
 * Check and update user activity status
 * Users who haven't purchased in 30 days become inactive for commission purposes
 */
export async function checkAndUpdateActivity(
  userId: string
): Promise<{ isActive: boolean; daysUntilInactive: number | null }> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const isActive = isUserActive(user);
  const daysUntilInactive = getDaysUntilInactive(user);

  // Note: We don't automatically deactivate users, but we check activity
  // when distributing commissions. This allows for maintenance fee payment
  // as an alternative to product purchase.

  return { isActive, daysUntilInactive };
}

/**
 * Process maintenance fee payment to keep user active
 */
export async function processMaintenanceFee(
  userId: string,
  amount: number
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Create maintenance transaction
  const Transaction = (await import('@/models/Transaction')).default;
  const transaction = new Transaction({
    userId: user._id,
    amount,
    type: 'maintenance',
    status: 'completed',
  });

  await transaction.save();

  // Update last purchase date to extend activity
  user.lastPurchaseDate = new Date();
  await user.save();
}

