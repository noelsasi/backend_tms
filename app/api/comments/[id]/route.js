import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { getUserFromSession } from '@/app/lib/currentSesion';
import { z } from 'zod';

// Schema for update validation
const updateCommentSchema = z.object({
  message_content: z.string().min(1),
});

// PUT (Update) comment
export async function PUT(req, { params }) {
  try {
    const currentUser = await getUserFromSession(req);
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const validatedData = updateCommentSchema.parse(body);

    // Check if comment exists and belongs to current user
    const existingComment = await prisma.thesisComment.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingComment) {
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existingComment.user_id !== currentUser.id) {
      return NextResponse.json(
        { message: 'Unauthorized to update this comment' },
        { status: 403 }
      );
    }

    const updatedComment = await prisma.thesisComment.update({
      where: { id: BigInt(id) },
      data: {
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
      id: updatedComment.id.toString(),
      thesis_id: updatedComment.thesis_id.toString(),
      user_id: updatedComment.user_id.toString(),
      message_content: updatedComment.message_content,
      created_at: updatedComment.created_at.toISOString(),
      updated_at: updatedComment.updated_at.toISOString(),
      user: updatedComment.user,
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Error updating comment', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE comment
export async function DELETE(req, { params }) {
  try {
    const currentUser = await getUserFromSession(req);
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if comment exists and belongs to current user
    const existingComment = await prisma.thesisComment.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingComment) {
      return NextResponse.json(
        { message: 'Comment not found' },
        { status: 404 }
      );
    }

    if (existingComment.user_id !== currentUser.id) {
      return NextResponse.json(
        { message: 'Unauthorized to delete this comment' },
        { status: 403 }
      );
    }

    await prisma.thesisComment.delete({
      where: { id: BigInt(id) },
    });

    return NextResponse.json({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { message: 'Error deleting comment', error: error.message },
      { status: 500 }
    );
  }
} 