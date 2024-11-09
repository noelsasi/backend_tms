// import { getServerSession } from "next-auth";
// import { authOptions } from "../api/auth/[...nextauth]/route";

// export const getUserFromSession = async (req) => {
//   try {
//     // Get the session from NextAuth.js
//     const session = await getServerSession(authOptions, req);
//     if (!session) {
//       throw new Error("User is not authenticated");
//     }

//     // Return user data from session
//     return session.user; // or session.user.id if you just need the user id
//   } catch (err) {
//     console.error("Error getting user from session:", err);
//     throw new Error("Failed to get user data from session");
//   }
// };

import { authOptions } from "../api/auth/[...nextauth]/route";
import { getToken } from "next-auth/jwt";

export const getUserFromSession = async (req) => {
  try {
    // Use only the request object to fetch the session
    const token = await getToken({ req, secret: authOptions.secret });

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: "Unauthorized: No session found" }),
        { status: 401 }
      );
    }

    const user = token.user;
    return user;
    // Or session.user.id if you only need the user ID
  } catch (err) {
    console.error("Error getting user from session:", err);
    throw new Error("Failed to get user data from session");
  }
};
