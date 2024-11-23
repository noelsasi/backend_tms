import { NextResponse } from 'next/server'
import prisma from '../../lib/db'
import { z } from 'zod'
import { getUserFromSession } from '../../lib/currentSesion'
// Validation schema for creating/updating notifications
const notificationSchema = z.object({
  message: z.string().min(1).max(255),
  user_id: z.string().optional(), // Optional because we might get it from session
})

// GET - Fetch all notifications for a user
export async function GET(req) {
  try {
    const currentUser = await getUserFromSession(req)

    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: {
        user_id: currentUser.id,
      },
      include: {
        user: {
          select: {
            firstname: true,
            lastname: true,
            email: true,
            profilePic: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    // Format notifications for response
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id.toString(),
      message: notification.message,
      created_at: notification.created_at.toISOString(),
      updated_at: notification.updated_at.toISOString(),
      user_id: notification.user_id.toString(),
      user_info: {
        firstname: notification.user.firstname,
        lastname: notification.user.lastname,
        email: notification.user.email,
        profilePic: notification.user.profilePic,
      },
    }))

    return NextResponse.json(formattedNotifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { message: 'Error fetching notifications', error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new notification
export async function POST(req) {
  try {
    const body = await req.json()
    const parsedBody = notificationSchema.parse(body)

    const currentUser = await getUserFromSession(req)
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const notification = await prisma.notification.create({
      data: {
        message: parsedBody.message,
        user_id: BigInt(parsedBody.user_id || currentUser.id),
      },
    })

    return NextResponse.json({
      id: notification.id.toString(),
      message: notification.message,
      created_at: notification.created_at.toISOString(),
      updated_at: notification.updated_at.toISOString(),
    })
  } catch (error) {
    console.error('Error creating notification:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Error creating notification', error: error.message },
      { status: 500 }
    )
  }
}
