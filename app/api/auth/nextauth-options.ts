// import NextAuth, { AuthOptions } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcryptjs";
// import User from "@/models/userModel";
// import { connect } from "@/dbConfig/dbConfig";

// // Define the NextAuth options
// export const authOptions: AuthOptions = {
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials?.password) {
//           throw new Error("Email and password are required.");
//         }

//         await connect();

//         const user = await User.findOne({ email: credentials.email });

//         if (!user) {
//           throw new Error("Invalid email or password.");
//         }

//         const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
//         if (!isPasswordValid) {
//           throw new Error("Invalid email or password.");
//         }

//         return { id: user._id.toString(), email: user.email, role: user.role };
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;

//         token.email = user.email;
//         // @ts-ignore
//         token.role = user.role;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (token && session.user) {
//         // @ts-ignore
//         session.user.id = token.id as string;
//         session.user.email = token.email as string;
//         // @ts-ignore
//         session.user.role = token.role as string;
//       }
//       return session;
//     },
//   },
//   pages: {
//     signIn: "/login",
//   },
//   session: {
//     strategy: "jwt",
//     maxAge: 60 * 60, // 1 hour
//   },
//   secret: process.env.NEXTAUTH_SECRET,
// };

// // Create the GET and POST handlers for NextAuth
// const handler = NextAuth(authOptions);

// // Export GET and POST handlers
// export { handler as GET, handler as POST };



import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import User from "@/models/userModel"; // Your MongoDB User Model
import { connect } from "@/dbConfig/dbConfig"; // Your DB connection logic
import { NextAuthOptions } from "next-auth";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google OAuth environment variables.");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connect(); // Connect to the database

        // Hardcoded admin credentials
        const adminEmail = "admin@gmail.com";
        const adminPassword = "123456";

        if (credentials?.email === adminEmail && credentials?.password === adminPassword) {
          return { id: "1", email: adminEmail, role: "admin" };
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        const user = await User.findOne({ email: credentials.email });
        if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
          throw new Error("Invalid email or password.");
        }

        return { id: user._id.toString(), email: user.email, role: user.role };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; // Assert that user has a `role` property
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
        role: token.role as string,
      };
      return session;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl + "/dashboard";
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.JWT_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
