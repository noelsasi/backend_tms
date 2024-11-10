// pages/api/messages/last.js

import prisma from "../../../lib/db"; // Assuming Prisma is set up
import { NextResponse } from "next/server";

export async function GET(req) {
  const { userId } = req.query; // User ID of the logged-in user

  if (!userId) {
    return NextResponse.json(
      { message: "User ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the latest message for each conversation involving the logged-in user
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: BigInt(userId) },
          { receiver_id: BigInt(userId) },
        ],
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
          },
        },
        content: true,
        created_at: true,
      },
      distinct: ['sender_id', 'receiver_id'],  // Get distinct conversations (latest message per pair)
    });

    const usersWithLastMessages = conversations.map((message) => {
      const otherUser = message.sender_id === BigInt(userId) ? message.receiver : message.sender;
      return {
        userId: otherUser.id,
        username: otherUser.username,
        lastMessage: message.content,
        timestamp: message.created_at,
      };
    });

    return NextResponse.json({ conversations: usersWithLastMessages });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching conversations", error: error.message },
      { status: 500 }
    );
  }
}
