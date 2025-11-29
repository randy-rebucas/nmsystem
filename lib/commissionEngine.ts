import User, { IUser } from '@/models/User';
import Commission, { ICommission } from '@/models/Commission';
import Transaction, { ITransaction } from '@/models/Transaction';
import { getCommissionForLevel } from './commission';
import { getGenealogyPath } from './genealogy';
import { isUserActive } from './activityTracking';
import mongoose from 'mongoose';

/**
 * Distribute commissions up the genealogy tree when a user makes a purchase
 */
export async function distributeCommissions(
  purchaseTransactionId: mongoose.Types.ObjectId,
  buyerUserId: mongoose.Types.ObjectId,
  productId: mongoose.Types.ObjectId
): Promise<ICommission[]> {
  // Get the genealogy path (sponsor chain) up to level 20
  const genealogyPath = await getGenealogyPath(buyerUserId, 20);
  
  const commissions: ICommission[] = [];

  // Distribute commissions to each level in the genealogy
  // genealogyPath[0] is the buyer, genealogyPath[1] is their direct sponsor (level 0 commission)
  for (let i = 1; i < genealogyPath.length; i++) {
    const { user: recipient } = genealogyPath[i];
    // Commission level is i-1 because:
    // i=1 (direct sponsor) gets level 0 commission
    // i=2 gets level 1 commission, etc.
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

    const commissionAmount = getCommissionForLevel(commissionLevel);
    if (commissionAmount === 0) continue;

    // Create commission record
    const commission = new Commission({
      fromUserId: buyerUserId,
      toUserId: recipient._id,
      productId,
      transactionId: purchaseTransactionId,
      level: commissionLevel,
      amount: commissionAmount,
      status: 'pending',
    });

    await commission.save();

    // Update recipient's wallet
    await User.findByIdAndUpdate(recipient._id, {
      $inc: {
        'wallet.pending': commissionAmount,
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
  byLevel: Array<{ level: number; amount: number; count: number }>;
}> {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const commissions = await Commission.find({ toUserId: userId });
  
  const byLevel: { [key: number]: { amount: number; count: number } } = {};
  
  for (const commission of commissions) {
    if (!byLevel[commission.level]) {
      byLevel[commission.level] = { amount: 0, count: 0 };
    }
    byLevel[commission.level].amount += commission.amount;
    byLevel[commission.level].count += 1;
  }

  return {
    totalEarned: user.wallet.totalEarned,
    pending: user.wallet.pending,
    balance: user.wallet.balance,
    byLevel: Object.entries(byLevel).map(([level, data]) => ({
      level: parseInt(level),
      ...data,
    })),
  };
}

