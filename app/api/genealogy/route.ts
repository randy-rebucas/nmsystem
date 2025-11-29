import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { getGenealogyPath, getDownline, getDirectReferrals, getDownlineJourney } from '@/lib/genealogy';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'upline'; // 'upline' or 'downline'
    const targetUserId = searchParams.get('userId');
    const journeyUserId = searchParams.get('journeyUserId'); // For journey path

    const userId = targetUserId ? targetUserId : user._id.toString();

    // Handle journey path request
    if (type === 'journey' && journeyUserId) {
      const journey = await getDownlineJourney(user._id, journeyUserId as any);
      if (journey === null) {
        return NextResponse.json(
          { error: 'User is not in your downline' },
          { status: 404 }
        );
      }
      return NextResponse.json({ journey }, { status: 200 });
    }

    if (type === 'upline') {
      const genealogyPath = await getGenealogyPath(userId as any);
      return NextResponse.json({ genealogy: genealogyPath }, { status: 200 });
    } else if (type === 'downline') {
      const downline = await getDownline(userId as any);
      const directReferrals = await getDirectReferrals(userId as any);
      return NextResponse.json(
        {
          downline,
          directReferrals,
          totalDownline: downline.length,
          directReferralsCount: directReferrals.length,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('Genealogy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

