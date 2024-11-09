// middleware/roleMiddleware.js

import { NextResponse } from 'next/server';
import { hasPermission } from './permission';

import { authOptions } from '../api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { getToken } from 'next-auth/jwt';

// Middleware to check permission before processing the request
export function withRolePermission(permission) {
  return (handler) => {
    return async (req, res) => {
       const token = await getToken({ req, secret: authOptions.secret });

      if (!token) {
        return new NextResponse(
          JSON.stringify({ message: "Unauthorized: No session found" }),
          { status: 401 }
        );
      }

      const user = token.user;
      console.log(user);
    

      if (!user || !user.id) {
        return NextResponse.json({ message: 'Unauthorized: No user found' }, { status: 401 });
      }

      // Check if user has the required permission
      const hasPerm = await hasPermission(user.id, permission);
// console.log("hasPerm", hasPerm);
      if (!hasPerm) {
        return NextResponse.json({ message: 'Unauthorized: Permission denied' }, { status: 403 });
      }

      // If the user has permission, call the original handler
      return handler(req, res);
    };
  };
}
