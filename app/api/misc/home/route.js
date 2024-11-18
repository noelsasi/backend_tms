import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET(req) {
  try {
    // Fetch latest theses (10 most recent)
    const latestTheses = await prisma.thesis.findMany({
      orderBy: {
        created_at: "desc",
      },
      take: 3,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            profilePic: true
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            profilePic: true
          },
        },
        views: true,
        downloads: true,
        ThesisVote: true,
      },
    });

    // Fetch featured theses (10 most upvoted)
    const featuredTheses = await prisma.thesis.findMany({
      orderBy: {
        upvotes: "desc",
      },
      take: 3,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            profilePic: true
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            profilePic: true
          },
        },
        views: true,
        downloads: true,
        ThesisVote: true,
      },
    });

    // Format the response data
    const formatThesis = (thesis) => ({
      thesis_id: thesis.thesis_id.toString(),
      title: thesis.title,
      abstract: thesis.abstract,
      keywords: thesis.keywords,
      status: thesis.status,
      document_url: thesis.document_url,
      upvotes: thesis.upvotes,
      downvotes: thesis.downvotes,
      views_count: thesis.views.length,
      downloads_count: thesis.downloads.length,
      created_at: thesis.created_at.toISOString(),
      updated_at: thesis.updated_at.toISOString(),
      author: {
        id: thesis.author.id.toString(),
        username: thesis.author.username,
        name: `${thesis.author.firstname} ${thesis.author.lastname}`,
        profilePic: thesis.author.profilePic
      },
      reviewer: thesis.reviewer
        ? {
          id: thesis.reviewer.id.toString(),
          username: thesis.reviewer.username,
          name: `${thesis.reviewer.firstname} ${thesis.reviewer.lastname}`,
          profilePic: thesis.reviewer.profilePic
        }
        : null,
    });

    const response = {
      latest: latestTheses.map(formatThesis),
      featured: featuredTheses.map(formatThesis),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching theses:", error);
    return NextResponse.json(
      { message: "Error fetching theses", error: error.message },
      { status: 500 }
    );
  }
} 