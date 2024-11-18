// app/api/admin/peer-reviews/route.js

import { withRolePermission } from "../../../lib/middleware";
import { NextResponse } from "next/server";
import prisma from "../../../lib/db";
import { z } from "zod";
import { getUserFromSession } from "../../../lib/currentSesion";


// Handle GET request to fetch all peer reviews
export async function GET(req) {
  try {
    // Fetching all peer review records along with associated thesis and reviewer details
    const peerReviews = await prisma.peerMessage.findMany({
      include: {
        thesis: {
          select: {
            title: true, // Fetch thesis title
          },
        },
        reviewer: {
          select: {
            email: true, // Fetch reviewer email (or other info)
          },
        },
      },
    });

    // Format and return the list of peer reviews
    const formattedReviews = peerReviews.map((review) => ({
      id: review.id.toString(),
      title: review.title,
      review: review.review,
      review_date: review.review_date,
      status: review.status,
      thesis_title: review.thesis.title, // Associated thesis title
      reviewer_email: review.reviewer.email, // Reviewer email
      thesis_id: review.thesis_id.toString(),
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error("Error fetching peer reviews:", error);
    return NextResponse.json(
      { message: "Error fetching peer reviews" },
      { status: 500 }
    );
  }
}


const createPeerReviewSchema = z.object({
  title: z.string().min(1),
  thesis_id: z.string().refine(val => !isNaN(Number(val)), {
    message: "Invalid thesis_id",
  }),

  review_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  }),
  status: z.enum(["pending", "in review", "completed"]).optional(),
  review: z.string().min(1),
});

// POST route to create a new peer review
export const POST = withRolePermission("CREATE_PEER_REVIEW")(async (req) => {
  let body;

  try {
    // Step 1: Parse the incoming request body
    body = await req.json();

    if (!body) {
      return NextResponse.json({ message: "Request body is empty or malformed" }, { status: 400 });
    }

    // Step 2: Validate the request body with the Zod schema
    const parsedBody = createPeerReviewSchema.parse(body);

    // Step 3: Get the current user (reviewer) from session
    const currentUser = await getUserFromSession(req);

    // Step 4: Ensure the user is authorized to review
    if (!currentUser) {
      return NextResponse.json({ message: "Unauthorized: No current user found" }, { status: 401 });
    }

    // Step 5: Convert thesis_id and reviewer_id to BigInt for database interaction
    const thesisId = BigInt(parsedBody.thesis_id);
    const reviewerId = BigInt(currentUser.id);  // Assuming the logged-in user is the reviewer

    // Step 6: Check if the thesis exists
    const thesis = await prisma.thesis.findUnique({
      where: { thesis_id: thesisId },
    });

    if (!thesis) {
      return NextResponse.json({ message: "Thesis not found" }, { status: 404 });
    }

    // Step 7: Create the new peer review record in the database
    const peerReview = await prisma.peerMessage.create({
      data: {
        title: parsedBody.title,
        review: parsedBody.review,
        review_date: new Date(parsedBody.review_date),
        status: parsedBody.status,
        thesis_id: thesisId,
        reviewer_id: reviewerId, // Use the current user's ID as the reviewer ID
      },
    });

    // Step 8: Convert BigInt fields to strings for JSON serialization
    const serializedPeerReview = {
      id: peerReview.id.toString(),
      title: peerReview.title,
      review: peerReview.review,
      review_date: peerReview.review_date.toISOString(), // Convert Date to ISO string
      status: peerReview.status,
      thesis_id: peerReview.thesis_id.toString(),
      reviewer_id: peerReview.reviewer_id.toString(),
    };

    // Step 9: Record the action in the history table (audit trail)
    await prisma.history.create({
      data: {
        user_id: currentUser.id,
        action: "Created Peer Review",
        description: `Peer review for thesis titled "${thesis.title}" created by ${currentUser.email}`,
      },
    });

    // Step 10: Return a success response with the created peer review details
    return NextResponse.json({
      message: "Peer review created successfully",
      peerReview: serializedPeerReview,
    });
  } catch (error) {
    console.error("Error during peer review creation:", error.message || error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
    }

    return NextResponse.json({ message: "Internal Server Error", error: error.message || error }, { status: 500 });
  }
});

