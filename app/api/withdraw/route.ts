import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getCurrentUser } from '@/lib/auth';
import { processPendingCommissions } from '@/lib/commissionEngine';
import { getSettings } from '@/lib/settings';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process pending commissions first
    await processPendingCommissions(user._id);

    // Get updated user
    const updatedUser = await User.findById(user._id);
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

    if (updatedUser.wallet.balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Check withdrawal limits from settings
    const settings = await getSettings();
    if (amount < settings.minWithdraw) {
      return NextResponse.json(
        { error: `Minimum withdrawal amount is ${settings.minWithdraw}` },
        { status: 400 }
      );
    }
    if (amount > settings.maxWithdraw) {
      return NextResponse.json(
        { error: `Maximum withdrawal amount is ${settings.maxWithdraw}` },
        { status: 400 }
      );
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      userId: user._id,
      amount: -amount,
      type: 'withdrawal',
      status: 'pending', // Admin will approve
    });

    await transaction.save();

    // Deduct from balance
    updatedUser.wallet.balance -= amount;
    await updatedUser.save();

    return NextResponse.json(
      {
        message: 'Withdrawal request submitted',
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
        },
        newBalance: updatedUser.wallet.balance,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

