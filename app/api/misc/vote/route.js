import prisma from "../../../lib/db"; // Assuming Prisma is set up
import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();
  const { thesisId, userId, voteType } = body; // Extract thesisId, userId, and voteType from the body

  if (!thesisId || !userId || !voteType) {
    return NextResponse.json(
      { message: "Thesis ID, User ID, and Vote Type are required" },
      { status: 400 }
    );
  }

  try {
    // Ensure the voteType is either UPVOTE or DOWNVOTE
    if (![ 'UPVOTE', 'DOWNVOTE' ].includes(voteType)) {
      return NextResponse.json(
        { message: "Invalid vote type" },
        { status: 400 }
      );
    }

    // Check if the user has already voted on this thesis
    const existingVote = await prisma.thesisVote.findUnique({
      where: {
        thesis_id_user_id: {
          thesis_id: BigInt(thesisId),
          user_id: BigInt(userId)
        }
      },
    });

    if (existingVote) {
      // If the user has already voted, update their vote
      if (existingVote.vote_type === voteType) {
        return NextResponse.json(
          { message: "You have already voted this way" },
          { status: 400 }
        );
      }

      // Update the existing vote (either switch from upvote to downvote or vice versa)
      await prisma.thesisVote.update({
        where: { id: existingVote.id },
        data: { vote_type: voteType }
      });

      // Update the thesis upvote/downvote counts accordingly
      if (voteType === "UPVOTE") {
        await prisma.thesis.update({
          where: { thesis_id: BigInt(thesisId) },
          data: {
            upvotes: { increment: 1 },
            downvotes: { decrement: 1 }
          }
        });
      } else {
        await prisma.thesis.update({
          where: { thesis_id: BigInt(thesisId) },
          data: {
            upvotes: { decrement: 1 },
            downvotes: { increment: 1 }
          }
        });
      }

      return NextResponse.json({ message: "Vote updated successfully" });
    } else {
      // If the user hasn't voted yet, create a new vote
      await prisma.thesisVote.create({
        data: {
          thesis_id: BigInt(thesisId),
          user_id: BigInt(userId),
          vote_type: voteType,
        }
      });

      // Update the thesis upvote/downvote counts accordingly
      if (voteType === "UPVOTE") {
        await prisma.thesis.update({
          where: { thesis_id: BigInt(thesisId) },
          data: { upvotes: { increment: 1 } }
        });
      } else {
        await prisma.thesis.update({
          where: { thesis_id: BigInt(thesisId) },
          data: { downvotes: { increment: 1 } }
        });
      }

      return NextResponse.json({ message: "Vote registered successfully" });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error processing vote", error: error.message },
      { status: 500 }
    );
  }
}
