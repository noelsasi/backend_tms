import { withRolePermission } from "../../../lib/middleware";
import { NextResponse } from "next/server"; // Import NextResponse
import prisma from "../../../lib/db"; // Importing the Prisma client
import { getUserFromSession } from "../../../lib/currentSesion"; // For getting current session
import { z } from "zod";

// Handle GET request
// app/api/theses/route.js
export async function GET(req) {
  try {
    // Step 1: Get the current user from the session
    const currentUser = await getUserFromSession(req);
    if (!currentUser) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    // Step 2: Fetch the user's theses based on their ID
    const theses = await prisma.thesis.findMany({
      where: {
        author_id: currentUser.id, // Fetch only the theses authored by the current user
      },
      select: {
        thesis_id: true,
        title: true,
        abstract: true,
        keywords: true,
        category: true,
        document_url: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Step 3: Format the thesis data for the response
    const formattedTheses = theses.map((thesis) => {
      let keywords = thesis.keywords;

      // Check if the keywords are a string, and split it if needed
      if (typeof keywords === "string") {
        keywords = keywords.split(","); // Convert CSV string into array (["CD", "CN"])
      } else if (Array.isArray(keywords)) {
        // If it's already an array, we keep it as is
      } else {
        // If it's not a string or an array, handle it as empty or default
        keywords = [];
      }

      return {
        thesis_id: thesis.thesis_id.toString(),
        title: thesis.title,
        abstract: thesis.abstract,
        keywords, // Now `keywords` will always be an array
        category: thesis.category,
        document_url: thesis.document_url,
        status: thesis.status,
        created_at: thesis.created_at.toISOString(), // Format to ISO string
        updated_at: thesis.updated_at.toISOString(),
      };
    });

    // Step 4: Return the formatted thesis data as a JSON response
    return NextResponse.json(formattedTheses); // Success response
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching user's theses" },
      { status: 500 }
    ); // Internal Server Error
  }
}
const createThesisSchema = z.object({
  title: z.string().min(1), // Title is required
  category: z.string().optional(), // Category is optional
  keywords: z.array(z.string()).optional(), // Array of strings for keywords (optional)
  abstract: z.string().optional(), // Abstract is optional
  document_url: z.string().optional(), // Document URL is optional
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"), // Default status is "Pending"
});

export async function POST(req) {
  try {
    // Step 1: Get the current user from the session
    const currentUser = await getUserFromSession(req);
    if (!currentUser) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    // Step 2: Ensure that the body is not null or malformed
    let body = null;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        { message: "Request body is empty or malformed" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { message: "Request body is empty or malformed" },
        { status: 400 }
      );
    }

    // Step 3: Parse and validate the request body using Zod
    const parsedBody = createThesisSchema.parse(body);

    // Step 4: Create the new thesis in the database
    const newThesis = await prisma.thesis.create({
      data: {
        title: parsedBody.title,
        author_id: currentUser.id, // Link the thesis to the current authenticated user
        category: parsedBody.category || "Other", // Default to "Other" if no category provided
        keywords: parsedBody.keywords ? parsedBody.keywords.join(",") : "", // Store keywords as a CSV string
        abstract: parsedBody.abstract || "", // Default to empty string if no abstract
        document_url: parsedBody.document_url || "", // Default to empty string if no document URL
        status: parsedBody.status, // Status provided in the request
      },
    });

    // Step 5: Format the created thesis data for the response
    const thesisResponse = {
      thesis_id: newThesis.thesis_id.toString(),
      title: newThesis.title,
      author_name: currentUser.username, // Return the author's name (assumes username exists)
      category: newThesis.category,
      keywords: newThesis.keywords.split(","), // Convert the CSV string back into an array
      abstract: newThesis.abstract,
      document_url: newThesis.document_url,
      status: newThesis.status,
      created_at: newThesis.created_at.toISOString(),
      updated_at: newThesis.updated_at.toISOString(),
    };

    // Step 6: Return the created thesis data as a response
    return NextResponse.json({
      message: "Thesis created successfully",
      thesis: thesisResponse,
    });
  } catch (error) {
    console.error("Error submitting thesis:", error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }

    // Internal server error
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message || error },
      { status: 500 }
    );
  }
}
