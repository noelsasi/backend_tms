// pages/api/messages/last.js

import prisma from '../../../lib/db' // Assuming Prisma is set up
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

    const conversations = await prisma.$queryRaw`
      SELECT 
        m.*,
        u.username,
        u.profilePic
      FROM Message m
      INNER JOIN (
        SELECT 
          CASE 
            WHEN sender_id = ${currentUser.id} THEN receiver_id
            ELSE sender_id
          END as other_user_id,
          MAX(created_at) as latest_message
        FROM Message
        WHERE sender_id = ${currentUser.id} OR receiver_id = ${currentUser.id}
        GROUP BY other_user_id
      ) latest ON (
        (m.sender_id = ${currentUser.id} AND m.receiver_id = latest.other_user_id) OR
        (m.receiver_id = ${currentUser.id} AND m.sender_id = latest.other_user_id)
      ) AND m.created_at = latest.latest_message
      INNER JOIN User u ON u.id = latest.other_user_id
      ORDER BY m.created_at DESC
    `

    const formattedConversations = conversations.map(conv => ({
      id: conv.id.toString(),
      other_user_id:
        conv.sender_id === currentUser.id
          ? conv.receiver_id.toString()
          : conv.sender_id.toString(),
      username: conv.username,
      profilePic: conv.profilePic,
      last_message: conv.content,
      last_message_time: conv.created_at.toISOString(),
    }))

    return NextResponse.json(formattedConversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { message: 'Error fetching conversations', error: error.message },
      { status: 500 }
    )
  }
}
