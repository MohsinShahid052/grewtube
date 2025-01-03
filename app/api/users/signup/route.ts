// // /app/api/users/signup/route.ts

// import { connect } from "@/dbConfig/dbConfig";
// import User from "@/models/userModel";
// import { NextRequest, NextResponse } from "next/server";
// import bcryptjs from "bcryptjs";

// // Connect to MongoDB
// connect();

// export async function POST(request: NextRequest) {
//   try {
//     const reqBody = await request.json();
//     console.log("Request Body:", reqBody);

//     const { username, email, password } = reqBody;

//     // Check if user already exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       console.log("User already exists:", email);
//       return NextResponse.json(
//         { error: "User already exists" },
//         { status: 400 }
//       );
//     }

//     // Hash password
//     const salt = await bcryptjs.genSalt(10);
//     const hashedPassword = await bcryptjs.hash(password, salt);

//     // Create new user
//     const newUser = new User({
//       username,
//       email,
//       password: hashedPassword,
//     });

//     // Save user to database and log the saved user
//     const savedUser = await newUser.save();
//     console.log("User saved to MongoDB:", savedUser);

//     return NextResponse.json({
//       message: "User created successfully",
//       success: true,
//       savedUser,
//     });
//   } catch (error: any) {
//     console.error("Error saving user:", error);
//     return NextResponse.json(
//       { error: error.message },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/userModel";
import { connect } from "@/dbConfig/dbConfig";

// Connect to MongoDB
connect();

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { username, email, password, youtubeLink } = reqBody;

    console.log("Received signup data:", reqBody);

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      links: youtubeLink ? [{ url: youtubeLink }] : [],
    });

    // Save the user to the database
    const savedUser = await newUser.save();
    console.log("Saved User Data:", savedUser);

    // Return all the user data in the response
    return NextResponse.json({
      message: "User created successfully",
      user: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        links: savedUser.links,
      },
    });
  } catch (error: any) {
    console.error("Error during signup:", error);
    if (error.name === 'ValidationError') {
      console.error("Validation error details:", error.errors);
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}