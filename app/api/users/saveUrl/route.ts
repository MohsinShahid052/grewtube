import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";

connect();

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.JWT_SECRET });
    
    if (!token || !token.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userEmail = token.email;
    
    const { videoUrl, comments } = await request.json();
    // console.log("Received Payload:", { videoUrl, comments });

    
    if (!videoUrl || !Array.isArray(comments)) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
    }

    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    user.links.push({
      url: videoUrl,
      createdAt: new Date(),
      comments: comments, 
    });
    
    const updatedUser = await user.save();
    
    return NextResponse.json({ 
      message: "URL and comments saved successfully", 
      links: updatedUser.links 
    });
  } catch (error: any) {
    console.error("Error handling POST request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update the GET handler in api/users/saveUrl/route.ts
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.JWT_SECRET });
    
    if (!token || !token.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userEmail = token.email;
    const url = request.nextUrl.searchParams.get('url');

    // Find user and their URLs
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If URL parameter is provided, return only that URL's data
    if (url) {
      const urlData = user.links?.find(link => link.url === url);
      return NextResponse.json({ 
        urls: urlData ? [urlData] : [] 
      }, { status: 200 });
    }

    // Otherwise return all URLs
    const processedLinks = user.links?.map(link => ({
      _id: link._id,
      url: link.url,
      createdAt: link.createdAt,
      comments: link.comments || []
    })) || [];
    
    return NextResponse.json({ 
      urls: processedLinks 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error handling GET request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}