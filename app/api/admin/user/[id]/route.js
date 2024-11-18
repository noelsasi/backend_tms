import { withRolePermission } from "../../../../lib/middleware";
import { NextResponse } from "next/server"; // Import NextResponse
import prisma from "../../../../lib/db"; // Importing the Prisma client
import bcrypt from "bcryptjs"; // For password hashing
import { z } from "zod"; // For validation
import { getUserFromSession } from "@/app/lib/currentSesion";

const updateUserSchema = z.object({
  email: z.string().email().optional(), // Email is optional for update
  firstname: z.string().min(1).optional(),
  lastname: z.string().min(1).optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dob: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date",
    })
    .optional(),
  phone: z.string().min(10).max(15).optional(),
  address: z.string().min(1).optional(),
  profilePic: z.string().url().optional(),
  role_name: z.enum(["user", "admin", "scholar"]).optional(), // Role validation (optional for update)
  password: z.string().min(6).optional(), // Password is optional for update
});

export const PUT = withRolePermission("MODIFY_USER")(
  async (req, { params }) => {
    const { id } = await params; // Extract user ID from URL params
    let body;
    const currentUser = await getUserFromSession(req);
    try {
      // Step 1: Parse incoming request body
      body = await req.json();

      if (!body) {
        return NextResponse.json(
          { message: "Request body is empty or malformed" },
          { status: 400 }
        );
      }

      // Step 2: Validate the request body with Zod schema
      const parsedBody = updateUserSchema.parse(body);

      // Step 3: Check if the user exists in the database
      const existingUser = await prisma.user.findUnique({
        where: { id: BigInt(id) },
      });

      if (!existingUser) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      // Step 4: Check if the email already exists (but not for the current user)
      if (parsedBody.email && parsedBody.email !== existingUser.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: parsedBody.email },
        });

        if (emailTaken) {
          return NextResponse.json(
            { message: "Email already in use" },
            { status: 400 }
          );
        }
      }

      // Step 5: If password is provided, hash it
      let hashedPassword = existingUser.password_hash; // Default to current password

      if (parsedBody.password) {
        hashedPassword = await bcrypt.hash(parsedBody.password, 10);
      }

      // Step 6: If role_name is provided, update the role
      let roleId = existingUser.role_id;

      if (parsedBody.role_name) {
        const role = await prisma.role.findFirst({
          where: {
            role_name: parsedBody.role_name,
          },
        });

        if (!role) {
          return NextResponse.json(
            { message: "Invalid role" },
            { status: 400 }
          );
        }

        roleId = role.id;
      }

      // Step 7: Update the user in the database
      const updatedUser = await prisma.user.update({
        where: { id: BigInt(id) },
        data: {
          email: parsedBody.email || existingUser.email,
          firstname: parsedBody.firstname || existingUser.firstname,
          lastname: parsedBody.lastname || existingUser.lastname,
          gender: parsedBody.gender || existingUser.gender,
          dob: parsedBody.dob ? new Date(parsedBody.dob) : existingUser.dob,
          phone: parsedBody.phone || existingUser.phone,
          address: parsedBody.address || existingUser.address,
          profilePic: parsedBody.profilePic || existingUser.profilePic,
          password_hash: hashedPassword, // Update password if provided
          role_id: roleId, // Update role if provided
        },
      });
      await prisma.history.create({
        data: {
          user_id: currentUser.id, // ID of the admin or user performing the action
          action: "Updated User",
          description: `User with email ${updatedUser.email} updated by ${currentUser.email}`,
        },
      });

      // Step 8: Respond with success
      return NextResponse.json({
        message: "User updated successfully",
        user: {
          id: updatedUser.id.toString(),
          email: updatedUser.email,
          firstname: updatedUser.firstname,
          lastname: updatedUser.lastname,
        },
      });
    } catch (error) {
      // Step 9: Handle errors and provide detailed responses
      console.error("Error during user update:", error.message || error);

      if (error instanceof z.ZodError) {
        // If validation fails, return a detailed validation error
        return NextResponse.json(
          { message: "Validation failed", errors: error.errors },
          { status: 400 }
        );
      }

      // If an unknown error occurs, return internal server error
      return NextResponse.json(
        { message: "Internal Server Error", error: error.message || error },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withRolePermission("DELETE_USER")(
  async (req, { params }) => {
    // Await params before accessing `id`
    const { id } = await params;
    const currentUser = await getUserFromSession(req);
    try {
      // Check if the user exists in the database
      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(id), // Ensure ID is a BigInt
        },
      });

      if (!user) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      // Perform the deletion
      await prisma.user.delete({
        where: {
          id: BigInt(id),
        },
      });
      await prisma.history.create({
        data: {
          user_id: currentUser.id, // ID of the admin or user performing the action
          action: "Deleted User",
          description: `User with email ${user.email} deleted by ${currentUser.email}`,
        },
      });

      // Respond with success message
      return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error during user deletion:", error.message || error);
      return NextResponse.json(
        { message: "Internal Server Error", error: error.message || error },
        { status: 500 }
      );
    }
  }
);
