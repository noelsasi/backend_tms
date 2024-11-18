import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import prisma from '../../../lib/db';
import { NextResponse } from 'next/server';

const transporter = nodemailer.createTransport({
  host: 'mail.sxb3349.uta.cloud',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendVerificationEmail = async (email, token) => {
  console.log(
    'email', email,
    'token', token
  )
  const verificationUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/verify?token=${token}&email=${email}`;

  const message = {
    from: 'no-reply@uta.cloud',
    to: email,
    subject: 'Please verify your email',
    html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email address.</p>`,
  };

  try {

    await transporter.sendMail(message);
  } catch (error) {
    console.error('Error sending verification email', error);
    throw new Error('Failed to send verification email');
  }
};

export async function POST(req, res) {
  if (req.method === 'POST') {
    let body;
    body = await req.json();
    const { email } = body;
    console.log(body);

    // Validate if email is provided
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
      // Check if user exists in the database
      const user = await prisma.user.findUnique({
        where: { email: email },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Create a random verification token
      const token = randomBytes(20).toString('hex');

      // Save the token in the database
      await prisma.user.update({
        where: { email: email },
        data: {
          verificationToken: token,
          verificationTokenExpires: new Date(Date.now() + 3600000), // 1 hour expiry
        },
      });

      try {
        // Send the verification email
        await sendVerificationEmail(email, token);
        return NextResponse.json({ message: 'Verification email sent' });
      } catch (error) {
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    } catch (error) {
      console.error('Error querying user', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
}
