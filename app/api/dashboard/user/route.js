// File: app/api/statistics/user-dashboard/route.js

import { NextResponse } from "next/server";
import prisma from "../../../lib/db"; // Prisma client instance
import { getUserFromSession } from "../../../lib/currentSesion";

export async function GET(request) {
  try {
    // Step 1: Get the authenticated user
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    // 2. Get the theses authored by the authenticated user
    const userTheses = await prisma.thesis.findMany({
      where: {
        author_id: user.id,
      },
      select: {
        thesis_id: true,
        title: true,
      },
    });

    // Get the thesis IDs for filtering views and downloads
    const userThesisIds = userTheses.map((thesis) => thesis.thesis_id);

    // 3. Total Views by Each Thesis (for user’s theses)
    const totalViewsByUserThesis = await prisma.thesisView.groupBy({
      by: ["thesis_id"],
      where: {
        thesis_id: { in: userThesisIds },
      },
      _count: {
        thesis_id: true, // Count views for each thesis
      },
    });

    // Fetch thesis details (title) to return alongside the view count
    const viewDetails = await prisma.thesis.findMany({
      where: {
        thesis_id: {
          in: totalViewsByUserThesis.map((item) => item.thesis_id),
        },
      },
      select: {
        thesis_id: true,
        title: true,
      },
    });

    const viewData = totalViewsByUserThesis.map((item) => {
      const thesis = viewDetails.find(
        (thesis) => thesis.thesis_id === item.thesis_id
      );
      return {
        title: thesis?.title || "Unknown Thesis",
        views: item._count.thesis_id,
      };
    });

    // Total Views (cumulative) for user’s theses
    const totalViews = totalViewsByUserThesis.reduce(
      (acc, item) => acc + item._count.thesis_id,
      0
    );

    // Most Viewed Theses (Top 5)
    const mostViewedTheses = viewData
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // 4. Total Downloads by Each Thesis (for user’s theses)
    const totalDownloadsByUserThesis = await prisma.thesisDownload.groupBy({
      by: ["thesis_id"],
      where: {
        thesis_id: { in: userThesisIds },
      },
      _count: {
        thesis_id: true, // Count downloads for each thesis
      },
    });

    // Fetch thesis details (title) to return alongside the download count
    const downloadDetails = await prisma.thesis.findMany({
      where: {
        thesis_id: {
          in: totalDownloadsByUserThesis.map((item) => item.thesis_id),
        },
      },
      select: {
        thesis_id: true,
        title: true,
      },
    });

    const downloadData = totalDownloadsByUserThesis.map((item) => {
      const thesis = downloadDetails.find(
        (thesis) => thesis.thesis_id === item.thesis_id
      );
      return {
        title: thesis?.title || "Unknown Thesis",
        downloads: item._count.thesis_id,
      };
    });

    // Total Downloads (cumulative) for user’s theses
    const totalDownloads = totalDownloadsByUserThesis.reduce(
      (acc, item) => acc + item._count.thesis_id,
      0
    );

    // Most Downloaded Theses (Top 5)
    const mostDownloadedTheses = downloadData
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 5);

    // 5. Total Theses submitted by the user
    const totalUserTheses = userTheses.length;

    // 6. Under-review Theses (status: 'under_review') by the user
    const underReviewUserTheses = await prisma.thesis.count({
      where: {
        author_id: user.id,
        status: "Pending",
      },
    });

    // Return all statistics in the response for user dashboard
    return NextResponse.json(
      {
        totalUserTheses,
        underReviewUserTheses,
        totalViews, // Cumulative total views for user’s theses
        totalDownloads, // Cumulative total downloads for user’s theses
        totalViewsByUserThesis: viewData, // Total views by individual thesis submitted by the user
        totalDownloadsByUserThesis: downloadData, // Total downloads by individual thesis submitted by the user
        mostViewedTheses, // Top 5 most viewed theses submitted by the user
        mostDownloadedTheses, // Top 5 most downloaded theses submitted by the user
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return NextResponse.json(
      { message: "Error fetching user statistics", error: error.message },
      { status: 500 }
    );
  }
}
