import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { processPendingCommissions } from '@/lib/commissionEngine';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process any remaining pending commissions (for backward compatibility)
    await processPendingCommissions(user._id);

    // Get updated user with latest wallet balance
    const updatedUser = await getCurrentUser(request);
    if (!updatedUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          isActivated: updatedUser.isActivated,
          isAdmin: updatedUser.isAdmin,
          wallet: updatedUser.wallet,
          rewardPoints: updatedUser.rewardPoints,
          activationDate: updatedUser.activationDate,
          lastPurchaseDate: updatedUser.lastPurchaseDate,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

