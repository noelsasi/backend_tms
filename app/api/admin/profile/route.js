// import { NextResponse } from "next/server";
// import prisma from "../../../lib/db"; // Prisma client
// import { getUserFromSession } from "../../../lib/currentSesion"; // Assuming this is where you get the user from session

// export const GET = async (req) => {
//   try {
//     // Step 1: Fetch the user from the session
//     console.log("Fetching user from session...");
//     const user = await getUserFromSession(req);
//     console.log("Session user:", user);

//     if (!user || !user.id) {
//       // If no user is found in session or user.id is missing, return 401 Unauthorized
//       console.error("User not found or not authenticated. User:", user);
//       return NextResponse.json(
//         { message: "User not found or not authenticated" },
//         { status: 401 }
//       );
//     }

//     // Step 2: Fetch the profile data for the authenticated user
//     console.log(`Fetching profile for user with ID: ${user.id}`);
//     const profile = await prisma.user.findUnique({
//       where: { id: user.id },
//       select: {
//         firstname: true,
//         lastname: true,
//         dob: true,
//         gender: true,
//         phone: true,
//         email: true,
//         created_at: true, // This represents the "Joined" date
//         address: true,
//         profilePic: true,
//         role: {
//           select: {
//             role_name: true, // Including the role name
//           },
//         },
//         theses: {
//           select: {
//             title: true,
//             thesis_id: true,
//           },
//         },
//         downloads: {
//           select: {
//             thesis_id: true, // Number of downloads associated with the user's theses
//           },
//         },
//       },
//     });

//     // Log the profile data (if fetched)
//     console.log("Profile data fetched:", profile);

//     if (!profile) {
//       // If profile is not found in the database, return 404 Not Found
//       console.error(`Profile not found for user with ID: ${user.id}`);
//       return NextResponse.json(
//         { message: "Profile not found" },
//         { status: 404 }
//       );
//     }

//     // Step 3: Calculate the number of theses and downloads
//     const downloadsCount = profile.downloads ? profile.downloads.length : 0;
//     const thesesCount = profile.theses ? profile.theses.length : 0;

//     // Log the counts
//     console.log("Theses count:", thesesCount);
//     console.log("Downloads count:", downloadsCount);

//     // Step 4: Return the profile data along with calculated counts
//     return NextResponse.json({
//       firstName: profile.firstName,
//       lastName: profile.lastName,
//       dob: profile.dob,
//       gender: profile.gender,
//       phone: profile.phone,
//       email: profile.email,
//       joined: profile.created_at.toISOString(),
//       role: profile.role.role_name, // Include role name
//       thesesCount: thesesCount, // Number of theses authored by the user
//       downloadsCount: downloadsCount, // Number of downloads associated with the user's theses
//       address: profile.address,
//       profilePic: profile.profilePic, // Optional, if available
//     });
//   } catch (error) {
//     // Step 5: Handle errors properly
//     if (error && error instanceof Error) {
//       console.error("Error fetching profile:", error.message);
//       console.error("Error stack trace:", error.stack);
//     } else {
//       console.error("Unexpected error:", error);
//     }

//     // Standardized error response
//     const errorResponse = {
//       message: "Internal Server Error",
//       error: error instanceof Error ? error.message : "Unknown error",
//     };

//     return NextResponse.json(errorResponse, { status: 500 });
//   }
// };
import { NextResponse } from "next/server";
import prisma from "../../../lib/db"; // Prisma client
import { getUserFromSession } from "../../../lib/currentSesion"; // Assuming this is where you get the user from session

export const GET = async (req) => {
  try {
    // Step 1: Fetch the user from the session
    console.log("Fetching user from session...");
    const user = await getUserFromSession(req);
    console.log("Session user:", user);

    if (!user || !user.id) {
      // If no user is found in session or user.id is missing, return 401 Unauthorized
      console.error("User not found or not authenticated. User:", user);
      return NextResponse.json(
        { message: "User not found or not authenticated" },
        { status: 401 }
      );
    }

    // Step 2: Fetch the profile data for the authenticated user
    console.log(`Fetching profile for user with ID: ${user.id}`);
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstname: true,
        lastname: true,
        dob: true,
        gender: true,
        phone: true,
        email: true,
        created_at: true, // This represents the "Joined" date
        address: true,
        profilePic: true,
        role: {
          select: {
            role_name: true, // Including the role name
          },
        },
        theses: {
          select: {
            thesis_id: true,
            title: true,
            downloads: {
              select: {
                id: true, // Count the number of downloads for each thesis
              },
            },
          },
        },
      },
    });

    // Log the profile data (if fetched)
    console.log("Profile data fetched:", profile);

    if (!profile) {
      // If profile is not found in the database, return 404 Not Found
      console.error(`Profile not found for user with ID: ${user.id}`);
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 }
      );
    }

    // Step 3: Calculate the number of theses and downloads
    const downloadsCount = profile.theses.reduce((total, thesis) => {
      return total + (thesis.downloads ? thesis.downloads.length : 0);
    }, 0);

    const thesesCount = profile.theses.length;

    // Log the counts
    console.log("Theses count:", thesesCount);
    console.log("Downloads count:", downloadsCount);

    // Step 4: Return the profile data along with calculated counts
    return NextResponse.json({
      firstName: profile.firstname,
      lastName: profile.lastname,
      dob: profile.dob,
      gender: profile.gender,
      phone: profile.phone,
      email: profile.email,
      joined: profile.created_at.toISOString(),
      role: profile.role.role_name, // Include role name
      thesesCount: thesesCount, // Number of theses authored by the user
      downloadsCount: downloadsCount, // Number of downloads associated with the user's theses
      address: profile.address,
      profilePic: profile.profilePic, // Optional, if available
    });
  } catch (error) {
    // Step 5: Handle errors properly
    if (error && error instanceof Error) {
      console.error("Error fetching profile:", error.message);
      console.error("Error stack trace:", error.stack);
    } else {
      console.error("Unexpected error:", error);
    }

    // Standardized error response
    const errorResponse = {
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
};
