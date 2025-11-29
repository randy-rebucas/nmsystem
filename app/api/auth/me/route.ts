import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActivated: user.isActivated,
          isAdmin: user.isAdmin,
          wallet: user.wallet,
          rewardPoints: user.rewardPoints,
          activationDate: user.activationDate,
          lastPurchaseDate: user.lastPurchaseDate,
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

