import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import User, { IUser } from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export function generateToken(user: IUser): string {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    isAdmin: user.isAdmin,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(
  request: NextRequest
): Promise<IUser | null> {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const user = await User.findById(payload.userId).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

