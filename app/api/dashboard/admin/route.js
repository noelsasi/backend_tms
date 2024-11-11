// File: app/api/statistics/route.js

import { NextResponse } from 'next/server';
import prisma from '../../../lib/db'; // Prisma client instance

// API endpoint to get statistics and graph values
export async function GET()  {
  try {
    // 1. Total Views by Each Thesis
    const totalViewsByThesis = await prisma.thesisView.groupBy({
      by: ['thesis_id'],
      _count: {
        thesis_id: true, // Count views for each thesis
      },
    });

    // Fetch thesis details (title) to return alongside the view count
    const viewDetails = await prisma.thesis.findMany({
      where: {
        thesis_id: {
          in: totalViewsByThesis.map((item) => item.thesis_id),
        },
      },
      select: {
        thesis_id: true,
        title: true,
      },
    });

    const viewData = totalViewsByThesis.map((item) => {
      const thesis = viewDetails.find(
        (thesis) => thesis.thesis_id === item.thesis_id
      );
      return {
        title: thesis?.title || 'Unknown Thesis',
        views: item._count.thesis_id,
      };
    });

    // Total Views (cumulative)
    const totalViews = totalViewsByThesis.reduce((acc, item) => acc + item._count.thesis_id, 0);

    // Most Viewed Theses (Top 5)
    const mostViewedTheses = viewData.sort((a, b) => b.views - a.views).slice(0, 5);

    // 2. Total Downloads by Each Thesis
    const totalDownloadsByThesis = await prisma.thesisDownload.groupBy({
      by: ['thesis_id'],
      _count: {
        thesis_id: true, // Count downloads for each thesis
      },
    });

    // Fetch thesis details (title) to return alongside the download count
    const downloadDetails = await prisma.thesis.findMany({
      where: {
        thesis_id: {
          in: totalDownloadsByThesis.map((item) => item.thesis_id),
        },
      },
      select: {
        thesis_id: true,
        title: true,
      },
    });

    const downloadData = totalDownloadsByThesis.map((item) => {
      const thesis = downloadDetails.find(
        (thesis) => thesis.thesis_id === item.thesis_id
      );
      return {
        title: thesis?.title || 'Unknown Thesis',
        downloads: item._count.thesis_id,
      };
    });

    // Total Downloads (cumulative)
    const totalDownloads = totalDownloadsByThesis.reduce((acc, item) => acc + item._count.thesis_id, 0);

    // Most Downloaded Theses (Top 5)
    const mostDownloadedTheses = downloadData.sort((a, b) => b.downloads - a.downloads).slice(0, 5);

    // 3. Total Users
    const totalUsers = await prisma.user.count();

    // 4. Total Theses
    const totalTheses = await prisma.thesis.count();

    // 5. Under-review Theses (status: 'under_review')
    const underReviewTheses = await prisma.thesis.count({
      where: {
        status: 'Pending',
      },
    });

    // Return all statistics in the response
    return NextResponse.json({
      totalUsers,
      totalTheses,
      underReviewTheses,
      totalViews, // Cumulative total views across all theses
      totalDownloads, // Cumulative total downloads across all theses
      totalViewsByThesis: viewData, // Total views by individual thesis
      totalDownloadsByThesis: downloadData, // Total downloads by individual thesis
      mostViewedTheses, // Top 5 most viewed theses
      mostDownloadedTheses, // Top 5 most downloaded theses
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json({ message: 'Error fetching statistics', error: error.message }, { status: 500 });
  }
}
