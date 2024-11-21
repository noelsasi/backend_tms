import { NextResponse } from 'next/server'
import prisma from '../../../lib/db' // Prisma client instance

// API endpoint to get statistics and graph values
export async function GET() {
  try {
    // 1. Total Views by Each Thesis
    const totalViewsByThesis = await prisma.thesisView.groupBy({
      by: ['thesis_id'],
      _count: {
        thesis_id: true, // Count views for each thesis
      },
    })

    const viewDetails = await prisma.thesis.findMany({
      where: {
        thesis_id: {
          in: totalViewsByThesis.map(item => item.thesis_id),
        },
      },
      select: {
        thesis_id: true,
        title: true,
        category: true, // Assume category is AI, ML, or NLP
      },
    })

    const viewData = totalViewsByThesis.map(item => {
      const thesis = viewDetails.find(
        thesis => thesis.thesis_id === item.thesis_id
      )
      return {
        title: thesis?.title || 'Unknown Thesis',
        category: thesis?.category || 'Unknown Category',
        views: item._count.thesis_id,
      }
    })

    const totalViews = totalViewsByThesis.reduce(
      (acc, item) => acc + item._count.thesis_id,
      0
    )

    // Group views by category
    const viewsByCategory = viewData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.views
      return acc
    }, {})

    // 2. Total Downloads by Each Thesis
    const totalDownloadsByThesis = await prisma.thesisDownload.groupBy({
      by: ['thesis_id'],
      _count: {
        thesis_id: true, // Count downloads for each thesis
      },
    })

    const downloadDetails = await prisma.thesis.findMany({
      where: {
        thesis_id: {
          in: totalDownloadsByThesis.map(item => item.thesis_id),
        },
      },
      select: {
        thesis_id: true,
        title: true,
        category: true, // Assume category is AI, ML, or NLP
      },
    })

    const downloadData = totalDownloadsByThesis.map(item => {
      const thesis = downloadDetails.find(
        thesis => thesis.thesis_id === item.thesis_id
      )
      return {
        title: thesis?.title || 'Unknown Thesis',
        category: thesis?.category || 'Unknown Category',
        downloads: item._count.thesis_id,
      }
    })

    const totalDownloads = totalDownloadsByThesis.reduce(
      (acc, item) => acc + item._count.thesis_id,
      0
    )

    // Group downloads by category
    const downloadsByCategory = downloadData.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.downloads
      return acc
    }, {})

    // 3. Total Users
    const totalUsers = await prisma.user.count()

    // 4. Total Theses
    const totalTheses = await prisma.thesis.count()

    // 5. Under-review Theses (status: 'Pending')
    const underReviewTheses = await prisma.thesis.count({
      where: {
        status: 'Pending',
      },
    })

    // 6. Views and Downloads by Day (Last 7 Days)
    const viewsByDay = await prisma.thesisView.groupBy({
      by: ['date'],
      _count: {
        date: true,
      },
      orderBy: { date: 'asc' },
    })

    const downloadsByDay = await prisma.thesisDownload.groupBy({
      by: ['date'],
      _count: {
        date: true,
      },
      orderBy: { date: 'asc' },
    })

    const viewsAndDownloadsByDay = viewsByDay.map(view => {
      const downloads = downloadsByDay.find(
        download => download.date === view.date
      )
      return {
        date: view.date,
        views: view._count.date,
        downloads: downloads?._count.date || 0,
      }
    })

    // Return all statistics in the response
    return NextResponse.json(
      {
        totalUsers,
        totalTheses,
        underReviewTheses,
        totalViews,
        totalDownloads,
        viewsByCategory,
        downloadsByCategory,
        viewsAndDownloadsByDay,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { message: 'Error fetching statistics', error: error.message },
      { status: 500 }
    )
  }
}
