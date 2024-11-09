// import { NextResponse } from "next/server";
// import prisma from "../../../lib/db";

// export  async function GET(req, res) {
//   if (req.method === "GET") {
//     console.log("is  ",req.nextUrl.searchParams.toString());
//     const token = req.nextUrl.searchParams.get("token");
//     console.log(token);
//     // Ensure the token is provided
//     if (!token) {
//       return NextResponse.json({ error: "Token is required" }, { status: 400 });
//     }

//     try {
//       // Look for the user with this verification token
//       const user = await prisma.user.findUnique({
//         where: { verificationToken: token },
//       });

//       // If no user is found or token is expired, return error
//       if (!user || new Date(user.verificationTokenExpires) < new Date()) {
//         return NextResponse.json({ error: "Invalid token" }, { status: 400 });
//       }

//       // Mark user as verified by updating the user record in the database
//       await prisma.user.update({
//         where: { id: user.id },
//         data: {
//           emailVerified: new Date(), // Set the current date as email verified date
//           verificationToken: null,   // Clear the verification token
//           verificationTokenExpires: null, // Clear the token expiry date
//         },
//       });

//       return NextResponse.json({ message: "Email verified successfully" }, { status: 200 });
//     } catch (error) {
//       console.error("Error verifying email:", error);
//       return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//     }
//   } else {
//     // If the method is not GET, return Method Not Allowed
//     NextResponse.json({ error: "Method not allowed" }, { status: 405 });
//   }
// }
// import { NextResponse } from "next/server";
// import prisma from "../../../lib/db";

// export async function GET(req) {
//   try {
//     const token = req.query.token;
// if (!token) {
//     return NextResponse.json({ error: "Token missing" }, { status: 400 });
// }
//     // const token = req.nextUrl.searchParams.get("token");
//     // console.log("Received Token:", token);  // Debugging log to check token value

//     // Check if token exists
//     if (!token) {
//       const errorPayload = { error: "Token is required" };
//       console.log("Error Payload (Token Missing):", errorPayload); // Log the error payload
//       return NextResponse.json(errorPayload, { status: 400 });
//     }
//     console.log("after token")

//     // Look for the user with this verification token
//     try {const user = await prisma.user.findUnique({
//       where: { verificationToken: token },
//     });

//     console.log("User found:", user); 
      
//     } catch (error) {
//       console.log("Error finding user:", error);
//       const errorPayload = { error: "Internal server error (User not found)" };
//       console.log("Error Payload (Internal Error): user ", errorPayload); // Log the error payload
//       return NextResponse.json(errorPayload, { status: 500 });
      
//     }
//      // Log user details for debugging

//     // If no user found
//     if (!user) {
//       const errorPayload = { error: "User not found" };
//       console.log("Error Payload (User Not Found):", errorPayload); // Log the error payload
//       return NextResponse.json(errorPayload, { status: 404 });
//     }
//     console.log("after user")

//     // If token is expired
//     if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
//       const errorPayload = { error: "Token expired" };
//       console.log("Error Payload (Token Expired):", errorPayload); // Log the error payload
//       return NextResponse.json(errorPayload, { status: 400 });
//     }

//     // Mark the user as verified
//     const updatedUser = await prisma.user.update({
//       where: { id: user.id },
//       data: {
//         emailVerified: new Date(),
//         verificationToken: null,
//         verificationTokenExpires: null,
//       },
//     });

//     console.log("User updated successfully:", updatedUser);  // Log updated user

//     // Ensure the response payload is always an object and not null or undefined
//     const responsePayload = { message: "Email verified successfully" };
//     console.log("Response Payload (Success):", responsePayload); // Log response payload
//     return NextResponse.json(responsePayload, { status: 200 });
//   } catch (error) {
//     // Log the detailed error for debugging
//     console.error("Error verifying email:", error);

//     // Ensure that the error response payload is an object
//     const errorPayload = {
//       error: "Internal server error",
//       details: error.message || error.toString(),
//     };

//     // Log the error payload before returning
//     console.log("Error Payload (Internal Error):", errorPayload); // Log error payload
//     return NextResponse.json(errorPayload, { status: 500 });
//   }
// }
import { NextResponse } from "next/server";
import prisma from "../../../lib/db";

export async function GET(req) {
  try {
    // Extract token from the query string using nextUrl.searchParams
    const token = req.nextUrl.searchParams.get("token");

    // Validate token presence
    if (!token) {
      const errorPayload = { error: "Token is required" };
      console.log("Error Payload (Token Missing):", errorPayload); // Log the error payload
      return NextResponse.json(errorPayload, { status: 400 });
    }

    console.log("Token received:", token); // Log the received token for debugging

    // Look for the user with this verification token
    let user;
    try {
      user = await prisma.user.findFirst({
        where: { verificationToken: token },
      });

      console.log("User found:", user); // Log user details for debugging
    } catch (error) {
      // Safely log the error message to avoid logging undefined
      console.error("Error finding user:", error.message || error.toString());

      const errorPayload = { error: "Internal server error (User not found)" };
      console.log("Error Payload (Internal Error):", errorPayload); // Log the error payload
      return NextResponse.json(errorPayload, { status: 500 });
    }

    // If no user is found with the given token
    if (!user) {
      const errorPayload = { error: "User not found" };
      console.log("Error Payload (User Not Found):", errorPayload); // Log the error payload
      return NextResponse.json(errorPayload, { status: 404 });
    }

    console.log("After user check");

    // If the token is expired
    if (user.verificationTokenExpires && new Date(user.verificationTokenExpires) < new Date()) {
      const errorPayload = { error: "Token expired" };
      console.log("Error Payload (Token Expired):", errorPayload); // Log the error payload
      return NextResponse.json(errorPayload, { status: 400 });
    }

    // Mark the user as verified and clear the verification token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null,
        verificationTokenExpires: null,
      },
    });

    console.log("User updated successfully:", updatedUser); // Log updated user

    // Prepare and send the successful response payload
    const responsePayload = { message: "Email verified successfully" };
    console.log("Response Payload (Success):", responsePayload); // Log the response payload
    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    // Log the detailed error for debugging
    console.error("Error verifying email:", error.message || error.toString());

    // Ensure that the error response payload is an object
    const errorPayload = {
      error: "Internal server error",
      details: error.message || error.toString(),
    };

    // Log the error payload before returning
    console.log("Error Payload (Internal Error):", errorPayload); // Log error payload
    return NextResponse.json(errorPayload, { status: 500 });
  }
}
