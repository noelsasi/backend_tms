export async function GET(req) {
  try {
    // Step 1: Get the current user from the session
    const currentUser = await getUserFromSession(req)
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      )
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
    })

    // Step 3: Format the thesis data for the response
    const formattedTheses = theses.map(thesis => {
      let keywords = thesis.keywords

      // Check if the keywords are a string, and split it if needed
      if (typeof keywords === 'string') {
        keywords = keywords.split(',') // Convert CSV string into array (["CD", "CN"])
      } else if (Array.isArray(keywords)) {
        // If it's already an array, we keep it as is
      } else {
        // If it's not a string or an array, handle it as empty or default
        keywords = []
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
      }
    })

    // Step 4: Return the formatted thesis data as a JSON response
    return NextResponse.json(formattedTheses) // Success response
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Error fetching user's theses" },
      { status: 500 }
    ) // Internal Server Error
  }
}
import { withRolePermission } from '../../../lib/middleware'
import { NextResponse } from 'next/server' // Import NextResponse
import prisma from '../../../lib/db' // Importing the Prisma client
import { getUserFromSession } from '../../../lib/currentSesion' // For getting current session
import { z } from 'zod' // Zod for validation

// Schema for validating the incoming request body
const createThesisSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  keywords: z.string().optional(),
  abstract: z.string().optional(),
  document_url: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
})

// Handle POST request for submitting a thesis
export async function POST(req) {
  try {
    // Step 1: Get the current user from the session
    const currentUser = await getUserFromSession(req)

    // If the user is not authenticated, return 401
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Step 2: Parse and validate the request body
    let body = null
    try {
      body = await req.json()
    } catch (parseError) {
      // Handle malformed or empty body
      return NextResponse.json(
        { message: 'Request body is empty or malformed' },
        { status: 400 }
      )
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { message: 'Request body is empty or malformed' },
        { status: 400 }
      )
    }

    // Validate the parsed body using Zod schema
    const parsedBody = createThesisSchema.parse(body)

    // Step 3: Create the new thesis in the database
    const newThesis = await prisma.thesis.create({
      data: {
        title: parsedBody.title,
        author_id: currentUser.id, // Link the thesis to the current authenticated user
        category: parsedBody.category || 'Other', // Default to "Other" if no category provided
        keywords: parsedBody.keywords || '', // Store keywords as a CSV string
        abstract: parsedBody.abstract || '', // Default to empty string if no abstract
        document_url: parsedBody.document_url || '', // Default to empty string if no document URL
        status: parsedBody.status || 'Pending', // Default to "Pending" if no status provided
      },
    })

    // Step 4: Format the created thesis data for the response
    const thesisResponse = {
      thesis_id: newThesis.thesis_id.toString(),
      title: newThesis.title,
      author_name: currentUser.username, // Return the author's name (assumes username exists)
      category: newThesis.category,
      keywords: newThesis.keywords, // Already an array, no need to split
      abstract: newThesis.abstract,
      document_url: newThesis.document_url,
      status: newThesis.status,
      created_at: newThesis.created_at.toISOString(),
      updated_at: newThesis.updated_at.toISOString(),
    }

    // Step 5: Return the created thesis data as a response
    return NextResponse.json({
      message: 'Thesis created successfully',
      thesis: thesisResponse,
    })
  } catch (error) {
    console.error('Error submitting thesis:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      )
    }

    // Handle unexpected internal errors
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message || error },
      { status: 500 }
    )
  }
}
