import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Check if any users exist in the database
    const userCount = await User.countDocuments();
    
    return NextResponse.json(
      { 
        needsSetup: userCount === 0,
        userCount 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Setup check error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

