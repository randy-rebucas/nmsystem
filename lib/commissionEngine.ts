import User, { IUser } from '@/models/User';
import Commission, { ICommission } from '@/models/Commission';
import Transaction, { ITransaction } from '@/models/Transaction';
import Product from '@/models/Product';
import { getCommissionForLevel } from './commission';
import { getGenealogyPath } from './genealogy';
import { isUserActive } from './activityTracking';
import mongoose from 'mongoose';

/**
 * Validate that commission can be distributed
 */
function validateCommissionDistribution(
  recipient: IUser,
  commissionLevel: number,
  commissionAmount: number
): { valid: boolean; reason?: string } {
  if (commissionLevel < 0 || commissionLevel > 20) {
    return { valid: false, reason: 'Invalid commission level' };
  }

  if (commissionAmount <= 0) {
    return { valid: false, reason: 'Commission amount must be positive' };
  }

  if (!recipient.isActivated) {
    return { valid: false, reason: 'Recipient is not activated' };
  }

  return { valid: true };
}

/**
 * Distribute commissions up the genealogy tree when a user makes a purchase
 * Direct commission (level 0): Based on commission structure from settings
 * Indirect commissions (levels 1-20): Based on commission structure from settings
 */
export async function distributeCommissions(
  purchaseTransactionId: mongoose.Types.ObjectId,
  buyerUserId: mongoose.Types.ObjectId,
  productId: mongoose.Types.ObjectId
): Promise<ICommission[]> {
  // Get the product for reference
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }
  
  // Get the genealogy path (sponsor chain) up to level 20
  const genealogyPath = await getGenealogyPath(buyerUserId, 20);
  
  const commissions: ICommission[] = [];

  // Distribute commissions to each level in the genealogy
  // genealogyPath[0] is the buyer, genealogyPath[1] is their direct sponsor (level 0 commission)
  for (let i = 1; i < genealogyPath.length; i++) {
    const { user: recipient } = genealogyPath[i];
    // Commission level is i-1 because:
    // i=1 (direct sponsor) gets level 0 commission (direct)
    // i=2 gets level 1 commission (indirect), etc.
    const commissionLevel = i - 1;
    
    // Only pay commissions up to level 20
    if (commissionLevel > 20) break;

    // Only pay commissions to activated users
    if (!recipient.isActivated) {
      continue;
    }

    // Check if user is active (purchased within last 30 days)
    if (!isUserActive(recipient)) {
      continue;
    }

    // Get commission amount from settings (applies to all levels including level 0)
    const commissionAmount = await getCommissionForLevel(commissionLevel);

    if (commissionAmount === 0) continue;

    // Validate commission distribution
    const validation = validateCommissionDistribution(recipient, commissionLevel, commissionAmount);
    if (!validation.valid) {
      console.warn(`Skipping commission for user ${recipient._id} at level ${commissionLevel}: ${validation.reason}`);
      continue;
    }

    // Determine commission type: direct (level 0) or indirect (level 1-20)
    const commissionType: 'direct' | 'indirect' = commissionLevel === 0 ? 'direct' : 'indirect';

    // Create commission record - automatically paid
    const commission = new Commission({
      fromUserId: buyerUserId,
      toUserId: recipient._id,
      productId,
      transactionId: purchaseTransactionId,
      level: commissionLevel,
      type: commissionType,
      amount: commissionAmount,
      status: 'paid',
      paidAt: new Date(),
    });

    await commission.save();

    // Update recipient's wallet - add directly to balance (not pending)
    await User.findByIdAndUpdate(recipient._id, {
      $inc: {
        'wallet.balance': commissionAmount,
        'wallet.totalEarned': commissionAmount,
      },
    });

    commissions.push(commission);
  }

  return commissions;
}

/**
 * Process and pay out pending commissions to wallet balance
 */
export async function processPendingCommissions(
  userId: mongoose.Types.ObjectId
): Promise<void> {
  const pendingCommissions = await Commission.find({
    toUserId: userId,
    status: 'pending',
  });

  let totalPending = 0;
  for (const commission of pendingCommissions) {
    totalPending += commission.amount;
    commission.status = 'paid';
    commission.paidAt = new Date();
    await commission.save();
  }

  if (totalPending > 0) {
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'wallet.balance': totalPending,
        'wallet.pending': -totalPending,
      },
    });
  }
}

/**
 * Get commission summary for a user
 */
export async function getCommissionSummary(
  userId: mongoose.Types.ObjectId
): Promise<{
  totalEarned: number;
  pending: number;
  balance: number;
  direct: { amount: number; count: number };
  indirect: { amount: number; count: number };
  byLevel: Array<{ level: number; amount: number; count: number; type: 'direct' | 'indirect' }>;
}> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const commissions = await Commission.find({ toUserId: userId });
  
  const byLevel: { [key: number]: { amount: number; count: number; type: 'direct' | 'indirect' } } = {};
  let directTotal = 0;
  let directCount = 0;
  let indirectTotal = 0;
  let indirectCount = 0;
  
  for (const commission of commissions) {
    const level = commission.level;
    const type = commission.type || (level === 0 ? 'direct' : 'indirect');
    
    if (!byLevel[level]) {
      byLevel[level] = { amount: 0, count: 0, type };
    }
    byLevel[level].amount += commission.amount;
    byLevel[level].count += 1;
    
    // Track direct vs indirect totals
    if (type === 'direct') {
      directTotal += commission.amount;
      directCount += 1;
    } else {
      indirectTotal += commission.amount;
      indirectCount += 1;
    }
  }

  return {
    totalEarned: user.wallet.totalEarned,
    pending: user.wallet.pending,
    balance: user.wallet.balance,
    direct: { amount: directTotal, count: directCount },
    indirect: { amount: indirectTotal, count: indirectCount },
    byLevel: Object.entries(byLevel).map(([level, data]) => ({
      level: parseInt(level),
      ...data,
    })),
  };
}

