// import nodemailer from "nodemailer";
// import { randomBytes } from "crypto";
// import prisma from "../../../lib/db";
// import { NextResponse } from "next/server";

// // Create a Nodemailer transporter using the correct SMTP settings
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST, // SMTP host, e.g. 'smtp.mailtrap.io' or your SMTP server
//   port: parseInt(process.env.SMTP_PORT), // SMTP port, e.g. 587 or 465 for secure connection
//   secure: process.env.SMTP_SECURE === "true", // True for SSL/TLS, False for non-secure connection
//   auth: {
//     user: process.env.SMTP_USER, // SMTP username
//     pass: process.env.SMTP_PASS, // SMTP password
//   },
// });

// // Function to send the password reset email
// const sendPasswordResetEmail = async (email, token) => {
//   const resetUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/reset-password?token=${token}`;

//   const message = {
//     from: "no-reply@scholarvault.com", // The email from which the password reset is sent
//     to: email, // The recipient's email address
//     subject: "Password Reset Request",
//     html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
//   };

//   try {
//     await transporter.sendMail(message);
//   } catch (error) {
//     console.error("Error sending password reset email", error);
//     throw new Error("Failed to send password reset email");
//   }
// };

// export async function POST(req, res) {
//   if (req.method === "POST") {
//     let body;
//     body = await req.json();
//     const { email } = body;
//     console.log(body);
//     // Ensure email is provided
//     if (!email) {
//       return NextResponse.json({ error: "Email is required" }, { status: 400 });
//     }

//     try {
//       // Check if user exists in the database
//       const user = await prisma.user.findUnique({ where: { email } });

//       if (!user) {
//         return NextResponse.json({ error: "User not found" }, { status: 404 });
//       }

//       // Create a secure random token for password reset
//       const token = randomBytes(20).toString("hex");

//       // Save the token and its expiration time (1 hour expiry)
//       await prisma.user.update({
//         where: { email },
//         data: {
//           resetToken: token,
//           resetTokenExpires: new Date(Date.now() + 3600000), // Token expires in 1 hour
//         },
//       });

//       // Send the password reset email
//       await sendPasswordResetEmail(email, token);

//       // Respond with a success message
//       return NextResponse.json(
//         { message: "Password reset email sent" },
//         { status: 200 }
//       );
//     } catch (error) {
//       console.error("Error processing password reset request", error);
//       return NextResponse.json(
//         { error: "Internal server error" },
//         { status: 500 }
//       );
//     }
//   } else {
//     // If the method is not POST, return Method Not Allowed
//     return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
//   }
// }
import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto'
import prisma from '../../../lib/db'
import { NextResponse } from 'next/server'

// Create a Nodemailer transporter using the correct SMTP settings
const transporter = nodemailer.createTransport({
  host: 'mail.sxb3349.uta.cloud', // SMTP host, e.g. 'smtp.mailtrap.io' or your SMTP server
  port: 465, // SMTP port, e.g. 587 or 465 for secure connection
  secure: true, // True for SSL/TLS, False for non-secure connection
  auth: {
    user: process.env.SMTP_USER, // SMTP username
    pass: process.env.SMTP_PASS, // SMTP password
  },
})

// Function to send the password reset email
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/reset?token=${token}`

  const message = {
    from: 'no-reply@uta.cloud', // The email from which the password reset is sent
    to: email, // The recipient's email address
    subject: 'Password Reset Request',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
  }

  try {
    await transporter.sendMail(message)
  } catch (error) {
    console.error('Error sending password reset email', error)
    throw new Error('Failed to send password reset email')
  }
}

// Main handler for POST requests
export async function POST(req) {
  let body
  try {
    // Parse request body
    body = await req.json()
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { email } = body

  // Ensure email is provided
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  // Optionally validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
  }

  try {
    // Check if user exists in the database
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create a secure random token for password reset
    const token = randomBytes(20).toString('hex')

    // Save the token and its expiration time (1 hour expiry)
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpires: new Date(Date.now() + 3600000), // Token expires in 1 hour
      },
    })

    // Send the password reset email
    await sendPasswordResetEmail(email, token)

    // Respond with a success message
    return NextResponse.json(
      { message: 'Password reset email sent' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error processing password reset request', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
