// import { NextResponse } from "next/server";
// import prisma from "@/app/lib/db"; // Prisma client
// import { z } from "zod"; // Zod for validation
// import { withRolePermission } from "@/app/lib/middleware"; // Middleware for role checking

// // Zod schema for validating the search query
// const searchThesisSchema = z.object({
//   title: z.string().min(1).optional(),
//   author_name: z.string().min(1).optional(),
//   category: z.string().optional(),
//   keywords: z.array(z.string()).optional(),
//   start_date: z.string().optional(),
//   end_date: z.string().optional(),
//   status: z.enum(["Pending", "Approved", "Rejected"]).optional(),
// });

// // Helper function to parse the date range
// const parseDate = (dateString) => {
//   return dateString ? new Date(dateString) : undefined;
// };

// export const POST = withRolePermission("VIEW_THESIS")(async (req) => {
//   try {
//     // Parse and validate the incoming body
//     const body = await req.json();
//     const parsedQuery = searchThesisSchema.parse(body); // This validates the input

//     const {
//       title,
//       author_name,
//       category,
//       keywords,
//       start_date,
//       end_date,
//       status,
//     } = parsedQuery;

//     // Build dynamic search conditions based on the request parameters
//     const searchConditions = {
//       AND: [], // Start with an empty array for the 'AND' condition
//     };

//     // Add conditions to the query based on the provided search parameters
//     if (title) {
//       searchConditions.AND.push({
//         title: {
//           contains: title, // Partial match
//         },
//       });
//     }

//     if (author_name) {
//       const author = await prisma.user.findUnique({
//         where: { username: author_name },
//       });
//       if (author) {
//         searchConditions.AND.push({
//           author_id: author.id,
//         });
//       } else {
//         return NextResponse.json(
//           { message: "Author not found" },
//           { status: 404 }
//         );
//       }
//     }

//     if (category) {
//       searchConditions.AND.push({
//         category: {
//           contains: category, // Partial match
//         },
//       });
//     }

//     if (keywords && keywords.length > 0) {
//       // Assuming 'keywords' is a Json field that stores an array
//       // Using `array_contains` for databases that support it (like PostgreSQL)
//       searchConditions.AND.push({
//         keywords: {
//           array_contains: keywords, // Match any of the provided keywords in the JSON array
//         },
//       });
//     }

//     if (start_date || end_date) {
//       searchConditions.AND.push({
//         created_at: {
//           gte: parseDate(start_date),
//           lte: parseDate(end_date),
//         },
//       });
//     }

//     if (status) {
//       searchConditions.AND.push({
//         status: status, // Exact match on status
//       });
//     }

//     // Query Prisma to search for theses based on the constructed conditions
//     const theses = await prisma.thesis.findMany({
//       where: searchConditions,
//       include: {
//         author: true, // Include author information
//         reviewer: true, // Include reviewer information
//         views: true, // Include views data
//         downloads: true, // Include downloads data
//       },
//     });

//     // Serialize the response (convert BigInt and Date to strings for JSON compatibility)
//     const thesisResponse = theses.map((thesis) => ({
//       thesis_id: thesis.thesis_id.toString(),
//       title: thesis.title,
//       author_name: thesis.author.username,
//       category: thesis.category,
//       keywords: thesis.keywords,
//       abstract: thesis.abstract,
//       status: thesis.status,
//       created_at: thesis.created_at.toISOString(),
//       updated_at: thesis.updated_at.toISOString(),
//       file_url: thesis.document_url, // Assuming you store the file URL in `document_url`
//       views: thesis.views.length, // Return the number of views
//       downloads: thesis.downloads.length, // Return the number of downloads
//     }));

//     return NextResponse.json({
//       message: "Theses found successfully",
//       theses: thesisResponse,
//     });
//   } catch (error) {
//     console.error("Error searching theses:", error.message || error);

//     // Handle Zod validation errors
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { message: "Validation failed", errors: error.errors },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { message: "Internal Server Error", error: error.message || error },
//       { status: 500 }
//     );
//   }
// });

