// pages/api/messages/send.js

import prisma from '../../../lib/db' // Assuming Prisma is set up
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserFromSession } from '../../../lib/currentSesion'

const messageSchema = z.object({
  receiver_id: z.string().min(1),
  content: z.string().min(1).max(1000),
})

export async function POST(req) {
  try {
    const currentUser = await getUserFromSession(req)
    if (!currentUser) {
      return new NextResponse(
        JSON.stringify({ message: 'User not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let body
    try {
      body = await req.json()
    } catch (error) {
      return new NextResponse(
        JSON.stringify({
          message: 'Invalid request body - must be valid JSON',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!body) {
      return new NextResponse(
        JSON.stringify({ message: 'Request body is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

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
        receiver: {
          select: {
            username: true,
            profilePic: true,
          },
        },
      },
    })

    if (message) {
      await prisma.notification.create({
        data: {
          user_id: BigInt(validatedData.receiver_id),
          message: `${currentUser.username} sent you a message`,
        },
      })
    }

    return new NextResponse(
      JSON.stringify({
        id: message.id.toString(),
        content: message.content,
        sender_id: message.sender_id.toString(),
        receiver_id: message.receiver_id.toString(),
        created_at: message.created_at.toISOString(),
        sender: message.sender,
        receiver: message.receiver,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error sending message:', error)
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({
          message: 'Validation failed',
          errors: error.errors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
    return new NextResponse(
      JSON.stringify({
        message: 'Error sending message',
        error: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
