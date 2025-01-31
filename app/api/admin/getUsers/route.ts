// /app/api/admin/getUsers/route.ts
import { NextResponse } from 'next/server';
import { connect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';

// Ensure database connection
connect();

export async function GET() {
  try {
    // Fetch all users from the database, including their links
    const users = await User.find({}).select('username email links');

    // Return users as a JSON response
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
