import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    const isAdmin = user?.isAdmin || false;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const query: any = {};
    if (activeOnly && !isAdmin) {
      query.isActive = true;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error: any) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser(request);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, cost, sellingPrice, adminFee, companyProfit } =
      body;

    if (!name || cost === undefined || sellingPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const product = new Product({
      name,
      description,
      cost,
      sellingPrice,
      adminFee: adminFee || 0,
      companyProfit: companyProfit || 0,
    });

    await product.save();

    return NextResponse.json(
      { message: 'Product created successfully', product },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

