import { NextResponse } from 'next/server'
import prisma from '../../../lib/db' // Assuming Prisma is set up

export async function POST(req, res) {
  const body = await req.json()
  const { thesisId, ipAddress } = body // Extract thesisId and ipAddress from the body

  if (!thesisId || !ipAddress) {
    return NextResponse.json(
      { message: 'Thesis ID and IP address are required' },
      { status: 400 }
    )
  }

  try {
    // Check if the user has already viewed this thesis in the last 24 hours
    const existingView = await prisma.thesisView.findFirst({
      where: {
        thesis_id: BigInt(thesisId), // Ensure you are passing BigInt properly
        ip_address: ipAddress,
        viewed_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      },
    })

    if (!existingView) {
      // If no record exists, create a new view entry
      await prisma.thesisView.create({
        data: {
          thesis_id: BigInt(thesisId),
          ip_address: ipAddress,
        },
      })

      // Increment the thesis view count
      await prisma.thesis.update({
        where: { thesis_id: BigInt(thesisId) },
        data: {
          views_count: {
            increment: 1,
          },
        },
      })

      // Return the updated views count
      const updatedThesis = await prisma.thesis.findUnique({
        where: { thesis_id: BigInt(thesisId) },
        select: { views_count: true },
      })

      return NextResponse.json({ views: updatedThesis.views_count })
    } else {
      // If the view already exists within 24 hours, just return the current count
      const currentThesis = await prisma.thesis.findUnique({
        where: { thesis_id: BigInt(thesisId) },
        select: { views_count: true },
      })

      return NextResponse.json({ views: currentThesis.views_count })
    }
  } catch (error) {
    console.error(error)
    NextResponse.json(
      { message: 'Error tracking view', error: error.message },
      { status: 500 }
    )
  }
}
