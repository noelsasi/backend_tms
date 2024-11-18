import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { z } from "zod";

// Validation schema for enquiry form
const enquirySchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email().max(50),
  message: z.string().min(1),
  subject: z.string().min(1).max(100)
});

// GET all enquiries
export async function GET() {
  try {
    const enquiries = await prisma.enquiryForm.findMany({
      orderBy: {
        created_at: 'desc'
      }
    });

    // Convert BigInt to string for JSON serialization
    const serializedEnquiries = enquiries.map(enquiry => ({
      id: enquiry.id.toString(),
      name: enquiry.name,
      email: enquiry.email,
      message: enquiry.message,
      subject: enquiry.subject,
      created_at: enquiry.created_at.toISOString(),
      updated_at: enquiry.updated_at.toISOString()
    }));

    return NextResponse.json(serializedEnquiries);
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    return NextResponse.json(
      { message: 'Error fetching enquiries', error: error.message },
      { status: 500 }
    );
  }
}

// POST new enquiry
export async function POST(req) {
  try {
    // Parse request body
    const body = await req.json();
    
    if (!body) {
      return NextResponse.json(
        { message: 'Request body is empty or malformed' },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = enquirySchema.parse(body);

    // Create new enquiry
    const enquiry = await prisma.enquiryForm.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        message: validatedData.message,
        subject: validatedData.subject
      }
    });

    // Format response
    const response = {
      id: enquiry.id.toString(),
      name: enquiry.name,
      email: enquiry.email,
      message: enquiry.message,
      subject: enquiry.subject,
      created_at: enquiry.created_at.toISOString(),
      updated_at: enquiry.updated_at.toISOString()
    };

    return NextResponse.json({
      message: 'Enquiry submitted successfully',
      enquiry: response
    });
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    return NextResponse.json(
      { message: 'Error submitting enquiry', error: error.message },
      { status: 500 }
    );
  }
} 