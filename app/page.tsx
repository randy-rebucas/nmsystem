import { redirect } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export default async function Home() {
  let userCount = 0;
  
  try {
    await connectDB();
    // Check if any users exist in the database
    userCount = await User.countDocuments();
  } catch (error) {
    // If there's an error connecting to the database, redirect to setup
    console.error('Error checking setup status:', error);
    redirect('/setup');
  }
  
  // If no users exist, redirect to setup
  if (userCount === 0) {
    redirect('/setup');
  }
  
  // Otherwise, redirect to dashboard
  redirect('/dashboard');
}
