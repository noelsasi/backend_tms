import { NextResponse } from 'next/server'
import prisma from '../../../../lib/db'
import { z } from 'zod'
import { getUserFromSession } from '../../../../lib/currentSesion'

// PUT - Update a notification
export async function PUT(req, { params }) {
  try {
    const { id } = params

    const currentUser = await getUserFromSession(req)
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: BigInt(id),
        user_id: currentUser.id,
      },
    })

    if (!existingNotification) {
      return NextResponse.json(
        { message: 'Notification not found or unauthorized' },
        { status: 404 }
      )
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: BigInt(id) },
      data: { read: true },
    })

    return NextResponse.json({
      id: updatedNotification.id.toString(),
      message: updatedNotification.message,
      created_at: updatedNotification.created_at.toISOString(),
      updated_at: updatedNotification.updated_at.toISOString(),
    })
  } catch (error) {
    console.error('Error updating notification:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Error updating notification', error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a notification
export async function DELETE(req, { params }) {
  try {
    const { id } = params
    const currentUser = await getUserFromSession(req)

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Check if notification exists and belongs to user
    const existingNotification = await prisma.notification.findFirst({
      where: {
        id: BigInt(id),
        user_id: currentUser.id,
      },
    })

    if (!existingNotification) {
      return NextResponse.json(
        { message: 'Notification not found or unauthorized' },
        { status: 404 }
      )
    }

    await prisma.notification.delete({
      where: { id: BigInt(id) },
    })

    return NextResponse.json({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { message: 'Error deleting notification', error: error.message },
      { status: 500 }
    )
  }
}
