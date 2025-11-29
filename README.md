# NMSystem - Multi-Level Marketing Platform

A comprehensive commission-based digital commerce platform built with Next.js, TypeScript, Tailwind CSS, and MongoDB. Features a fully implemented direct and indirect commission structure with 21 levels of commission distribution.

## Features

- **User Activation**: Users become activated when they purchase a product
- **Direct & Indirect Commission Structure**: Properly implemented 21-level commission system (Level 0 = Direct, Levels 1-20 = Indirect)
- **Automatic Commission Distribution**: Commissions are automatically distributed up the genealogy tree when purchases are made
- **Wallet System**: Track balance, pending commissions, and total earnings with detailed breakdown
- **Reward Points System**: Earn points on purchases and redeem them for cash
- **Genealogy Tree**: View upline sponsors and downline referrals with visual tree structure
- **Admin Dashboard**: Complete admin panel for managing users, products, transactions, and settings
- **Product Management**: Admin can create, edit, and manage products
- **Withdrawal System**: Request withdrawals from wallet balance with admin approval
- **Commission Tracking**: Detailed commission history with direct/indirect breakdown by level
- **Settings Management**: Configurable commission structure, currency, and system settings

## Commission Structure

The platform implements a comprehensive direct and indirect commission structure:

### Direct Commissions (Level 0)
- **Type**: Direct commission from immediate referrals
- **Amount**: ₱165 (configurable in admin settings)
- **Eligibility**: User must be activated and active (purchased within last 30 days)

### Indirect Commissions (Levels 1-20)
- **Type**: Indirect commissions from downline network
- **Amounts**:
  - **Levels 1-5**: ₱70 each
  - **Levels 6-10**: ₱60 each
  - **Levels 11-15**: ₱50 each
  - **Level 16**: ₱40
  - **Level 17**: ₱30
  - **Level 18**: ₱20
  - **Level 19**: ₱10
  - **Level 20**: ₱5
- **Total**: ₱1,170 per product purchase (all levels combined)
- **Eligibility**: User must be activated and active (purchased within last 30 days)

### Commission Distribution Rules
1. Commissions are automatically distributed when a user makes a purchase
2. Only activated users receive commissions
3. Users must be active (purchased within 30 days) to receive commissions
4. Commission amounts are configurable via admin settings
5. All commissions are immediately paid to wallet balance (not pending)

## Reward Points System

Users earn reward points on every purchase, which can be redeemed for cash.

### Earning Points
- **Rate**: 1 point per ₱100 spent
- Points are automatically awarded when a purchase is completed
- Points are added to the user's reward points balance immediately

### Redeeming Points
- **Conversion Rate**: 100 points = ₱1.00
- **Minimum Redemption**: 100 points (₱1.00)
- Redeemed points are converted to wallet balance
- Full transaction history is maintained for all point earnings and redemptions

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form state management
- **Zod** - Schema validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)

### Installation

1. Clone the repository:
```bash
cd nmsystem
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/nmsystem
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

6. (Optional) Run database migration for existing commissions:
```bash
npm run migrate:commissions
```

This will add the `type` field (direct/indirect) to existing commission records.

## Project Structure

```
nmsystem/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── products/     # Product management
│   │   ├── purchase/     # Purchase flow
│   │   ├── wallet/       # Wallet operations
│   │   ├── withdraw/     # Withdrawal requests
│   │   ├── rewards/      # Reward points operations
│   │   ├── genealogy/    # Genealogy tree
│   │   └── commissions/ # Commission tracking
│   ├── dashboard/        # User dashboard
│   ├── products/         # Product listing
│   ├── wallet/           # Wallet page
│   ├── rewards/          # Reward points page
│   ├── genealogy/        # Genealogy tree view
│   ├── commissions/      # Commission history
│   ├── login/            # Login page
│   └── register/         # Registration page
├── components/           # React components
│   ├── ui/               # Reusable UI components (shadcn/ui)
│   ├── Layout.tsx        # Main layout component
│   └── admin-sidebar.tsx # Admin sidebar navigation
├── lib/                  # Utility functions
│   ├── mongodb.ts        # MongoDB connection
│   ├── auth.ts           # Authentication utilities
│   ├── commission.ts     # Commission structure and validation
│   ├── commissionEngine.ts # Commission distribution engine
│   ├── genealogy.ts      # Genealogy tree functions
│   ├── settings.ts       # Settings management
│   └── activityTracking.ts # User activity tracking
├── models/               # Mongoose models
│   ├── User.ts           # User model with wallet and rewards
│   ├── Product.ts        # Product model
│   ├── Transaction.ts    # Transaction model
│   ├── Commission.ts     # Commission model (with direct/indirect type)
│   ├── RewardPoint.ts    # Reward point model
│   └── Settings.ts       # System settings model
├── hooks/                # Custom React hooks
│   ├── use-settings.ts   # Settings hook
│   └── use-mobile.ts     # Mobile detection hook
└── scripts/              # Utility scripts
    └── migrate-commission-types.ts # Commission migration script
