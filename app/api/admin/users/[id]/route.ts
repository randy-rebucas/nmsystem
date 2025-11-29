import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// GET single user (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    // Check if user is admin
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;

    const user = await User.findById(userId)
      .select('-password')
      .populate('sponsorId', 'firstName lastName email')
      .lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    // Check if user is admin
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;

    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      isActivated,
      isAdmin,
      sponsorId,
      password,
    } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from removing their own admin status
    if (currentUser._id.toString() === userId && isAdmin === false) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin privileges' },
        { status: 400 }
      );
    }

    // Update fields
    if (email !== undefined) user.email = email;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (isActivated !== undefined) {
      user.isActivated = isActivated;
      if (isActivated && !user.activationDate) {
        user.activationDate = new Date();
      }
    }
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    if (password !== undefined && password.trim() !== '') {
      user.password = password; // Will be hashed by pre-save hook
    }

    // Update sponsor if provided
    if (sponsorId !== undefined) {
      if (sponsorId === null || sponsorId === '') {
        user.sponsorId = undefined;
        user.level = 0;
      } else {
        const sponsor = await User.findById(sponsorId);
        if (!sponsor) {
          return NextResponse.json(
            { error: 'Invalid sponsor ID' },
            { status: 400 }
          );
        }
        user.sponsorId = sponsor._id;
        user.level = sponsor.level + 1;
      }
    }

    await user.save();

    // Return updated user without password
    const updatedUser = await User.findById(userId)
      .select('-password')
      .populate('sponsorId', 'firstName lastName email')
      .lean();

    return NextResponse.json(
      {
        message: 'User updated successfully',
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await connectDB();

    // Check if user is admin
    const currentUser = await getCurrentUser(request);
    if (!currentUser || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const userId = resolvedParams.id;

    // Prevent admin from deleting themselves
    if (currentUser._id.toString() === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

