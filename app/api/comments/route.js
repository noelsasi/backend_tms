import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getUserFromSession } from '@/app/lib/currentSesion';
import { z } from 'zod';

// Schema for comment validation
const commentSchema = z.object({
  thesis_id: z.string().min(1),
  message_content: z.string().min(1),
});

// GET all comments for a specific thesis
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const thesis_id = searchParams.get('thesis_id');

    if (!thesis_id) {
      return NextResponse.json(
        { message: 'Thesis ID is required' },
        { status: 400 }
      );
    }

    const comments = await prisma.thesisComment.findMany({
      where: {
        thesis_id: BigInt(thesis_id),
      },
      include: {
        user: {
          select: {
            username: true,
            firstname: true,
            lastname: true,
            profilePic: true
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const formattedComments = comments.map(comment => ({
      id: comment.id.toString(),
      thesis_id: comment.thesis_id.toString(),
      user_id: comment.user_id.toString(),
      message_content: comment.message_content,
      created_at: comment.created_at.toISOString(),
      updated_at: comment.updated_at.toISOString(),
      user: comment.user,
    }));

    return NextResponse.json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { message: 'Error fetching comments', error: error.message },
      { status: 500 }
    );
  }
}

// POST new comment
export async function POST(req) {
  try {
    const currentUser = await getUserFromSession(req);
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = commentSchema.parse(body);

    const comment = await prisma.thesisComment.create({
      data: {
        thesis_id: BigInt(validatedData.thesis_id),
        user_id: currentUser.id,
        message_content: validatedData.message_content,
      },
      include: {
        user: {
          select: {
            username: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: comment.id.toString(),
      thesis_id: comment.thesis_id.toString(),
      user_id: comment.user_id.toString(),
      message_content: comment.message_content,
      created_at: comment.created_at.toISOString(),
      updated_at: comment.updated_at.toISOString(),
      user: comment.user,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Error creating comment', error: error.message },
      { status: 500 }
    );
  }
} 