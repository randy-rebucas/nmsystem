import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { checkAndUpdateActivity, processMaintenanceFee } from '@/lib/activityTracking';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activity = await checkAndUpdateActivity(user._id.toString());

    return NextResponse.json({ activity }, { status: 200 });
  } catch (error: any) {
    console.error('Get activity error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid maintenance fee amount' },
        { status: 400 }
      );
    }

    await processMaintenanceFee(user._id.toString(), amount);

    return NextResponse.json(
      { message: 'Maintenance fee processed successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Process maintenance fee error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

