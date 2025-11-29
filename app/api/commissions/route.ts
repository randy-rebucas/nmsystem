import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Commission from '@/models/Commission';
import { getCurrentUser } from '@/lib/auth';
import { getCommissionSummary } from '@/lib/commissionEngine';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary') === 'true';

    if (summary) {
      const summaryData = await getCommissionSummary(user._id);
      return NextResponse.json({ summary: summaryData }, { status: 200 });
    }

    // Get all commissions
    const commissions = await Commission.find({ toUserId: user._id })
      .populate('fromUserId', 'firstName lastName email')
      .populate('productId', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({ commissions }, { status: 200 });
  } catch (error: any) {
    console.error('Get commissions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

