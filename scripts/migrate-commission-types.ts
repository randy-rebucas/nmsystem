/**
 * Migration script to add 'type' field to existing Commission records
 * Run this once after deploying the updated Commission model
 * 
 * Usage: 
 *   npx tsx scripts/migrate-commission-types.ts
 *   or compile and run: tsc scripts/migrate-commission-types.ts && node scripts/migrate-commission-types.js
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envFile = readFileSync(envPath, 'utf-8');
    const envLines = envFile.split('\n');
    
    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
          process.env[key.trim()] = value.trim();
        }
      }
    }
  } catch (error) {
    // .env.local not found, will use process.env
  }
}

// Load .env.local
loadEnvFile();

// Connect to MongoDB directly
const connectDB = async (): Promise<typeof mongoose> => {
  // Load MONGODB_URI from environment
  const MONGODB_URI = process.env.MONGODB_URI || '';
  
  if (!MONGODB_URI) {
    throw new Error(
      'Please define the MONGODB_URI environment variable.\n' +
      'You can either:\n' +
      '1. Set it in .env.local file (MONGODB_URI=your-connection-string)\n' +
      '2. Export it: export MONGODB_URI="your-connection-string"\n' +
      '3. Pass it inline: MONGODB_URI="your-connection-string" npm run migrate:commissions'
    );
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  return mongoose.connect(MONGODB_URI);
};

// Define Commission Schema inline (to avoid import path issues)
const CommissionSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
  level: { type: Number, required: true, min: 0, max: 20 },
  type: { 
    type: String, 
    enum: ['direct', 'indirect'],
  },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paidAt: { type: Date },
}, { timestamps: true, strict: false }); // strict: false allows fields not in schema

const Commission = mongoose.models.Commission || mongoose.model('Commission', CommissionSchema);

async function migrateCommissionTypes() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('✅ Connected successfully');

    // Find all commissions without type field or with undefined/null type
    const commissions = await Commission.find({
      $or: [
        { type: { $exists: false } },
        { type: null },
        { type: undefined },
        { type: '' }
      ]
    });

    console.log(`Found ${commissions.length} commissions to migrate`);

    if (commissions.length === 0) {
      console.log('✅ No commissions need migration. All commissions already have type field.');
      return;
    }

    let migrated = 0;
    let errors = 0;

    for (const commission of commissions) {
      try {
        // Set type based on level
        const commissionType = commission.level === 0 ? 'direct' : 'indirect';
        
        // Update using updateOne to avoid schema validation issues
        await Commission.updateOne(
          { _id: commission._id },
          { $set: { type: commissionType } }
        );
        
        migrated++;
        
        if (migrated % 100 === 0) {
          console.log(`Migrated ${migrated} commissions...`);
        }
      } catch (error: any) {
        console.error(`Error migrating commission ${commission._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Migration completed!');
    console.log(`✅ Successfully migrated: ${migrated}`);
    if (errors > 0) {
      console.log(`❌ Errors: ${errors}`);
    }
    
    // Verify migration
    const remaining = await Commission.countDocuments({
      $or: [
        { type: { $exists: false } },
        { type: null },
        { type: undefined },
        { type: '' }
      ]
    });
    
    if (remaining === 0) {
      console.log('✅ All commissions have been migrated successfully!');
    } else {
      console.log(`⚠️  Warning: ${remaining} commissions still need migration`);
    }

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('MONGODB_URI')) {
      console.error('\n💡 Tip: Make sure MONGODB_URI is set in your environment variables.');
    }
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
}

// Run migration
migrateCommissionTypes();
