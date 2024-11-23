import { withRolePermission } from '@/app/lib/middleware'
import { NextResponse } from 'next/server'
import prisma from '@/app/lib/db' // Import Prisma client
import { getUserFromSession } from '@/app/lib/currentSesion' // Get user from session
import { z } from 'zod' // Zod for validation

// Schema to validate the incoming request body
const updateThesisSchema = z.object({
  title: z.string().min(1).optional(), // Optional for update
  author_id: z.string().min(1).optional(), // Optional, but we'll use it to find the author
  category: z.string().optional(),
  keywords: z.string().optional(), // Array of strings for keywords
  abstract: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'deleted']).optional(),
  document_url: z.string().url().optional(),
  reviewer_id: z.string().optional(), // Optional, but we'll use it to find the reviewer
})

export const PUT = withRolePermission('MODIFY_THESIS')(
  async (req, { params }) => {
    const { id } = await params // Get thesis id from params

    try {
      const body = await req.json()

      if (!body) {
        return NextResponse.json(
          { message: 'Request body is empty or malformed' },
          { status: 400 }
        )
      }

      // Step 1: Validate the request body
      const parsedBody = updateThesisSchema.parse(body)

      // Step 2: Find the thesis by ID
      const thesis = await prisma.thesis.findUnique({
        where: { thesis_id: BigInt(id) },
      })

      if (!thesis) {
        return NextResponse.json(
          { message: 'Thesis not found' },
          { status: 404 }
        )
      }

      // Step 4: Update the thesis fields if provided
      const updatedThesis = await prisma.thesis.update({
        where: { thesis_id: BigInt(id) },
        data: {
          title: parsedBody.title ?? thesis.title,
          category: parsedBody.category ?? thesis.category,
          keywords: parsedBody.keywords
            ? JSON.stringify(parsedBody.keywords)
            : thesis.keywords,
          abstract: parsedBody.abstract ?? thesis.abstract,
          status: parsedBody.status ?? thesis.status,
          document_url: parsedBody.document_url ?? thesis.document_url,
          author_id: thesis.author_id,
          reviewer_id: parsedBody.reviewer_id
            ? BigInt(parsedBody.reviewer_id)
            : thesis.reviewer_id,
        },
      })

      // Step 5: Prepare the response object
      const thesisResponse = {
        thesis_id: updatedThesis.thesis_id.toString(),
        title: updatedThesis.title,
        author_id: updatedThesis.author_id.toString(),
        category: updatedThesis.category,
        keywords: JSON.parse(updatedThesis.keywords), // Parse JSON string back to array
        abstract: updatedThesis.abstract,
        status: updatedThesis.status,
        created_at: updatedThesis.created_at.toISOString(),
        updated_at: updatedThesis.updated_at.toISOString(),
      }

      const currentUser = await getUserFromSession(req)

      // Step 6: Log the action in the history (optional)
      await prisma.history.create({
        data: {
          user_id: currentUser.id,
          action: 'Updated Thesis',
          description: `Thesis titled "${updatedThesis.title}" updated by ${currentUser.email}`,
        },
      })
      // Step 6: Return the updated thesis information
      return NextResponse.json({
        message: 'Thesis updated successfully',
        thesis: thesisResponse,
      })
    } catch (error) {
      console.error('Error updating thesis:', error.message || error)

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
  }
)

// write delete method

// export const DELETE = withRolePermission('DELETE_THESIS')(
//   async (req, { params }) => {
//     const { id } = await params

//     try {
//       const thesis = await prisma.thesis.findUnique({
//         where: { thesis_id: BigInt(id) },
//       })

//       if (!thesis) {
//         return NextResponse.json(
//           { message: 'Thesis not found' },
//           { status: 404 }
//         )
//       }

//       await prisma.thesis.delete({
//         where: { thesis_id: BigInt(id) },
//       })

//       return NextResponse.json({ message: 'Thesis deleted successfully' })
//     } catch (error) {
//       console.error('Error deleting thesis:', error.message || error)
//       return NextResponse.json(
//         { message: 'Internal Server Error', error: error.message || error },
//         { status: 500 }
//       )
//     }
//   }
// )
export const DELETE = withRolePermission('DELETE_THESIS')(
  async (req, { params }) => {
    try {
      const { id } = await params
      const thesisId = id
      console.log(thesisId)
      // Check if `thesis_id` is provided
      if (!thesisId) {
        return NextResponse.json(
          { message: 'Thesis ID is required' },
          { status: 400 }
        )
      }

      // Step 1: Fetch the thesis to ensure it exists
      const thesis = await prisma.thesis.findUnique({
        where: { thesis_id: thesisId },
      })

      if (!thesis) {
        return NextResponse.json(
          { message: `Thesis with ID ${thesisId} not found` },
          { status: 404 }
        )
      }

      // Fetch the current user for logging the action
      const currentUser = await getUserFromSession(req)

      // Step 2: Log the action (before deletion)
      await prisma.history.create({
        data: {
          user_id: currentUser.id,
          action: 'Deleted Thesis',
          description: `Thesis titled "${thesis.title}" deleted by ${currentUser.email}`,
        },
      })

      // Step 3: Manually delete the related records in stages
      // Delete ThesisViews related to the Thesis
      await prisma.thesisView.deleteMany({
        where: { thesis_id: thesisId },
      })

      // Delete ThesisDownloads related to the Thesis
      await prisma.thesisDownload.deleteMany({
        where: { thesis_id: thesisId },
      })

      // Delete ThesisComments related to the Thesis
      await prisma.thesisComment.deleteMany({
        where: { thesis_id: thesisId },
      })

      // Delete PeerMessages related to the Thesis
      await prisma.peerMessage.deleteMany({
        where: { thesis_id: thesisId },
      })

      // Optional: You may also want to delete ThesisVotes if they exist
      await prisma.thesisVote.deleteMany({
        where: { thesis_id: thesisId },
      })

      // Step 4: Finally delete the Thesis itself
      await prisma.thesis.delete({
        where: { thesis_id: thesisId },
      })

      // Step 5: Return a success response
      return NextResponse.json({
        message: `Thesis with ID ${thesisId} deleted successfully`,
      })
    } catch (error) {
      console.error('Error deleting thesis:', error)

      return NextResponse.json(
        { message: 'Internal Server Error', error: error.message || error },
        { status: 500 }
      )
    }
  }
)
