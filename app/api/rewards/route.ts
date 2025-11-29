import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import RewardPoint from '@/models/RewardPoint';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get updated user with reward points
    const updatedUser = await User.findById(user._id).select('rewardPoints');

    // Get recent reward point transactions
    const rewardHistory = await RewardPoint.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('relatedProductId', 'name')
      .select('-password');

    return NextResponse.json(
      {
        rewardPoints: updatedUser?.rewardPoints,
        history: rewardHistory,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get rewards error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

