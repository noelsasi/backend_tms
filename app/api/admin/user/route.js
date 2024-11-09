// app/api/admin/create/route.js

import { withRolePermission } from "../../../lib/middleware";
import { NextResponse } from "next/server"; // Import NextResponse

// Handle GET request
export const GET = async (req) => {
  // Your actual GET request logic
  return NextResponse.json({ message: "GET request: You have access!" });
};

// Handle POST request with middleware
export const POST = withRolePermission("CREATE_USER")(async (req) => {
  // Your actual POST request logic
  return NextResponse.json(
    { message: "POST request: Data created successfully!" },
    { status: 201 }
  );
});
