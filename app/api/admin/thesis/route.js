import { NextResponse } from "next/server";
import prisma from "@/app/lib/db"; // Importing Prisma client
import { withRolePermission } from "@/app/lib/middleware"; // Middleware for role-based access
import { getUserFromSession } from "@/app/lib/currentSesion"; // Get user session

// Define GET route to fetch all theses with their details
export const GET = async (req) => {
  try {
    // Fetch all theses with related views, downloads, and votes
    const theses = await prisma.thesis.findMany({
      include: {
        views: true, // Include views related to this thesis
        downloads: true, // Include downloads related to this thesis
        ThesisVote: true, // Include votes to count upvotes and downvotes
      },
    });

    // Map over the theses and calculate the required data
    const thesesResponse = theses.map((thesis) => {
      // Count upvotes and downvotes
      const upvotes = thesis.ThesisVote.filter(
        (vote) => vote.vote_type === "UPVOTE"
      ).length;
      const downvotes = thesis.ThesisVote.filter(
        (vote) => vote.vote_type === "DOWNVOTE"
      ).length;

      return {
        thesis_id: thesis.thesis_id.toString(), // Convert BigInt to string
        title: thesis.title,
        abstract: thesis.abstract,
        keywords: thesis.keywords, // JSON data
        status: thesis.status,
        document_url: thesis.document_url,
        upvotes,
        downvotes,
        views_count: thesis.views.length, // Number of views
        downloads_count: thesis.downloads.length, // Number of downloads
        created_at: thesis.created_at.toISOString(), // Date in ISO string format
        updated_at: thesis.updated_at.toISOString(), // Date in ISO string format
      };
    });

    // Return the list of theses along with views, downloads, upvotes, and downvotes
    return NextResponse.json(thesesResponse);
  } catch (error) {
    console.error("Error fetching theses:", error);
    return NextResponse.json(
      { message: "Error fetching theses", error: error.message || error },
      { status: 500 }
    );
  }
};
