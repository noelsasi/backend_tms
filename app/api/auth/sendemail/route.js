// // import nodemailer from 'nodemailer';
// // import { randomBytes } from 'crypto';
// // import prisma from '../../../lib/db';

// // const transporter = nodemailer.createTransport({
// //   host: 'smtp.mailtrap.io', // Example: Use Mailtrap or your preferred SMTP service
// //   port: 587,
// //   auth: {
// //     user: process.env.SMTP_USER,
// //     pass: process.env.SMTP_PASS,
// //   },
// // });

// // const sendVerificationEmail = async (email, token) => {
// //   const verificationUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/verify-email?token=${token}`;

// //   const message = {
// //     from: 'no-reply@example.com',
// //     to: email,
// //     subject: 'Please verify your email',
// //     html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email address.</p>`,
// //   };

// //   try {
// //     await transporter.sendMail(message);
// //   } catch (error) {
// //     console.error('Error sending verification email', error);
// //     throw new Error('Failed to send verification email');
// //   }
// // };

// // export default async function handler(req, res) {
// //   if (req.method === 'POST') {
// //     const { email } = req.body;

// //     // Check if user exists
// //     const user = await prisma.user.findUnique({ where: { email } });

// //     if (!user) {
// //       return res.status(404).json({ error: 'User not found' });
// //     }

// //     // Create a random verification token (or JWT)
// //     const token = randomBytes(20).toString('hex');

// //     // Save the token in the database
// //     await prisma.user.update({
// //       where: { email },
// //       data: { verificationToken: token, verificationTokenExpires: new Date(Date.now() + 3600000) }, // 1 hour expiry
// //     });

// //     try {
// //       // Send email
// //       await sendVerificationEmail(email, token);
// //       res.status(200).json({ message: 'Verification email sent' });
// //     } catch (error) {
// //       res.status(500).json({ error: 'Failed to send email' });
// //     }
// //   } else {
// //     res.status(405).json({ error: 'Method not allowed' });
// //   }
// // }
// import nodemailer from 'nodemailer';
// import { randomBytes } from 'crypto';
// import prisma from '../../../lib/db';

// // Create a nodemailer transporter using your SMTP details
// const transporter = nodemailer.createTransport({
//   host: 'mail.sxb3349.uta.cloud',  // Outgoing SMTP server host
//   port: 465,                      // SMTP port for SSL (secure connection)
//   secure: true,                   // Set to true for SSL/TLS connection
//   auth: {
//     user: process.env.SMTP_USER,  // SMTP username (provided by your email service)
//     pass: process.env.SMTP_PASS,  // SMTP password (provided by your email service)
//   },
// });

// const sendVerificationEmail = async (email, token) => {
//   const verificationUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/verify-email?token=${token}`;

//   const message = {
//     from: 'no-reply@yourdomain.com', // Replace with a valid "from" email address
//     to: email,
//     subject: 'Please verify your email',
//     html: `
//       <p>Click <a href="${verificationUrl}">here</a> to verify your email address.</p>
//     `,
//   };

//   try {
//     // Send the email
//     await transporter.sendMail(message);
//   } catch (error) {
//     console.error('Error sending verification email', error);
//     throw new Error('Failed to send verification email');
//   }
// };

// export  async function POST(req, res) {
//   if (req.method === 'POST') {
//     const { email } = req.body;

//     // Check if the user exists in the database
//     const user = await prisma.user.findUnique({ where: { email } });

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Create a random verification token (using crypto for randomness)
//     const token = randomBytes(20).toString('hex');

//     // Save the token in the database (with an expiration time of 1 hour)
//     await prisma.user.update({
//       where: { email },
//       data: {
//         verificationToken: token,
//         verificationTokenExpires: new Date(Date.now() + 3600000), // 1 hour expiry
//       },
//     });

//     try {
//       // Send the verification email with the tokenized URL
//       await sendVerificationEmail(email, token);
//       return res.status(200).json({ message: 'Verification email sent' });
//     } catch (error) {
//       return res.status(500).json({ error: 'Failed to send email' });
//     }
//   } else {
//     // Handle unsupported HTTP methods (only POST is allowed)
//     res.status(405).json({ error: 'Method not allowed' });
//   }
// }
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import prisma from '../../../lib/db';
import { NextResponse } from 'next/server';

const transporter = nodemailer.createTransport({
  host: 'mail.sxb3349.uta.cloud', // Use your SMTP server here
  port: 465,
  // secure: true, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/verify?token=${token}`;

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

export  async function POST(req, res) {
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