// import { withRolePermission } from "@/app/lib/middleware";
// import { NextResponse } from "next/server";
// import prisma from "@/app/lib/db"; // Import Prisma client
// import { z } from "zod"; // Zod for validation

// // Schema for validating the request body
// const searchThesisSchema = z.object({
//   title: z.string().optional(),
//   author_name: z.string().optional(),
//   category: z.string().optional(),
//   keywords: z.array(z.string()).optional(),
//   start_date: z.string().optional(),
//   end_date: z.string().optional(),
//   status: z.enum(["Pending", "Approved", "Rejected"]).optional(),
// });

// export const POST = withRolePermission("VIEW_THESIS")(async (req) => {
//   try {
//     // Step 1: Parse and validate the request body
//     const body = await req.json();
//     const parsedBody = searchThesisSchema.parse(body);

//     // Step 2: Extract the search fields from the parsed body
//     const {
//       title,
//       author_name,
//       category,
//       keywords,
//       start_date,
//       end_date,
//       status,
//     } = parsedBody;

//     // Step 3: Parse and format start_date and end_date
//     const startDate = start_date ? new Date(start_date + "T00:00:00Z") : undefined;
//     const endDate = end_date ? new Date(end_date + "T23:59:59Z") : undefined;

//     // Step 4: Build the search criteria
//     const whereConditions = {
//       AND: [
//         title ? { title: { contains: title, mode: "insensitive" } } : undefined,
//         category ? { category: { contains: category, mode: "insensitive" } } : undefined,
//         keywords && keywords.length > 0
//           ? {
//               keywords: {
//                 hasSome: keywords, // Match any of the keywords in the array
//               },
//             }
//           : undefined,
//         startDate && endDate
//           ? {
//               created_at: {
//                 gte: startDate,
//                 lte: endDate,
//               },
//             }
//           : startDate
//           ? {
//               created_at: {
//                 gte: startDate,
//               },
//             }
//           : endDate
//           ? {
//               created_at: {
//                 lte: endDate,
//               },
//             }
//           : undefined,
//         status ? { status: status } : undefined,
//       ].filter(Boolean), // Filter out any undefined values
//     };

//     // Step 5: Perform the query to search for theses
//     const theses = await prisma.thesis.findMany({
//       where: whereConditions,
//       include: {
//         author: true,
//         reviewer: true,
//         views: true,
//         downloads: true,
//       },
//     });

//     // Step 6: Map over the results to convert BigInt to string
//     const thesesResponse = theses.map((thesis) => ({
//       thesis_id: thesis.thesis_id.toString(), // Convert BigInt to string
//       title: thesis.title,
//       author_name: thesis.author.username,
//       category: thesis.category,
//       keywords: thesis.keywords,
//       abstract: thesis.abstract,
//       status: thesis.status,
//       created_at: thesis.created_at.toISOString(),
//       updated_at: thesis.updated_at.toISOString(),
//       // Convert any other BigInt fields to string if needed
//       views: thesis.views.length,
//       downloads: thesis.downloads.length,
//       reviewer_name: thesis.reviewer ? thesis.reviewer.username : null,
//     }));

//     // Step 7: Return the search results
//     return NextResponse.json({ theses: thesesResponse });
//   } catch (error) {
//     console.error("Error searching theses:", error.message || error);

//     // Handle errors (Zod validation errors or any internal errors)
//     if (error instanceof z.ZodError) {
//       return NextResponse.json(
//         { message: "Validation failed", errors: error.errors },
//         { status: 400 }
//       );
//     }

//     return NextResponse.json(
//       { message: "Internal Server Error", error: error.message || error },
//       { status: 500 }
//     );
//   }
// });

// actuall
import { withRolePermission } from '@/app/lib/middleware'
import { NextResponse } from 'next/server'
import prisma from '@/app/lib/db' // Import Prisma client
import { z } from 'zod' // Zod for validation

// Schema to validate the incoming request body for searching theses
const searchThesisSchema = z.object({
  search: z.string().optional(),
  author_name: z.string().optional(),
  category: z.string().optional(),
  keywords: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
})

