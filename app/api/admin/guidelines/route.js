// // /app/api/admin/guidelines/index.js

// import { withRolePermission } from "../../../lib/middleware";
// import { NextResponse } from "next/server";
// import prisma from "../../../lib/db"; // Importing Prisma client
// import { z } from "zod"; // For validation
// import { getUserFromSession } from "../../../lib/currentSesion";

// // Zod schema for validating the request body for guideline creation
// const createGuidelineSchema = z.object({
//   title: z.string().min(1),
//   description: z.string().min(1),
//   fileUrl: z.string().url().optional(), // Optional file URL
// });

// // Handle GET request to fetch all guidelines
// export async function GET(req) {
//   try {
//     const guidelines = await prisma.guidelines.findMany({
//       include: {
//         user: { // Assuming user is related to the guideline (added by field)
//           select: {
//             username: true,
//           },
//         },
//       },
//     });

//     const formattedGuidelines = guidelines.map((guideline) => ({
//       id: guideline.id.toString(),
//       title: guideline.title,

//       description: guideline.description,
//       fileUrl: guideline.fileUrl,
//       addedBy: guideline.user.username,
//       createdAt: guideline.createdAt,
//     }));

//     return NextResponse.json(formattedGuidelines); // Return the guidelines data
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ message: "Error fetching guidelines" }, { status: 500 });
//   }
// }

// // Handle POST request to create a new guideline
// export const POST = withRolePermission("CREATE_GUIDELINE")(async (req) => {
//   try {
//     const body = await req.json();
    
//     if (!body) {
//       return NextResponse.json({ message: "Request body is empty or malformed" }, { status: 400 });
//     }

//     // Validate request body
//     const parsedBody = createGuidelineSchema.parse(body);

//     const currentUser = await getUserFromSession(req);

//     // Check if guideline already exists (optional)
//     const existingGuideline = await prisma.guidelines.findUnique({
//       where: {
//         title: parsedBody.title, // Check by title, assuming guidelines should have unique titles
//       },
//     });

//     if (existingGuideline) {
//       return NextResponse.json({ message: "Guideline with this title already exists" }, { status: 400 });
//     }

//     // Create a new guideline
//     const newGuideline = await prisma.guidelines.create({
//       data: {
//         title: parsedBody.title,
//         description: parsedBody.description,
//         file_url: parsedBody.fileUrl || "", // Optional file URL
//         user_id: currentUser.id, // Assuming `userId` is the user creating the guideline
//       },
//     });
//       const guidelineResponse = {
//       ...newGuideline,
//       user_id: newGuideline.user_id.toString(),
//     };
//  await prisma.history.create({
//       data: {
//         user_id: currentUser.id, // The ID of the user who performed the action
//         action: "Created Guideline",
//         description: `Guideline titled "${newGuideline.title}" created by ${currentUser.email}`,
//       },
//     });
//     return NextResponse.json({
//       message: "Guideline created successfully",
//       guideline: guidelineResponse,
//     });
//   } catch (error) {
//     console.error("Error during guideline creation:", error.message || error);

//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
//     }

//     return NextResponse.json({ message: "Internal Server Error", error: error.message || error }, { status: 500 });
//   }
// });
// /app/api/admin/guidelines/route.js

// import { withRolePermission } from "../../../lib/middleware"; 
// import { NextResponse } from "next/server";
// import prisma from "../../../lib/db"; // Importing Prisma client
// import { z } from "zod"; // For validation
// import { getUserFromSession } from "../../../lib/currentSesion";

// // Zod schema for validating the request body for guideline creation
// const createGuidelineSchema = z.object({
//   title: z.string().min(1), // Title must be a non-empty string
//   description: z.string().min(1), // Description must be a non-empty string
//   fileUrl: z.string().url().optional(), // Optional file URL (must be a valid URL if provided)
// });

// // Handle GET request to fetch all guidelines
// export async function GET(req) {
//   try {
//     // Fetch guidelines with the associated user (who added the guideline)
//     const guidelines = await prisma.guidelines.findMany({
//       include: {
//         user: { // Assuming the guideline is associated with a user (added by)
//           select: {
//             username: true, // Only include username of the user who created the guideline
//           },
//         },
//       },
//     });

//     // Format the fetched guidelines for response
//     const formattedGuidelines = guidelines.map((guideline) => ({
//       id: guideline.id.toString(), // Convert BigInt to string
//       title: guideline.title,
//       description: guideline.description,
//       fileUrl: guideline.file_url,
//       addedBy: guideline.user.username, // Display the username of the user who added the guideline
//       createdAt: guideline.created_at, // Show the creation date
//     }));

//     // Return the formatted list of guidelines as JSON
//     return NextResponse.json(formattedGuidelines);
//   } catch (error) {
//     console.error("Error fetching guidelines:", error);
//     return NextResponse.json({ message: "Error fetching guidelines" }, { status: 500 });
//   }
// }

// // Handle POST request to create a new guideline
// export const POST = withRolePermission("CREATE_GUIDELINE")(async (req) => {
//   try {
//     // Parse the request body
//     const body = await req.json();
    
//     // If the body is empty or malformed, return an error response
//     if (!body) {
//       return NextResponse.json({ message: "Request body is empty or malformed" }, { status: 400 });
//     }

//     // Validate the incoming request body using Zod schema
//     const parsedBody = createGuidelineSchema.parse(body);

//     // Get the current user from session
//     const currentUser = await getUserFromSession(req);

//     // Check if a guideline with the same title already exists (optional step)
//     const existingGuideline = await prisma.guidelines.findUnique({
//       where: {
//         title: parsedBody.title, // Check for an existing guideline by title
//       },
//     });

