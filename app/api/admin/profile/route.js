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
import { NextResponse } from 'next/server'
import prisma from '../../../lib/db' // Prisma client
import { getUserFromSession } from '../../../lib/currentSesion'
import { z } from 'zod'
import { withRolePermission } from '../../../lib/middleware'
const createUserSchema = z.object({
  email: z.string().email(), // Validate email format
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  gender: z.enum(['Male', 'Female', 'Other']), // Gender validation
  dob: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }), // Validate date format
  phone: z.string().min(10).max(15), // Validate phone length
  address: z.string().min(1),
  profilePic: z.string().url().optional(), // Profile picture (optional)
  // Role validation
})
export const GET = async req => {
  try {
    // Step 1: Fetch the user from the session
    console.log('Fetching user from session...')
    const user = await getUserFromSession(req)
    console.log('Session user:', user)

    if (!user || !user.id) {
      // If no user is found in session or user.id is missing, return 401 Unauthorized
      console.error('User not found or not authenticated. User:', user)
      return NextResponse.json(
        { message: 'User not found or not authenticated' },
        { status: 401 }
      )
    }

    // Step 2: Fetch the profile data for the authenticated user
    console.log(`Fetching profile for user with ID: ${user.id}`)
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
    })

    // Log the profile data (if fetched)
    console.log('Profile data fetched:', profile)

    if (!profile) {
      // If profile is not found in the database, return 404 Not Found
      console.error(`Profile not found for user with ID: ${user.id}`)
      return NextResponse.json(
        { message: 'Profile not found' },
        { status: 404 }
      )
    }

    // Step 3: Calculate the number of theses and downloads
    const downloadsCount = profile.theses.reduce((total, thesis) => {
      return total + (thesis.downloads ? thesis.downloads.length : 0)
    }, 0)

    const thesesCount = profile.theses.length

    // Log the counts
    console.log('Theses count:', thesesCount)
    console.log('Downloads count:', downloadsCount)

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
    })
  } catch (error) {
    // Step 5: Handle errors properly
    if (error && error instanceof Error) {
      console.error('Error fetching profile:', error.message)
      console.error('Error stack trace:', error.stack)
    } else {
      console.error('Unexpected error:', error)
    }

    // Standardized error response
    const errorResponse = {
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
export const POST = withRolePermission('UPDATE_PROFILE')(async req => {
  let body

  try {
    // Step 1: Parse incoming request body
    body = await req.json()

    if (!body) {
      return NextResponse.json(
        { message: 'Request body is empty or malformed' },
        { status: 400 }
      )
    }

    // Step 2: Validate the request body with Zod schema
    const parsedBody = createUserSchema.parse(body) // Throws error if validation fails
    const currentUser = await getUserFromSession(req)

    // Step 3: Check if email already exists in the database, excluding current user's email
    // const existingUser = await prisma.user.findUnique({
    //   where: { email: parsedBody.email },
    // })

    // Only return an error if the email is already in use and it's not the current user's email
    // if (existingUser && existingUser.id !== currentUser.id) {
    //   return NextResponse.json(
    //     { message: "Email already in use" },
    //     { status: 400 }
    //   );
    // }

    // Step 4: Update the user in the database
    const user = await prisma.user.update({
      where: { id: currentUser.id }, // Update the current user's profile
      data: {
        email: parsedBody.email,
        firstname: parsedBody.firstname,
        lastname: parsedBody.lastname,
        gender: parsedBody.gender,
        dob: new Date(parsedBody.dob), // Convert string date to Date object
        phone: parsedBody.phone,
        address: parsedBody.address,
        profilePic: parsedBody.profilePic || '', // Optional field, default to empty string if not provided
      },
    })

    // Step 5: Create history entry for this update action
    await prisma.history.create({
      data: {
        user_id: currentUser.id, // ID of the admin or user performing the action
        action: 'Updated Profile', // Action description
        description: `User with email ${user.email} updated by ${currentUser.email}`, // Description
      },
    })

    // Step 6: Respond with the updated user data (excluding password_hash)
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    })
  } catch (error) {
    // Step 7: Handle errors and provide detailed responses
    console.error('Error during user update:', error.message || error)

    if (error instanceof z.ZodError) {
      // If validation fails, return a detailed validation error
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      )
    }

    // If an unknown error occurs, return internal server error
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message || error },
      { status: 500 }
    )
  }
})
