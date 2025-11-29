import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password, firstName, lastName, phone, sponsorId } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Validate sponsor if provided
    let sponsor = null;
    let level = 0;
    if (sponsorId) {
      sponsor = await User.findById(sponsorId);
      if (!sponsor) {
        return NextResponse.json(
          { error: 'Invalid sponsor ID' },
          { status: 400 }
        );
      }
      level = sponsor.level + 1;
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      sponsorId: sponsor?._id,
      level,
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    // Set cookie
    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActivated: user.isActivated,
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

