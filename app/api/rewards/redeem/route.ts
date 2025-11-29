import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import RewardPoint from '@/models/RewardPoint';
import Transaction from '@/models/Transaction';
import { getCurrentUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

// Conversion rate: 100 points = ₱1
const POINTS_TO_PESO_RATE = 100;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { points } = body;

    if (!points || points <= 0) {
      return NextResponse.json(
        { error: 'Invalid points amount' },
        { status: 400 }
      );
    }

    // Get updated user
    const updatedUser = await User.findById(user._id);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough points
    if (updatedUser.rewardPoints.balance < points) {
      return NextResponse.json(
        { error: 'Insufficient reward points' },
        { status: 400 }
      );
    }

    // Check minimum redemption points from settings
    const settings = await getSettings();
    if (points < settings.minRedemptionPoints) {
      return NextResponse.json(
        { error: `Minimum redemption is ${settings.minRedemptionPoints} points` },
        { status: 400 }
      );
    }

    // Calculate peso amount
    const pesoAmount = points / POINTS_TO_PESO_RATE;

    // Update user reward points
    updatedUser.rewardPoints.balance -= points;
    updatedUser.rewardPoints.totalRedeemed += points;

    // Add to wallet balance
    updatedUser.wallet.balance += pesoAmount;

    await updatedUser.save();

    // Create redemption record
    const redemptionRecord = new RewardPoint({
      userId: user._id,
      points: -points,
      type: 'redeemed',
      source: 'redemption',
      description: `Redeemed ${points} points for ₱${pesoAmount.toFixed(2)}`,
    });

    await redemptionRecord.save();

    // Create wallet transaction
    const transaction = new Transaction({
      userId: user._id,
      amount: pesoAmount,
      type: 'commission', // Using commission type for reward redemption
      status: 'completed',
    });

    await transaction.save();

    return NextResponse.json(
      {
        message: 'Points redeemed successfully',
        pointsRedeemed: points,
        pesoAmount: pesoAmount,
        newBalance: updatedUser.rewardPoints.balance,
        walletBalance: updatedUser.wallet.balance,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Redeem points error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

