import prisma from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
    let body;
    body = await req.json();
   
    console.log(body);
    // Ensure email is provided
    
  try {
    // Parse the request body to extract the token and newPassword
   

    const { token, newPassword } = body;

    // Ensure both token and newPassword are provided
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    // Find the user by the reset token
    const user = await prisma.user.findFirst({
      where: { resetToken: token },
    });

    // If no user is found or the token has expired
    if (!user || new Date(user.resetTokenExpires) < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the reset token fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    // Return a success message
    return NextResponse.json({ message: 'Password has been reset successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error processing password reset request:', error);

    // Return a server error response
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
