import prisma from "../../../lib/db"; // Assuming Prisma is set up
import { NextResponse } from "next/server"; // Use NextResponse for Edge functions

export async function POST(req) {
  const body = await req.json(); // Parse the request body
  const { thesisId, ipAddress } = body; // Extract thesisId and ipAddress from the body

  if (!thesisId || !ipAddress) {
    return NextResponse.json(
      { message: "Thesis ID and IP address are required" },
      { status: 400 }
    );
  }

  try {
    // Check if the user has already downloaded this thesis in the last 24 hours
    const existingDownload = await prisma.thesisDownload.findFirst({
      where: {
        thesis_id: BigInt(thesisId), // Ensure thesisId is handled as BigInt
        ip_address: ipAddress,
        created_at: {
          gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
        },
      },
    });

    if (!existingDownload) {
      // If no record exists, create a new download entry
      await prisma.thesisDownload.create({
        data: {
          thesis_id: BigInt(thesisId),
          ip_address: ipAddress,
        },
      });

      // Increment the thesis download count
      await prisma.thesis.update({
        where: { thesis_id: BigInt(thesisId) },
        data: { downloads_count: { increment: 1 } },
      });
    }

    // Fetch the updated downloads count for the thesis
    const thesis = await prisma.thesis.findUnique({
      where: { thesis_id: BigInt(thesisId) },
      select: { downloads_count: true },
    });

    // Return the updated download count
    return NextResponse.json({ downloads: thesis.downloads_count });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error tracking download", error: error.message },
      { status: 500 }
    );
  }
}
