import { withRolePermission } from "@/app/lib/middleware";
import { NextResponse } from "next/server"; // Import NextResponse
import prisma from "@/app/lib/db"; // Importing the Prisma client

import { z } from "zod"; // For validation
import { getUserFromSession } from "@/app/lib/currentSesion";
const updateGuidelineSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    file_url: z.string().url().optional(), // Optional file URL
  });
export const PUT = withRolePermission("MODIFY_GUIDELINE")(async (req, { params }) => {
    const { id } = await params;
  
  
    try {
      const body = await req.json();
  
      if (!body) {
        return NextResponse.json({ message: "Request body is empty or malformed" }, { status: 400 });
      }
  
      // Validate the request body for updating the guideline
      const parsedBody = updateGuidelineSchema.parse(body);
  
      // Find the guideline by ID
      const existingGuideline = await prisma.guidelines.findUnique({
        where: { id: BigInt(id) },
      });
  
      if (!existingGuideline) {
        return NextResponse.json({ message: "Guideline not found" }, { status: 404 });
      }
  
      // Update the guideline
      const updatedGuideline = await prisma.guidelines.update({
        where: { id: BigInt(id) },
        data: {
          title: parsedBody.title,
          description: parsedBody.description,
          file_url: parsedBody.file_url || "", // Update file URL (optional)
        },
      });
      const guidelineResponse = {
        id: updatedGuideline.id.toString(),  // Convert BigInt to string
        title: updatedGuideline.title,
        description: updatedGuideline.description,
        file_url: updatedGuideline.file_url,
        created_at: updatedGuideline.created_at.toISOString(),  // Convert Date to ISO string
        updated_at: updatedGuideline.updated_at.toISOString(),  // Convert Date to ISO string
      };
      // Log the action in the history table
      const currentUser = await getUserFromSession(req);
      await prisma.history.create({
        data: {
          user_id: currentUser.id, // The ID of the user who performed the action
          action: "Updated Guideline",
          description: `Guideline titled "${updatedGuideline.title}" updated by ${currentUser.email}`,
        },
      });
  
      return NextResponse.json({
        message: "Guideline updated successfully",
        guideline: guidelineResponse,
      });
    } catch (error) {
      console.error("Error during guideline update:", error.message || error);
  
      if (error instanceof z.ZodError) {
        return NextResponse.json({ message: "Validation failed", errors: error.errors }, { status: 400 });
      }
  
      return NextResponse.json({ message: "Internal Server Error", error: error.message || error }, { status: 500 });
    }
  });
  
  // Handle DELETE request to delete a guideline by its ID
  export const DELETE = withRolePermission("DELETE_GUIDELINE")(async (req, { params }) => {
    const { id } = await params;
  
    try {
      const guideline = await prisma.guidelines.findUnique({
        where: { id: BigInt(id) },
      });
  
      if (!guideline) {
        return NextResponse.json({ message: "Guideline not found" }, { status: 404 });
      }
  
      await prisma.guidelines.delete({
        where: { id: BigInt(id) },
      });
  
      // Log the action in the history table
      const currentUser = await getUserFromSession(req);
      await prisma.history.create({
        data: {
          user_id: currentUser.id, // The ID of the user who performed the action
          action: "Deleted Guideline",
          description: `Guideline titled "${guideline.title}" deleted by ${currentUser.email}`,
        },
      });
  
      return NextResponse.json({ message: "Guideline deleted successfully" });
    } catch (error) {
      console.error("Error during guideline deletion:", error.message || error);
      return NextResponse.json({ message: "Internal Server Error", error: error.message || error }, { status: 500 });
    }
  });