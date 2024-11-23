import { NextResponse } from 'next/server'
import prisma from '../../../lib/db'
import bcrypt from 'bcryptjs' // For password hashing
import { z } from 'zod' // For validation

// Zod schema for validating request body
const signupSchema = z.object({
  email: z.string().email(), // Validate email format
  password: z.string().min(8), // Password must be at least 8 characters
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  gender: z.enum(['male', 'female', 'other']), // Assuming fixed gender values
  dob: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }), // Validate date format
  phone: z.string().min(10).max(15), // Validate phone length
  address: z.string().min(1),
  profilePic: z.string().url(),
  role: z.enum(['user', 'admin', 'scholar']), // Role validation (can be extended based on your needs)
})

export async function POST(req) {
  let body

  try {
    // Parse request body
    body = await req.json()

    if (!body) {
      // Return error if body is null or empty
      return NextResponse.json(
        { message: 'Request body is empty or malformed' },
        { status: 400 }
      )
    }

    // Validate body using Zod schema
    const parsedBody = signupSchema.parse(body) // Throws error if validation fails

    // Check if email already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedBody.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already in use' },
        { status: 400 }
      )
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(parsedBody.password, 10)

    // Find the role (use findFirst instead of findUnique)
    const role = await prisma.role.findFirst({
      where: {
        role_name: parsedBody.role, // Match the role by name
      },
    })

    if (!role) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 })
    }

    // Create the user in the database
    const user = await prisma.user.create({
      data: {
        username: parsedBody.email,
        email: parsedBody.email,
        password_hash: hashedPassword,
        firstname: parsedBody.firstname,
        lastname: parsedBody.lastname,
        gender: parsedBody.gender,
        dob: new Date(parsedBody.dob),
        phone: parsedBody.phone,
        address: parsedBody.address,
        profilePic: parsedBody.profilePic,
        role_id: role.id, // Assign role ID
      },
    })

    // Respond with success
    return NextResponse.json({
      message: 'User signed up successfully',
      user: {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    })
  } catch (error) {
    // Improved error handling and logging
    console.error('Error during signup:', error.message || error)

    if (error instanceof z.ZodError) {
      // Validation error
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      )
    }

    // Handle other types of errors
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message || error },
      { status: 500 }
    )
  }
}
