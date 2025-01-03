import User from '@/models/userModel';
import { NextResponse } from 'next/server';


export async function GET(req: Request) {
    try {
        const users = await User.find({}, { 'links.url': 1, 'links.winningVote': 1 });

        const winningVotes = users.flatMap(user =>
            user.links
                .filter(link => link.winningVote) // Only include links with a winning vote
                .map(link => ({
                    url: link.url,
                    winningVoteCount: 1, // Set to 1 for counting purposes; you can adjust as needed
                    label: link.winningVote // Use the existing string as the label
                }))
        );

        return NextResponse.json(winningVotes, { status: 200 });
    } catch (error) {
        console.error('Error fetching winning votes:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