//     if (existingGuideline) {
//       return NextResponse.json({ message: "Guideline with this title already exists" }, { status: 400 });
//     }

//     // Create the new guideline entry in the database
//     const newGuideline = await prisma.guidelines.create({
//       data: {
//         title: parsedBody.title,
//         description: parsedBody.description,
//         file_url: parsedBody.fileUrl || "", // Optional file URL (if not provided, set to an empty string)
//         user_id: currentUser.id, // Set the user who created the guideline
//       },
//     });

//     // Convert BigInt to string before sending the response (since JSON does not support BigInt)
//     const guidelineResponse = {
//       ...newGuideline,
//       // user_id: newGuideline.user_id.toString(), // Convert BigInt to string
//       created_at: newGuideline.created_at.toISOString(), // Convert Date to ISO string for compatibility
//       updated_at: newGuideline.updated_at.toISOString(), // Convert Date to ISO string for compatibility
//     };

//     // Record the action in the history table (audit trail)
//     await prisma.history.create({
//       data: {
//         user_id: currentUser.id, // The ID of the user who performed the action
//         action: "Created Guideline", // Action description
//         description: `Guideline titled "${newGuideline.title}" created by ${currentUser.email}`, // Detailed description
//       },
//     });

//     // Return a success response with the created guideline details
//     return NextResponse.json({
//       message: "Guideline created successfully",
//       guideline: guidelineResponse,
//     });
//   } catch (error) {
//     console.error("Error during guideline creation:", error.message || error);

//     // If Zod validation fails, return the validation errors
//     if (error instanceof z.ZodError) {
//       return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
//     }

//     // Return a generic error message if an unknown error occurs
//     return NextResponse.json({ message: "Internal Server Error", error: error.message || error }, { status: 500 });
//   }
// });
// Handle POST request to create a new guideline

import { withRolePermission } from "../../../lib/middleware"; 
import { NextResponse } from "next/server";
import prisma from "../../../lib/db"; // Importing Prisma client
import { z } from "zod"; // For validation
import { getUserFromSession } from "../../../lib/currentSesion";
const createGuidelineSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    file_url: z.string().url().optional(), // Optional file URL
  });

  export async function GET(req) {
  try {
    // Fetch guidelines with the associated user (who added the guideline)
    const guidelines = await prisma.guidelines.findMany({
      include: {
        user: { // Assuming the guideline is associated with a user (added by)
          select: {
            username: true, // Only include username of the user who created the guideline
          },
        },
      },
    });

    // Format the fetched guidelines for response
    const formattedGuidelines = guidelines.map((guideline) => ({
      id: guideline.id.toString(), // Convert BigInt to string
      title: guideline.title,
      description: guideline.description,
      fileUrl: guideline.file_url,
      addedBy: guideline.user.username, // Display the username of the user who added the guideline
      createdAt: guideline.created_at, // Show the creation date
    }));

    // Return the formatted list of guidelines as JSON
    return NextResponse.json(formattedGuidelines);
  } catch (error) {
    console.error("Error fetching guidelines:", error);
    return NextResponse.json({ message: "Error fetching guidelines" }, { status: 500 });
  }
}
export const POST = withRolePermission("CREATE_GUIDELINE")(async (req) => {
  try {
    // Parse the request body
    const body = await req.json();
    
    // If the body is empty or malformed, return an error response
    if (!body) {
      return NextResponse.json({ message: "Request body is empty or malformed" }, { status: 400 });
    }

    // Validate the incoming request body using Zod schema
    const parsedBody = createGuidelineSchema.parse(body);

    // Get the current user from session
    const currentUser = await getUserFromSession(req);

    // Check if a guideline with the same title already exists (optional step)
    const existingGuideline = await prisma.guidelines.findUnique({
      where: {
        title: parsedBody.title, // Check for an existing guideline by title
      },
    });

    if (existingGuideline) {
      return NextResponse.json({ message: "Guideline with this title already exists" }, { status: 400 });
    }

    // Create the new guideline entry in the database
    const newGuideline = await prisma.guidelines.create({
      data: {
        title: parsedBody.title,
        description: parsedBody.description,
        file_url: parsedBody.file_url || "", // Optional file URL (if not provided, set to an empty string)
        user_id: currentUser.id, // Set the user who created the guideline
      },
    });

    // Manually convert BigInt fields to strings before sending response
    const guidelineResponse = {
      id: newGuideline.id.toString(), // Convert BigInt to string
      title: newGuideline.title,
      description: newGuideline.description,
      fileUrl: newGuideline.file_url,
      created_at: newGuideline.created_at.toISOString(), // Convert Date to ISO string for compatibility
      updated_at: newGuideline.updated_at.toISOString(), // Convert Date to ISO string for compatibility
      user_id: newGuideline.user_id.toString(), // Convert BigInt to string
    };

    // Record the action in the history table (audit trail)
    await prisma.history.create({
      data: {
        user_id: currentUser.id, // The ID of the user who performed the action
        action: "Created Guideline", // Action description
        description: `Guideline titled "${newGuideline.title}" created by ${currentUser.email}`, // Detailed description
      },
    });

    // Return a success response with the created guideline details
    return NextResponse.json({
      message: "Guideline created successfully",
      guideline: guidelineResponse,
    });
  } catch (error) {
    console.error("Error during guideline creation:", error.message || error);

    // If Zod validation fails, return the validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
    }

    // Return a generic error message if an unknown error occurs
    return NextResponse.json({ message: "Internal Server Error", error: error.message || error }, { status: 500 });
  }
});
  