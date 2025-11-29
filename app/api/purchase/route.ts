import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Product from '@/models/Product';
import Transaction from '@/models/Transaction';
import RewardPoint from '@/models/RewardPoint';
import { getCurrentUser } from '@/lib/auth';
import { distributeCommissions } from '@/lib/commissionEngine';

// Reward points rate: 1 point per ₱100 spent
const POINTS_PER_PESO = 0.01;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      );
    }

    // Create purchase transaction
    const transaction = new Transaction({
      userId: user._id,
      productId: product._id,
      amount: product.sellingPrice,
      type: 'purchase',
      status: 'completed',
    });

    await transaction.save();

    // Check if user is already activated
    const wasActivated = user.isActivated;

    // Activate user if not already activated
    if (!user.isActivated) {
      user.isActivated = true;
      user.activationDate = new Date();
    }

    // Update last purchase date
    user.lastPurchaseDate = new Date();

    // Award reward points (1 point per ₱100 spent)
    const pointsEarned = Math.floor(product.sellingPrice * POINTS_PER_PESO);
    if (pointsEarned > 0) {
      user.rewardPoints.balance += pointsEarned;
      user.rewardPoints.totalEarned += pointsEarned;

      // Create reward point record
      const rewardPoint = new RewardPoint({
        userId: user._id,
        points: pointsEarned,
        type: 'earned',
        source: 'purchase',
        description: `Earned ${pointsEarned} points from purchase: ${product.name}`,
        relatedTransactionId: transaction._id,
        relatedProductId: product._id,
      });

      await rewardPoint.save();
    }

    await user.save();

    // Distribute commissions if user was just activated or if they were already activated
    if (user.isActivated) {
      await distributeCommissions(transaction._id, user._id, product._id);
    }

    return NextResponse.json(
      {
        message: 'Purchase completed successfully',
        transaction: {
          id: transaction._id,
          amount: transaction.amount,
          type: transaction.type,
          status: transaction.status,
        },
        activated: !wasActivated && user.isActivated,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Purchase error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

