// pages/api/messages/last.js

import prisma from '../../../lib/db'
import { NextResponse } from 'next/server'
import { getUserFromSession } from '../../../lib/currentSesion'

export async function GET(req) {
  try {
    const currentUser = await getUserFromSession(req)
    if (!currentUser) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      )
    }

    const conversations = await prisma.message.findMany({
      where: {
        OR: [{ sender_id: currentUser.id }, { receiver_id: currentUser.id }],
      },
      include: {
        sender: {
          select: {
            firstname: true,
            profilePic: true,
          },
        },
        receiver: {
          select: {
            firstname: true,
            profilePic: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    let uniqueSenders = [...new Set(conversations.map(conv => conv.sender_id))]
    let uniqueReceivers = [
      ...new Set(conversations.map(conv => conv.receiver_id)),
    ]

    // remove the current user from the uniqueSenders and uniqueReceivers
    uniqueSenders = uniqueSenders.filter(id => id != currentUser.id)
    uniqueReceivers = uniqueReceivers.filter(id => id != currentUser.id)

    const uniqueUsers = [...new Set([...uniqueSenders, ...uniqueReceivers])]

    const messages = []
    for (const user of uniqueUsers) {
      const lastMessage = conversations.find(
        conv =>
          (conv.sender_id == user && conv.receiver_id == currentUser.id) ||
          (conv.receiver_id == user && conv.sender_id == currentUser.id)
      )
      const unreadMessages = conversations.filter(
        conv =>
          conv.receiver_id == currentUser.id &&
          !conv.read &&
          conv.sender_id == user
      )
      const lastMessageReceiver = await prisma.user.findFirst({
        where: {
          id: user.toString(),
        },
        select: {
          firstname: true,
          profilePic: true,
        },
      })

      messages.push({
        ...lastMessage,
        sender_id: currentUser.id.toString(),
        receiver_id: user.toString(),
        id: lastMessage.id.toString(),
        unreadMessages: unreadMessages.length,
        receiver: lastMessageReceiver,
        sender: {
          firstname: currentUser.firstname,
          profilePic: currentUser.profilePic,
        },
      })
    }

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching conversations:', error)

    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'Database constraint violation' },
        { status: 409 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Record not found' }, { status: 404 })
    }

    return NextResponse.json(
      { message: 'Error fetching conversations', error: error.message },
      { status: 500 }
    )
  }
}
