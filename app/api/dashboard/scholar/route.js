import { NextResponse } from 'next/server'
import prisma from '../../../lib/db' // Prisma client instance

export async function GET() {
  try {
    // 1. Total Views by Each Thesis
    const totalViewsByThesis = await prisma.thesisView.groupBy({
      by: ['thesis_id'],
      _count: {
        thesis_id: true,
      },
    })

    const thesisDetails = await prisma.thesis.findMany({
      where: {
        thesis_id: {
          in: totalViewsByThesis.map(item => item.thesis_id),
        },
      },
      select: {
        thesis_id: true,
        title: true,
        category: true, // Assume categories: AI, ML, NLP
      },
    })

    const viewData = totalViewsByThesis.map(item => {
      const thesis = thesisDetails.find(
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

    // Group views by category (for donut chart)
    const viewsByCategory = viewData.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.views
        acc['Total'] += item.views
        return acc
      },
      { Total: 0, AI: 0, ML: 0, NLP: 0 }
    )

    // 2. Total Downloads by Each Thesis
    const totalDownloadsByThesis = await prisma.thesisDownload.groupBy({
      by: ['thesis_id'],
      _count: {
        thesis_id: true,
      },
    })

    const downloadData = totalDownloadsByThesis.map(item => {
      const thesis = thesisDetails.find(
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

    // Group downloads by category (for donut chart)
    const downloadsByCategory = downloadData.reduce(
      (acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.downloads
        acc['Total'] += item.downloads
        return acc
      },
      { Total: 0, AI: 0, ML: 0, NLP: 0 }
    )

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

    // 6. Views and Downloads by Day of Week
    const viewsByDay = await prisma.thesisView.groupBy({
      by: ['dayOfWeek'], // Assuming dayOfWeek field exists (e.g., "Monday", "Tuesday")
      _count: {
        dayOfWeek: true,
      },
    })

    const downloadsByDay = await prisma.thesisDownload.groupBy({
      by: ['dayOfWeek'], // Assuming dayOfWeek field exists
      _count: {
        dayOfWeek: true,
      },
    })

    const weeklyData = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ].map(day => {
      const views =
        viewsByDay.find(item => item.dayOfWeek === day)?._count.dayOfWeek || 0
      const downloads =
        downloadsByDay.find(item => item.dayOfWeek === day)?._count.dayOfWeek ||
        0
      return { day, views, downloads }
    })

    // Response JSON structure
    return NextResponse.json(
      {
        totalViews,
        totalDownloads,
        totalUsers,
        totalTheses,
        underReviewTheses,
        viewsByCategory,
        downloadsByCategory,
        weeklyData, // Views and downloads per day of week
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
