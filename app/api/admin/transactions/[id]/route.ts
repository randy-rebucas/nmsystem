import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// GET single transaction (admin only)
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
    const transactionId = resolvedParams.id;

    const transaction = await Transaction.findById(transactionId)
      .populate('userId', 'firstName lastName email')
      .populate('productId', 'name description sellingPrice')
      .populate('fromUserId', 'firstName lastName email')
      .lean();

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ transaction }, { status: 200 });
  } catch (error: any) {
    console.error('Get transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update transaction status (admin only)
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
    const transactionId = resolvedParams.id;

    const body = await request.json();
    const { status } = body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Validate status
    if (status && !['pending', 'completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const oldStatus = transaction.status;

    // Update status
    if (status !== undefined) {
      transaction.status = status;
    }

    // If approving a withdrawal, ensure the balance was already deducted
    // If rejecting a withdrawal, refund the amount
    if (transaction.type === 'withdrawal') {
      const user = await User.findById(transaction.userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (oldStatus === 'pending' && status === 'completed') {
        // Withdrawal approved - balance should already be deducted
        // Just confirm the transaction is completed
      } else if (oldStatus === 'pending' && status === 'failed') {
        // Withdrawal rejected - refund the amount
        user.wallet.balance += Math.abs(transaction.amount);
        await user.save();
      } else if (oldStatus === 'completed' && status === 'failed') {
        // Reversing a completed withdrawal - refund
        user.wallet.balance += Math.abs(transaction.amount);
        await user.save();
      } else if (oldStatus === 'failed' && status === 'completed') {
        // Re-approving a failed withdrawal - deduct again
        if (user.wallet.balance >= Math.abs(transaction.amount)) {
          user.wallet.balance -= Math.abs(transaction.amount);
          await user.save();
        } else {
          return NextResponse.json(
            { error: 'Insufficient balance to process withdrawal' },
            { status: 400 }
          );
        }
      }
    }

    await transaction.save();

    // Return updated transaction
    const updatedTransaction = await Transaction.findById(transactionId)
      .populate('userId', 'firstName lastName email')
      .populate('productId', 'name description sellingPrice')
      .populate('fromUserId', 'firstName lastName email')
      .lean();

    return NextResponse.json(
      {
        message: 'Transaction updated successfully',
        transaction: updatedTransaction,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

