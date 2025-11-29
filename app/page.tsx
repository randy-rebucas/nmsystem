import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export default async function Home() {
  try {
    await connectDB();
    
    // Check if any users exist in the database
    const userCount = await User.countDocuments();
    
    // If no users exist, redirect to setup
    if (userCount === 0) {
      redirect('/setup');
    }
    
    // Otherwise, redirect to dashboard
    redirect('/dashboard');
  } catch (error) {
    // If there's an error connecting to the database, redirect to setup
    console.error('Error checking setup status:', error);
    redirect('/setup');
  }
}
