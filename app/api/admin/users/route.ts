import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// GET all users (admin only)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check if user is admin
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'activated', 'not-activated', 'all'
    const role = searchParams.get('role'); // 'admin', 'user', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Search by email, firstName, or lastName
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by activation status
    if (status === 'activated') {
      query.isActivated = true;
    } else if (status === 'not-activated') {
      query.isActivated = false;
    }

    // Filter by role
    if (role === 'admin') {
      query.isAdmin = true;
    } else if (role === 'user') {
      query.isAdmin = false;
    }

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Fetch users
    const users = await User.find(query)
      .select('-password')
      .populate('sponsorId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json(
      {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create user (admin only)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Check if user is admin
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, firstName, lastName, phone, sponsorId, isAdmin, isActivated } = body;

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
      isAdmin: isAdmin || false,
      isActivated: isActivated || false,
    });

    await user.save();

    // Return user without password
    const userResponse = await User.findById(user._id)
      .select('-password')
      .populate('sponsorId', 'firstName lastName email')
      .lean();

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: userResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

