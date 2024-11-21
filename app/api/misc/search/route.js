import { NextResponse } from 'next/server'
import prisma from '@/app/lib/db'
import { z } from 'zod'

// Schema for validating search parameters
const searchParamsSchema = z.object({
  searchText: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(50).optional(),
})

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)

    // Parse and validate search parameters
    const params = {
      searchText: searchParams.get('searchText') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    }

    // Validate parameters using Zod
    const validatedParams = searchParamsSchema.parse(params)

    // Build where conditions only if searchText is provided
    const whereConditions = validatedParams.searchText
      ? {
          OR: [
            { title: { contains: validatedParams.searchText } },
            { category: { contains: validatedParams.searchText } },
            { keywords: { array_contains: [validatedParams.searchText] } },
            {
              author: {
                OR: [
                  { username: { contains: validatedParams.searchText } },
                  { firstname: { contains: validatedParams.searchText } },
                  { lastname: { contains: validatedParams.searchText } },
                ],
              },
            },
          ],
        }
      : {}

    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit

    // Fetch theses with related data
    const theses = await prisma.thesis.findMany({
      where: whereConditions,
      orderBy: { created_at: 'desc' },
      skip,
      take: validatedParams.limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            profilePic: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            profilePic: true,
          },
        },
        views: true,
        downloads: true,
        ThesisVote: true,
      },
    })

    // Get total count for pagination
    const totalCount = await prisma.thesis.count({
      where: whereConditions,
    })

    // Format the response using the same pattern as home route
    const formattedTheses = theses.map(thesis => ({
      thesis_id: thesis.thesis_id.toString(),
      title: thesis.title,
      abstract: thesis.abstract,
      keywords: thesis.keywords,
      status: thesis.status,
      document_url: thesis.document_url,
      views_count: thesis.views.length,
      downloads_count: thesis.downloads.length,
      upvotes: thesis.ThesisVote.filter(vote => vote.vote_type === 'UPVOTE')
        .length,
      downvotes: thesis.ThesisVote.filter(vote => vote.vote_type === 'DOWNVOTE')
        .length,
      created_at: thesis.created_at.toISOString(),
      updated_at: thesis.updated_at.toISOString(),
      author: {
        id: thesis.author.id.toString(),
        username: thesis.author.username,
        name: `${thesis.author.firstname} ${thesis.author.lastname}`,
        profilePic: thesis.author.profilePic,
      },
      reviewer: thesis.reviewer
        ? {
            id: thesis.reviewer.id.toString(),
            username: thesis.reviewer.username,
            name: `${thesis.reviewer.firstname} ${thesis.reviewer.lastname}`,
            profilePic: thesis.reviewer.profilePic,
          }
        : null,
    }))

    return NextResponse.json({
      theses: formattedTheses,
      pagination: {
        currentPage: validatedParams.page,
        totalPages: Math.ceil(totalCount / validatedParams.limit),
        totalItems: totalCount,
        itemsPerPage: validatedParams.limit,
      },
    })
  } catch (error) {
    console.error('Error searching theses:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid search parameters', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: 'Error searching theses', error: error.message },
      { status: 500 }
    )
  }
}
