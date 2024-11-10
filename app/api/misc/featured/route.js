import { NextResponse } from "next/server";
import prisma from "../../../lib/db"; // import prisma client instance

export async function GET(req, res) {
  try {
    // Query the thesis table, ordering by upvotes in descending order to get the highest ones
    const featuredTheses = await prisma.thesis.findMany({
      orderBy: {
        upvotes: "desc", // Orders by the upvotes field
      },
      take: 10, // Fetch top 10 featured theses
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });
    const response = featuredTheses.map((thesis) => {
      return {
        ...thesis,
        thesis_id: thesis.thesis_id.toString(), // Convert thesis_id to string
        author_id: thesis.author_id.toString(), // Convert author_id to string
        reviewer_id: thesis.reviewer_id.toString(), // Convert reviewer_id to string
        upvotes: thesis.upvotes.toString(), // Convert upvotes to string
        downvotes: thesis.downvotes.toString(), // Convert downvotes to string
        views_count: thesis.views_count.toString(), // Convert views_count to string
        downloads_count: thesis.downloads_count.toString(), // Convert downloads_count to string
        author: {
          ...thesis.author,
          id: thesis.author.id.toString(), // Convert author id to string
        },
        reviewer: {
          ...thesis.reviewer,
          id: thesis.reviewer.id.toString(), // Convert reviewer id to string
        },
      };
    });
    // Send the response back to the client
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching featured theses:", error);
    return NextResponse.json({ error: "Error fetching featured theses." });
  }
}
