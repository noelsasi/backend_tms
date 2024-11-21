import { NextResponse } from 'next/server'
import prisma from '../../../lib/db' // Prisma client instance
import { getUserFromSession } from '../../../lib/currentSesion'

export async function GET(request) {
  try {
    // Step 1: Get the authenticated user
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // 2. Get the theses authored by the authenticated user
    const userTheses = await prisma.thesis.findMany({
      where: {
        author_id: user.id,
      },
      select: {
        thesis_id: true,
        title: true,
        category: true, // Categories: AI, ML, NLP
        status: true, // For filtering under-review theses
      },
    })

    // Get thesis IDs for filtering views and downloads
    const userThesisIds = userTheses.map(thesis => thesis.thesis_id)

    // 3. Total Views by Each Thesis (for user’s theses)
    const totalViewsByUserThesis = await prisma.thesisView.groupBy({
      by: ['thesis_id'],
      where: {
        thesis_id: { in: userThesisIds },
      },
      _count: {
        thesis_id: true, // Count views for each thesis
      },
    })

    const viewData = totalViewsByUserThesis.map(item => {
      const thesis = userTheses.find(
        thesis => thesis.thesis_id === item.thesis_id
      )
      return {
        title: thesis?.title || 'Unknown Thesis',
        category: thesis?.category || 'Unknown Category',
        views: item._count.thesis_id,
      }
    })

    // Total Views (cumulative) for user’s theses
    const totalViews = totalViewsByUserThesis.reduce(
      (acc, item) => acc + item._count.thesis_id,
      0
    )

    // Group views by category
    const viewsByCategory = viewData.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.views
        acc['Total'] += item.views
        return acc
      },
      { Total: 0, AI: 0, ML: 0, NLP: 0 }
    )

    // Most Viewed Theses (Top 5)
    const mostViewedTheses = viewData
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // 4. Total Downloads by Each Thesis (for user’s theses)
    const totalDownloadsByUserThesis = await prisma.thesisDownload.groupBy({
      by: ['thesis_id'],
      where: {
        thesis_id: { in: userThesisIds },
      },
      _count: {
        thesis_id: true, // Count downloads for each thesis
      },
    })

    const downloadData = totalDownloadsByUserThesis.map(item => {
      const thesis = userTheses.find(
        thesis => thesis.thesis_id === item.thesis_id
      )
      return {
        title: thesis?.title || 'Unknown Thesis',
        category: thesis?.category || 'Unknown Category',
        downloads: item._count.thesis_id,
      }
    })

    // Total Downloads (cumulative) for user’s theses
    const totalDownloads = totalDownloadsByUserThesis.reduce(
      (acc, item) => acc + item._count.thesis_id,
      0
    )

    // Group downloads by category
    const downloadsByCategory = downloadData.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.downloads
        acc['Total'] += item.downloads
        return acc
      },
      { Total: 0, AI: 0, ML: 0, NLP: 0 }
    )

    // Most Downloaded Theses (Top 5)
    const mostDownloadedTheses = downloadData
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 5)

    // 5. Total Theses submitted by the user
    const totalUserTheses = userTheses.length

    // 6. Under-review Theses by the user
    const underReviewUserTheses = userTheses.filter(
      thesis => thesis.status === 'Pending'
    ).length

    // 7. Views and Downloads by Day (Last 7 Days)
    const viewsByDay = await prisma.thesisView.groupBy({
      by: ['date'],
      where: {
        thesis_id: { in: userThesisIds },
      },
      _count: {
        date: true,
      },
      orderBy: { date: 'asc' },
    })

    const downloadsByDay = await prisma.thesisDownload.groupBy({
      by: ['date'],
      where: {
        thesis_id: { in: userThesisIds },
      },
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
        totalUserTheses,
        underReviewUserTheses,
        totalViews,
        totalDownloads,
        viewsByCategory,
        downloadsByCategory,
        mostViewedTheses,
        mostDownloadedTheses,
        viewsAndDownloadsByDay,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching user statistics:', error)
    return NextResponse.json(
      { message: 'Error fetching user statistics', error: error.message },
      { status: 500 }
    )
  }
}
