import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import { getCurrentUser } from '@/lib/auth';
import { processPendingCommissions } from '@/lib/commissionEngine';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process pending commissions to balance
    await processPendingCommissions(user._id);

    // Get updated user
    const updatedUser = await User.findById(user._id).select('wallet');

    // Get recent transactions
    const transactions = await Transaction.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('productId', 'name')
      .select('-password');

    return NextResponse.json(
      {
        wallet: updatedUser?.wallet,
        recentTransactions: transactions,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get wallet error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

