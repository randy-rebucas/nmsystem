import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Transaction from '@/models/Transaction';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get purchase transactions from the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await Transaction.find({
      type: 'purchase',
      status: 'completed',
      createdAt: { $gte: sixMonthsAgo },
    })
      .sort({ createdAt: 1 })
      .select('amount createdAt');

    // Group by month
    const monthlyData: { [key: string]: number } = {};
    
    // Initialize last 6 months with 0
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthKey);
      monthlyData[monthKey] = 0;
    }

    // Aggregate transactions by month (count of transactions as activity)
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey] += 1;
      }
    });

    // Format data for chart
    const chartData = months.map((month) => ({
      month,
      activity: monthlyData[month] || 0,
    }));

    return NextResponse.json({ data: chartData }, { status: 200 });
  } catch (error: any) {
    console.error('Get activity stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