```

## Business Rules

1. **Activation**: Users are activated only when they purchase a product
2. **Commissions**: Only activated users receive commissions
3. **Activity Requirement**: Users must purchase at least 1 product every 30 days to remain active (or pay maintenance fee)
4. **Commission Distribution**: 
   - Commissions are distributed automatically up the genealogy tree when a purchase is made
   - Direct commissions (Level 0) go to the immediate sponsor
   - Indirect commissions (Levels 1-20) go to users further up the genealogy tree
   - All commissions are immediately paid to wallet balance
5. **Total Payout**: Maximum ₱1,170 per product purchase across all 21 levels (0-20)
6. **Commission Types**: All commissions are tracked as either "direct" (Level 0) or "indirect" (Levels 1-20)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (admin only)

### Purchase
- `POST /api/purchase` - Purchase a product

### Wallet
- `GET /api/wallet` - Get wallet balance and transactions
- `POST /api/withdraw` - Request withdrawal

### Genealogy
- `GET /api/genealogy?type=upline` - Get upline sponsors
- `GET /api/genealogy?type=downline` - Get downline referrals

### Commissions
- `GET /api/commissions` - Get commission history with direct/indirect breakdown
- `GET /api/commissions?summary=true` - Get commission summary including direct/indirect totals

### Reward Points
- `GET /api/rewards` - Get reward points balance and transaction history
- `POST /api/rewards/redeem` - Redeem reward points for cash (converted to wallet balance)

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/transactions` - Get all transactions (admin only)
- `GET /api/admin/settings` - Get system settings (admin only)
- `POST /api/admin/settings` - Update system settings (admin only)
- `GET /api/admin/stats/activity` - Get activity statistics (admin only)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run migrate:commissions` - Migrate existing commissions to add type field

## Database Migration

If you have existing commission records, run the migration script to add the `type` field:

```bash
npm run migrate:commissions
```

This script will:
- Connect to your MongoDB database (using MONGODB_URI from .env.local)
- Find all commissions without the `type` field
- Set `type` to `'direct'` for Level 0 commissions
- Set `type` to `'indirect'` for Level 1-20 commissions
- Verify all commissions are migrated

## Admin Features

The platform includes a comprehensive admin dashboard:

- **User Management**: View, search, and manage all users
- **Product Management**: Create, edit, and manage products
- **Transaction Management**: View and manage all transactions
- **Settings Management**: Configure commission structure, currency, and system settings
- **Statistics**: View activity statistics and earnings reports

## Commission System Details

### Direct Commissions
- Earned from immediate referrals (Level 0)
- Fixed amount from settings (default: ₱165)
- Automatically assigned `type: 'direct'` in database

### Indirect Commissions
- Earned from downline network (Levels 1-20)
- Amounts vary by level (configurable in settings)
- Automatically assigned `type: 'indirect'` in database

### Commission Tracking
- All commissions are tracked with:
  - `fromUserId`: User who made the purchase
  - `toUserId`: User receiving the commission
  - `level`: Commission level (0-20)
  - `type`: Commission type ('direct' or 'indirect')
  - `amount`: Commission amount
  - `status`: Commission status ('paid', 'pending', 'failed')

## Security

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Admin-only routes protected
- Environment variables for sensitive data
- Input validation using Zod schemas

## License

This project is proprietary software.
