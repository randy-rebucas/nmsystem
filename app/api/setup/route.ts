import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check if any users already exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return NextResponse.json(
        { error: 'Setup already completed. Users exist in the database.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists (shouldn't happen, but just in case)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create first admin user - MUST be admin
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      level: 0,
      isAdmin: true, // First user is always admin - required for setup
    });

    // Explicitly ensure isAdmin is true (safeguard)
    user.isAdmin = true;

    await user.save();

    // Verify isAdmin was saved correctly
    if (!user.isAdmin) {
      throw new Error('Failed to set admin privileges during setup');
    }

    // Generate token
    const token = generateToken(user);

    // Set cookie
    const response = NextResponse.json(
      {
        message: 'Setup completed successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActivated: user.isActivated,
          isAdmin: user.isAdmin,
        },
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

