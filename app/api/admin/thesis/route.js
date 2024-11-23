import { NextResponse } from 'next/server'
import prisma from '@/app/lib/db' // Importing Prisma client
import { withRolePermission } from '@/app/lib/middleware' // Middleware for role-based access
import { getUserFromSession } from '@/app/lib/currentSesion' // Get user session
import { z } from 'zod'

// Define GET route to fetch all theses with their details
export const GET = async req => {
  try {
    // Fetch all theses with related views, downloads, and votes
    const theses = await prisma.thesis.findMany({
      include: {
        views: true, // Include views related to this thesis
        downloads: true, // Include downloads related to this thesis
        ThesisVote: true, // Include votes to count upvotes and downvotes
      },
    })

    const authorName = async author_id => {
      const author = await prisma.user.findUnique({
        where: { id: BigInt(author_id) },
      })

      console.log('Author ID:', author_id)
      console.log('Author:', author.firstname, author.lastname)
      return author ? `${author.firstname} ${author.lastname}` : 'Unknown'
    }

    const thesesResponse = await Promise.all(
      theses.map(async thesis => {
        const upvotes = thesis.ThesisVote.filter(
          vote => vote.vote_type === 'UPVOTE'
        ).length
        const downvotes = thesis.ThesisVote.filter(
          vote => vote.vote_type === 'DOWNVOTE'
        ).length

        const author_name = await authorName(thesis.author_id)
        let reviewer_name = null
        if (thesis.reviewer_id) {
          reviewer_name = await authorName(thesis.reviewer_id)
        }

        return {
          thesis_id: thesis.thesis_id.toString(),
          title: thesis.title,
          abstract: thesis.abstract,
          keywords: thesis.keywords.replace(/['"\\]/g, ''),
          status: thesis.status,
          document_url: thesis.document_url,
          upvotes,
          downvotes,
          views_count: thesis.views.length,
          downloads_count: thesis.downloads.length,
          created_at: thesis.created_at.toISOString(),
          updated_at: thesis.updated_at.toISOString(),
          author_id: thesis.author_id.toString(),
          category: thesis.category,
          author_name,
          reviewer_id: thesis.reviewer_id?.toString() || null,
          reviewer_name,
        }
      })
    )

    // Return the list of theses along with views, downloads, upvotes, and downvotes
    return NextResponse.json(thesesResponse)
  } catch (error) {
    console.error('Error fetching theses:', error)
    return NextResponse.json(
      { message: 'Error fetching theses', error: error.message || error },
      { status: 500 }
    )
  }
}

// Define the schema for validating the POST request body
const createThesisSchema = z.object({
  title: z.string().min(1),
  author_id: z.string().min(1),
  category: z.string(),
  keywords: z.string(),
  abstract: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  document_url: z.string().url().optional(),
  reviewer_id: z.string().optional(),
})

export const POST = withRolePermission('CREATE_THESIS')(async req => {
  try {
    const body = await req.json()

    if (!body) {
      return NextResponse.json(
        { message: 'Request body is empty or malformed' },
        { status: 400 }
      )
    }

    // Step 1: Validate the request body
    const parsedBody = createThesisSchema.parse(body)

    // Step 3: Create the thesis record
    const newThesis = await prisma.thesis.create({
      data: {
        title: parsedBody.title,
        category: parsedBody.category,
        keywords: parsedBody.keywords,
        abstract: parsedBody.abstract,
        document_url: parsedBody.document_url,
        status: parsedBody.status,
        author: {
          connect: {
            id: BigInt(parsedBody.author_id),
          },
        },
      },
    })

    // When sending the response, remove the JSON.parse since it's already an array
    const thesisResponse = {
      thesis_id: newThesis.thesis_id.toString(),
      title: newThesis.title,
      author_id: newThesis.author_id.toString(),
      document_url: newThesis.document_url,
      category: newThesis.category,
      keywords: newThesis.keywords, // Already an array, no need to parse
      abstract: newThesis.abstract,
      status: newThesis.status,
      created_at: newThesis.created_at.toISOString(),
      updated_at: newThesis.updated_at.toISOString(),
    }

    const currentUser = await getUserFromSession(req)

    // Step 5: Log the action in the history (optional)
    await prisma.history.create({
      data: {
        user_id: currentUser.id,
        action: 'Created Thesis',
        description: `Thesis titled "${newThesis.title}" created by ${currentUser.email}`,
      },
    })

    // Step 6: Return the created thesis information
    return NextResponse.json({
      message: 'Thesis created successfully',
      thesis: thesisResponse,
    })
  } catch (error) {
    console.error('Error creating thesis:', error.message || error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message || error },
      { status: 500 }
    )
  }
})

