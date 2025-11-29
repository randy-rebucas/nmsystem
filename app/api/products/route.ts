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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const query: any = {};
    if (activeOnly && !isAdmin) {
      query.isActive = true;
    }

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    // Fetch products with pagination
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Convert to plain objects to ensure proper JSON serialization
    const productsData = products.map((product) => product.toObject());

    return NextResponse.json(
      {
        products: productsData,
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
    const { name, description, cost, sellingPrice, adminFee, companyProfit, image, isActive } =
      body;

    if (!name || cost === undefined || sellingPrice === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log image data for debugging
    console.log('Creating product with image:', {
      hasImage: !!image,
      imageLength: image?.length || 0,
      imagePreview: image?.substring(0, 50) || 'none',
    });

    const product = new Product({
      name,
      description,
      cost,
      sellingPrice,
      adminFee: adminFee || 0,
      companyProfit: companyProfit || 0,
      image: image && image.trim() ? image : undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    await product.save();
    
    // Verify image was saved
    const savedProduct = await Product.findById(product._id);
    console.log('Product saved, image field:', {
      hasImage: !!savedProduct?.image,
      imageLength: savedProduct?.image?.length || 0,
    });

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

