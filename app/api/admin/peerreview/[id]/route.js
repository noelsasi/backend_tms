
import { withRolePermission } from "@/app/lib/middleware";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db"; // Importing the Prisma client
import { z } from "zod"; // For validation
import { getUserFromSession } from "@/app/lib/currentSesion";

// Validation schema for updating a peer review
const updatePeerReviewSchema = z.object({
  title: z.string().min(1).optional(), // Optional for update
  review: z.string().min(1).optional(), // Optional for update
  review_date: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date",
    })
    .optional(), // Optional for update
  status: z.enum(["pending", "in review", "completed"]).optional(),
  reviewer_id: z.string().optional(), // Optional for update, in case reviewer_id is passed
});

// PUT route to update an existing peer review
export const PUT = withRolePermission("MODIFY_PEER_REVIEW")(
  async (req, { params }) => {
    const { id } = await params; // Retrieve the peer review ID from params

    try {
      const body = await req.json();

      // Log the incoming body to check if reviewer_id is correct
      console.log("Incoming request body:", body);

      if (!body) {
        return NextResponse.json(
          { message: "Request body is empty or malformed" },
          { status: 400 }
        );
      }

      // Step 1: Validate the request body
      const parsedBody = updatePeerReviewSchema.parse(body);

      // Log parsed body to verify that the reviewer_id is being parsed correctly

      // Step 2: Check if the peer review exists in the database
      const peerReview = await prisma.peerMessage.findUnique({
        where: { id: BigInt(id) },
      });

      // Log the peer review to verify its current state before update


      if (!peerReview) {
        return NextResponse.json(
          { message: "Peer review not found" },
          { status: 404 }
        );
      }

      // Get the current user from session
      const currentUser = await getUserFromSession(req);

      // Log the current user ID to ensure we're using the correct one

      // Step 4: Update the peer review in the database
      const updatedPeerReview = await prisma.peerMessage.update({
        where: { id: BigInt(id) },
        data: {
          title: parsedBody.title ?? peerReview.title,
          review: parsedBody.review ?? peerReview.review,
          reviewer_id: currentUser.id, // Update reviewer_id to the current user ID
          review_date: parsedBody.review_date
            ? new Date(parsedBody.review_date)
            : peerReview.review_date,
          status: parsedBody.status ?? peerReview.status,
        },
      });

      // Log the updated peer review to verify the change


      // Step 5: Serialize the updated peer review (convert BigInt to string)
      const peerReviewResponse = {
        id: updatedPeerReview.id.toString(),
        title: updatedPeerReview.title,
        review: updatedPeerReview.review,
        review_date: updatedPeerReview.review_date.toISOString(),
        status: updatedPeerReview.status,
        thesis_id: updatedPeerReview.thesis_id.toString(),
        reviewer_id: updatedPeerReview.reviewer_id.toString(),
      };

      // Step 6: Log the action in the history (optional)
      await prisma.history.create({
        data: {
          user_id: currentUser.id,
          action: "Updated Peer Review",
          description: `Peer review for thesis ${peerReview.thesis_id} updated by ${currentUser.email}`,
        },
      });

      return NextResponse.json({
        message: "Peer review updated successfully",
        peerReview: peerReviewResponse,
      });
    } catch (error) {
      console.error("Error during peer review update:", error.message || error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: "Validation failed", errors: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: "Internal Server Error", error: error.message || error },
        { status: 500 }
      );
    }
  }
);
export const DELETE = withRolePermission("DELETE_PEER_REVIEW")(
  async (req, { params }) => {
    const { id } = await params; // Retrieve the peer review ID from params

    try {
      // Step 1: Check if the peer review exists in the database
      const peerReview = await prisma.peerMessage.findUnique({
        where: { id: BigInt(id) },
      });

      if (!peerReview) {
        return NextResponse.json(
          { message: "Peer review not found" },
          { status: 404 }
        );
      }

      // Step 2: Delete the peer review from the database
      await prisma.peerMessage.delete({
        where: { id: BigInt(id) },
      });

      // Step 3: Log the action in the history (optional)
      const currentUser = await getUserFromSession(req);
      await prisma.history.create({
        data: {
          user_id: currentUser.id,
          action: "Deleted Peer Review",
          description: `Peer review for thesis ${peerReview.thesis_id} deleted by ${currentUser.email}`,
        },
      });

      // Step 4: Return success response
      return NextResponse.json({ message: "Peer review deleted successfully" });
    } catch (error) {
      console.error("Error during peer review deletion:", error.message || error);

      return NextResponse.json(
        { message: "Internal Server Error", error: error.message || error },
        { status: 500 }
      );
    }
  }
);