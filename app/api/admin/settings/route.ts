import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';

export async function GET() {
  try {
    await connectDB();
    const settings = await Settings.getSettings();
    
    // Convert commissionStructure Map to object
    const commissionStructure: { [key: number]: number } = {};
    if (settings.commissionStructure) {
      settings.commissionStructure.forEach((value: number, key: string) => {
        commissionStructure[parseInt(key)] = value;
      });
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
      const commissionMap = new Map<number, number>();
      Object.entries(commissionStructure).forEach(([level, amount]) => {
        const levelNum = parseInt(level);
        const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (!isNaN(levelNum) && !isNaN(amountNum)) {
          commissionMap.set(levelNum, amountNum);
        }
      });
      settings.commissionStructure = commissionMap as any;
    }

    await settings.save();

    // Convert commissionStructure Map to object for response
    const commissionStructureObj: { [key: number]: number } = {};
    settings.commissionStructure.forEach((value: number, key: string) => {
      commissionStructureObj[parseInt(key)] = value;
    });

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

