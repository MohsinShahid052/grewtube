import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/dbConfig/dbConfig'; // Assuming you have a dbConfig file for DB connection
import { ObjectId } from 'mongodb'; // Import ObjectId to handle MongoDB _id correctly
import User from '@/models/userModel'; // Your User model

// Connect to MongoDB
connect();

// Handle DELETE request
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params; // Extract userId from the dynamic route

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Convert userId to ObjectId
    const objectId = new ObjectId(userId);

    // Find and delete the user by ID
    const deletedUser = await User.findOneAndDelete({ _id: objectId });

    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return success message
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user', message: error.message }, { status: 500 });
  }
}
