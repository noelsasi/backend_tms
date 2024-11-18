// app/api/admin/create/route.js

import { withRolePermission } from '../../../lib/middleware'
import { NextResponse } from 'next/server' // Import NextResponse
import prisma from '../../../lib/db' // Importing the Prisma client
import bcrypt from 'bcryptjs' // For password hashing
import { z } from 'zod' // For validation
import { getUserFromSession } from '../../../lib/currentSesion'

// Zod schema for validating request body
const createUserSchema = z.object({
  email: z.string().email(), // Validate email format
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  gender: z.enum(['male', 'female', 'other']), // Gender validation
  dob: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }), // Validate date format
  phone: z.string().min(10).max(15), // Validate phone length
  address: z.string().min(1),
  profilePic: z.string().url().optional(), // Profile picture (optional)
  role_name: z.enum(['user', 'admin', 'scholar']), // Role validation
})

// Handle GET request
export async function GET(req) {
  try {
    // Fetching the user data along with their role
    const users = await prisma.user.findMany({
      include: {
        role: {
          select: {
            role_name: true, // Fetching role_name from Role table
          },
        },
      },
    })

    // Formatting the fetched user data to include necessary fields
    const formattedUsers = users.map(user => ({
      id: user.id.toString(),
      firstname: user.firstname,
      lastname: user.lastname,
      gender: user.gender,
      dob: user.dob,
      phone: user.phone,
      profilePic: user.profilePic,
      address: user.address,
      email: user.email,
      role: user.role.role_name, // Display the role name, not the ID
      status: user.verified ? 'Verified' : 'Unverified', // Showing verified status as text
    }))

    // Sending the formatted user data as a JSON response
    return NextResponse.json(formattedUsers) // Return status 200 by default
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: 'Error fetching user list' },
      { status: 500 }
    ) // Return 500 error if something goes wrong
  }
}

// Handle POST request with middleware
export const POST = withRolePermission('CREATE_USER')(async req => {
  // Your actual POST request logic
  let body

  try {
    // Step 1: Parse incoming request body
    body = await req.json()

    if (!body) {
      return NextResponse.json(
        { message: 'Request body is empty or malformed' },
        { status: 400 }
      )
    }

    // Step 2: Validate the request body with Zod schema
    const parsedBody = createUserSchema.parse(body) // Throws error if validation fails
    const currentUser = await getUserFromSession(req)
    // Step 3: Check if email already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { email: parsedBody.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already in use' },
        { status: 400 }
      )
    }

    // Step 4: Generate the password (default + role_name)
    const password = `default${parsedBody.role_name}`

    // Step 5: Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10) // 10 rounds of salt for hashing

    // Step 6: Find the role in the database using the role_name
    const role = await prisma.role.findFirst({
      where: {
        role_name: parsedBody.role_name, // Match role by name
      },
    })

    if (!role) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 })
    }

    // Step 7: Create the new user in the database
    const user = await prisma.user.create({
      data: {
        username: parsedBody.email, // Set email as the username (or could be unique ID if preferred)
        email: parsedBody.email,
        password_hash: hashedPassword, // Store hashed password
        firstname: parsedBody.firstname,
        lastname: parsedBody.lastname,
        gender: parsedBody.gender,
        dob: new Date(parsedBody.dob), // Convert string date to Date object
        phone: parsedBody.phone,
        address: parsedBody.address,
        profilePic: parsedBody.profilePic || '', // Optional, if not provided, use empty string
        role_id: role.id, // Associate user with role using role ID
        verified: false, // Set default verified status to false
      },
    })
    await prisma.history.create({
      data: {
        user_id: currentUser.id, // ID of the admin or user performing the action
        action: 'Created User',
        description: `User with email ${user.email} created by ${currentUser.email}`,
      },
    })

    // Step 8: Respond with success message (excluding password_hash)
    return NextResponse.json({
      message: 'User created successfully',
      user: {
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    })
  } catch (error) {
    // Step 9: Handle errors and provide detailed responses
    console.error('Error during user creation:', error.message || error)

    if (error instanceof z.ZodError) {
      // If validation fails, return a detailed validation error
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      )
    }

    // If an unknown error occurs, return internal server error
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message || error },
      { status: 500 }
    )
  }
})
