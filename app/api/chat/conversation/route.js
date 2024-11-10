// pages/api/messages/conversation.js

import prisma from "../../../lib/db"; // Assuming Prisma is set up
import { NextResponse } from "next/server";

export async function GET(req) {
  const { senderId, receiverId } = req.query;

  if (!senderId || !receiverId) {
    return NextResponse.json(
      { message: "Sender ID and Receiver ID are required" },
      { status: 400 }
    );
  }

  try {
    // Fetch all messages between the sender and receiver
    const conversation = await prisma.message.findMany({
      where: {
        OR: [
          { sender_id: BigInt(senderId), receiver_id: BigInt(receiverId) },
          { sender_id: BigInt(receiverId), receiver_id: BigInt(senderId) },
        ],
      },
      orderBy: {
        created_at: 'asc',
      },
      include: {
        sender: {
          select: { username: true },
        },
        receiver: {
          select: { username: true },
        },
      },
    });

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error fetching conversation", error: error.message },
      { status: 500 }
    );
  }
}
