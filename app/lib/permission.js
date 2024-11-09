// lib/permissions.js

import prisma from "./db"; // Importing the Prisma client

// Utility function to check if the user has a specific permission
export async function hasPermission(userId, permission) {
  try {
    // Fetch the user and their role permissions in one go
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: {
          select: {
            permissions: true,  // Get permissions associated with the user's role
          },
        },
      },
    });
// console.log("permission for this user is", user?.role?.permissions[0]?.permission);
const hasPerm = user?.role?.permissions[0]?.permission.includes(permission);
// console.log("hasPerm", hasPerm);
    // Return true if the permission exists, false otherwise
    return hasPerm
  } catch (error) {
    console.error("Error checking permission:", error);
    return false; // Return false in case of an error
  }
}
