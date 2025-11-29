import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET() {
  try {
    await connectDB();
    
    // Get or create settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    
    // Convert commissionStructure Map to object
    const commissionStructure: { [key: number]: number } = {};
    if (settings.commissionStructure) {
      // Mongoose Map has forEach method, but TypeScript sees it as plain object
      const commissionMap = settings.commissionStructure as any;
      if (commissionMap instanceof Map) {
        commissionMap.forEach((value: number, key: string) => {
          commissionStructure[parseInt(key)] = value;
        });
      } else {
        // If it's already an object, convert it directly
        Object.entries(commissionMap).forEach(([key, value]) => {
          commissionStructure[parseInt(key)] = value as number;
        });
      }
    }

    return NextResponse.json({
      siteName: settings.siteName,
      currency: settings.currency,
      minRedemptionPoints: settings.minRedemptionPoints,
      minWithdraw: settings.minWithdraw,
      maxWithdraw: settings.maxWithdraw,
      commissionStructure,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { siteName, currency, minRedemptionPoints, minWithdraw, maxWithdraw, commissionStructure } = body;

    // Get or create settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    // Update fields
    if (siteName !== undefined) settings.siteName = siteName;
    if (currency !== undefined) settings.currency = currency;
    if (minRedemptionPoints !== undefined) settings.minRedemptionPoints = minRedemptionPoints;
    if (minWithdraw !== undefined) settings.minWithdraw = minWithdraw;
    if (maxWithdraw !== undefined) settings.maxWithdraw = maxWithdraw;
    
    // Update commission structure
    if (commissionStructure) {
      // Mongoose Maps only support string keys, so convert numeric keys to strings
      const commissionMap = new Map<string, number>();
      Object.entries(commissionStructure).forEach(([level, amount]) => {
        const levelNum = parseInt(level);
        let amountNum: number;
        if (typeof amount === 'string') {
          amountNum = parseFloat(amount);
        } else if (typeof amount === 'number') {
          amountNum = amount;
        } else {
          return; // Skip invalid entries
        }
        if (!isNaN(levelNum) && !isNaN(amountNum)) {
          // Convert level to string for Mongoose Map
          commissionMap.set(String(levelNum), amountNum);
        }
      });
      settings.commissionStructure = commissionMap as any;
    }

    await settings.save();

    // Convert commissionStructure Map to object for response
    const commissionStructureObj: { [key: number]: number } = {};
    const commissionMap = settings.commissionStructure as any;
    if (commissionMap instanceof Map) {
      commissionMap.forEach((value: number, key: string) => {
        commissionStructureObj[parseInt(key)] = value;
      });
    } else {
      // If it's already an object, convert it directly
      Object.entries(commissionMap).forEach(([key, value]) => {
        commissionStructureObj[parseInt(key)] = value as number;
      });
    }

    return NextResponse.json({
      siteName: settings.siteName,
      currency: settings.currency,
      minRedemptionPoints: settings.minRedemptionPoints,
      minWithdraw: settings.minWithdraw,
      maxWithdraw: settings.maxWithdraw,
      commissionStructure: commissionStructureObj,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

