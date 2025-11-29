import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getCurrentUser } from '@/lib/auth';

// GET all transactions (admin only)
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
    const type = searchParams.get('type'); // 'purchase', 'commission', 'withdrawal', 'maintenance', 'all'
    const status = searchParams.get('status'); // 'pending', 'completed', 'failed', 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by user email, name, or product name (will need to populate)
    // We'll handle search after populating

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    // Fetch transactions with populated fields
    let transactions = await Transaction.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('productId', 'name')
      .populate('fromUserId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Filter by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      transactions = transactions.filter((t: any) => {
        const user = t.userId;
        const product = t.productId;
        const fromUser = t.fromUserId;
        
        return (
          (user?.email?.toLowerCase().includes(searchLower)) ||
          (user?.firstName?.toLowerCase().includes(searchLower)) ||
          (user?.lastName?.toLowerCase().includes(searchLower)) ||
          (product?.name?.toLowerCase().includes(searchLower)) ||
          (fromUser?.email?.toLowerCase().includes(searchLower)) ||
          (fromUser?.firstName?.toLowerCase().includes(searchLower)) ||
          (fromUser?.lastName?.toLowerCase().includes(searchLower)) ||
          (t._id.toString().includes(searchLower))
        );
      });
    }

    // Recalculate total if search was applied
    const finalTotal = search ? transactions.length : total;

    return NextResponse.json(
      {
        transactions,
        pagination: {
          page,
          limit,
          total: finalTotal,
          pages: Math.ceil(finalTotal / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