export const POST = withRolePermission('VIEW_THESIS')(async req => {
  try {
    // Step 1: Parse and validate the request body
    const body = await req.json()
    const parsedBody = searchThesisSchema.parse(body)

    // Step 2: Extract the search fields from the parsed body
    const {
      search,
      author_name,
      category,
      keywords,
      start_date,
      end_date,
      status,
    } = parsedBody

    // Step 3: Parse and format start_date and end_date
    const startDate = start_date
      ? new Date(start_date + 'T00:00:00Z')
      : undefined
    const endDate = end_date ? new Date(end_date + 'T23:59:59Z') : undefined

    // Step 4: Build the search criteria
    const whereConditions = {
      AND: [
        search ? { title: { contains: search } } : undefined,
        category ? { category: { contains: category } } : undefined,
        keywords
          ? {
              keywords: {
                contains: keywords, // Join keywords into a single string for matching
              },
            }
          : undefined,
        startDate || endDate
          ? {
              created_at: {
                gte: startDate || undefined, // If startDate is defined, use it, else leave it undefined
                lte: endDate || undefined, // If endDate is defined, use it, else leave it undefined
              },
            }
          : undefined,
        status ? { status: status } : undefined,
        author_name
          ? {
              author: {
                AND: (() => {
                  const nameParts = author_name
                    .split(' ')
                    .map(part => part.trim())

                  if (nameParts.length === 1) {
                    // If there's only one part (e.g., "John"), search in both firstname and lastname
                    return [
                      {
                        firstname: {
                          contains: nameParts[0],
                        },
                      },
                      {
                        lastname: {
                          contains: nameParts[0],
                        },
                      },
                    ]
                  } else if (nameParts.length === 2) {
                    // If there are two parts (e.g., "John Doe"), search in firstname and lastname
                    return [
                      {
                        firstname: {
                          contains: nameParts[0], // Match first part in firstname
                        },
                      },
                      {
                        lastname: {
                          contains: nameParts[1], // Match second part in lastname
                        },
                      },
                    ]
                  } else {
                    return []
                  }
                })(),
              },
            }
          : undefined,
      ].filter(Boolean), // Remove undefined values from the conditions array
    }

    // Step 5: Perform the query to search for theses
    // const theses = await prisma.thesis.findMany({
    //   where: whereConditions,
    //   include: {
    //     author: true,
    //     reviewer: true,
    //     views: true,
    //     downloads: true,
    //     document_url: true,
    //   },
    // });
    console.log(whereConditions)
    const theses = await prisma.thesis.findMany({
      where: whereConditions,
      select: {
        thesis_id: true,
        title: true,
        category: true,
        keywords: true,
        abstract: true,
        status: true,
        created_at: true,
        updated_at: true,
        author: {
          select: {
            username: true,
          },
        },
        reviewer: {
          select: {
            username: true,
          },
        },
        views: true,
        downloads: true,
        document_url: true, // Directly select document_url here
      },
    })
    console.log(theses)
    // Step 6: Map over the results to convert BigInt to string
    const thesesResponse = theses.map(thesis => ({
      thesis_id: thesis.thesis_id.toString(), // Convert BigInt to string
      title: thesis.title,
      author_name: thesis.author.username,
      category: thesis.category,
      keywords: thesis.keywords,
      abstract: thesis.abstract,
      status: thesis.status,
      created_at: thesis.created_at.toISOString(),
      updated_at: thesis.updated_at.toISOString(),
      // Convert any other BigInt fields to string if needed
      views: thesis.views.length,
      downloads: thesis.downloads.length,
      reviewer_name: thesis.reviewer ? thesis.reviewer.username : null,
      document_url: thesis.document_url,
    }))

    // Step 7: Return the search results
    return NextResponse.json({ theses: thesesResponse })
  } catch (error) {
    console.error('Error searching theses:', error.message || error)

    // Handle errors (Zod validation errors or any internal errors)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message || error },
      { status: 500 }
    )
  }
})
