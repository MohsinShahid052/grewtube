import User from '@/models/userModel';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { userId, videoUrl, winningVote } = await req.json();

    try {
        const result = await User.updateOne(
            { _id: userId, 'links.url': videoUrl },
            { $set: { 'links.$.winningVote': winningVote } }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: "URL not found for the user" }, { status: 404 });
        }

        return NextResponse.json({ message: "Winning vote updated successfully" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


