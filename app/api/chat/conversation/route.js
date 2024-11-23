// pages/api/messages/conversation.js

import prisma from '../../../lib/db' // Assuming Prisma is set up
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserFromSession } from '../../../lib/currentSesion'

const messageSchema = z.object({
  receiver_id: z.string(),
  content: z.string().min(1).max(1000),
})

export async function GET(req) {
  try {
    const currentUser = await getUserFromSession(req)
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const otherUserId = searchParams.get('user_id')

    if (!otherUserId) {
      return NextResponse.json(
        { message: 'Other user ID is required' },
        { status: 400 }
      )
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            sender_id: currentUser.id,
            receiver_id: BigInt(otherUserId),
          },
          {
            sender_id: BigInt(otherUserId),
            receiver_id: currentUser.id,
          },
        ],
      },
      include: {
        sender: {
          select: {
            username: true,
            profilePic: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    })

    // make read true for all messages
    await prisma.message.updateMany({
      where: {
        receiver_id: currentUser.id,
        sender_id: BigInt(otherUserId),
      },
      data: { read: true },
    })

    const formattedMessages = messages.map(message => ({
      id: message.id.toString(),
      content: message.content,
      sender_id: message.sender_id.toString(),
      receiver_id: message.receiver_id.toString(),
      created_at: message.created_at.toISOString(),
      sender: message.sender,
    }))

    return NextResponse.json(formattedMessages)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { message: 'Error fetching conversation', error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const currentUser = await getUserFromSession(req)
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = messageSchema.parse(body)

    const message = await prisma.message.create({
      data: {
        sender_id: currentUser.id,
        receiver_id: BigInt(validatedData.receiver_id),
        content: validatedData.content,
      },
      include: {
        sender: {
          select: {
            username: true,
            profilePic: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: message.id.toString(),
      content: message.content,
      sender_id: message.sender_id.toString(),
      receiver_id: message.receiver_id.toString(),
      created_at: message.created_at.toISOString(),
      sender: message.sender,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: 'Error sending message', error: error.message },
      { status: 500 }
    )
  }
}
