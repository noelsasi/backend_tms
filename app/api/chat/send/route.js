// pages/api/messages/send.js

import prisma from "../../../lib/db"; // Assuming Prisma is set up
import { NextResponse } from "next/server";

export async function POST(req) {
  const { senderId, receiverId, content } = await req.json();

  if (!senderId || !receiverId || !content) {
    return NextResponse.json(
      { message: "Sender ID, Receiver ID, and Content are required" },
      { status: 400 }
    );
  }

  try {
    // Create a new message
    const newMessage = await prisma.message.create({
      data: {
        sender_id: BigInt(senderId),
        receiver_id: BigInt(receiverId),
        content: content,
      },
    });

    return NextResponse.json({ message: "Message sent", newMessage });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error sending message", error: error.message },
      { status: 500 }
    );
  }
}
