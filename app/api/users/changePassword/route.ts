import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '@/models/userModel';
import { connect } from '@/dbConfig/dbConfig';

export async function POST(req) {
  try {
    const { userId, oldPassword, newPassword } = await req.json();

    // Log incoming request data for debugging
    console.log("Received userId:", userId);
    console.log("Received oldPassword:", oldPassword);
    console.log("Received newPassword:", newPassword);

    // Ensure all inputs are provided
    if (!userId || !oldPassword || !newPassword) {
      console.error("Missing fields: ", { userId, oldPassword, newPassword });
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Connect to the database
    await connect();

    // Validate if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId format: ", userId);
      return NextResponse.json({ error: 'Invalid userId format' }, { status: 400 });
    }

    // Find the user by ObjectId
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found for userId: ", userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      console.error("Incorrect old password");
      return NextResponse.json({ error: 'Incorrect old password' }, { status: 400 });
    }

    // Ensure the new password is different from the old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json({ error: 'New password cannot be the same as the old password' }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return NextResponse.json({ message: 'Password changed successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

