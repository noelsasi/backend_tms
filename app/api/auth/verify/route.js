import prisma from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { token } = req.query;

    // Ensure the token is provided
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    try {
      // Look for the user with this verification token
      const user = await prisma.user.findUnique({
        where: { verificationToken: token },
      });

      // If no user is found or token is expired, return error
      if (!user || new Date(user.verificationTokenExpires) < new Date()) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      // Mark user as verified by updating the user record in the database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(), // Set the current date as email verified date
          verificationToken: null,   // Clear the verification token
          verificationTokenExpires: null, // Clear the token expiry date
        },
      });

      return res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Error verifying email:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  } else {
    // If the method is not GET, return Method Not Allowed
    res.status(405).json({ error: "Method not allowed" });
  }
}
