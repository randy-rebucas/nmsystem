# NMSystem - Multi-Level Marketing Platform

A commission-based digital commerce platform built with Next.js, TypeScript, Tailwind CSS, and MongoDB.

## Features

- **User Activation**: Users become activated when they purchase a product
- **20-Level Commission Structure**: Automatic commission distribution up to 20 levels
- **Wallet System**: Track balance, pending commissions, and total earnings
- **Reward Points System**: Earn points on purchases and redeem them for cash
- **Genealogy Tree**: View upline sponsors and downline referrals
- **Product Management**: Admin can create and manage products
- **Withdrawal System**: Request withdrawals from wallet balance
- **Commission Tracking**: Detailed commission history and breakdown by level

## Commission Structure

- **Level 0 (Direct)**: ₱165
- **Levels 1-5**: ₱70 each
- **Levels 6-10**: ₱60 each
- **Levels 11-15**: ₱50 each
- **Level 16**: ₱40
- **Level 17**: ₱30
- **Level 18**: ₱20
- **Level 19**: ₱10
- **Level 20**: ₱5
- **Total**: ₱1,170 per product purchase

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

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

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
├── lib/                  # Utility functions
│   ├── mongodb.ts        # MongoDB connection
│   ├── auth.ts           # Authentication utilities
│   ├── commission.ts     # Commission structure
│   ├── commissionEngine.ts # Commission distribution
│   └── genealogy.ts      # Genealogy functions
└── models/               # Mongoose models
    ├── User.ts
    ├── Product.ts
    ├── Transaction.ts
    ├── Commission.ts
    └── RewardPoint.ts
```

## Business Rules

1. **Activation**: Users are activated only when they purchase a product
2. **Commissions**: Only activated users receive commissions
3. **Monthly Activity**: Users must purchase at least 1 product every 30 days to remain active (or pay maintenance fee)
4. **Commission Distribution**: Commissions are distributed automatically up the genealogy tree when a purchase is made
5. **Total Payout**: Maximum ₱1,170 per product purchase across all 20 levels

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
- `GET /api/commissions` - Get commission history
- `GET /api/commissions?summary=true` - Get commission summary

### Reward Points
- `GET /api/rewards` - Get reward points balance and transaction history
- `POST /api/rewards/redeem` - Redeem reward points for cash (converted to wallet balance)

## License

This project is proprietary software.
