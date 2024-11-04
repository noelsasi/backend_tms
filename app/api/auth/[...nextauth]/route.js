// import NextAuth from "next-auth/next";
// import prisma from "../../../lib/db";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import CredentialsProvider from "next-auth/providers/credentials";
// import GoogleProvider from "next-auth/providers/google";
// import GithubProvider from "next-auth/providers/github";
// import bcrypt from "bcrypt";

// export const authOptions = {
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "text", placeholder: "jsmith" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         // check to see if email and password is there
//         if (!credentials.email || !credentials.password) {
//           throw new Error("Please enter an email and password");
//         }

//         // check to see if user exists
//         const user = await prisma.user.findUnique({
//           where: {
//             email: credentials.email,
//           },
//         });
//         console.log("from authorise", user);
//         // if no user was found
//         if (!user || !user?.password_hash) {
//           throw new Error("No user found");
//         }

//         // check to see if password matches
//         const passwordMatch = await bcrypt.compare(
//           credentials.password,
//           user.password_hash
//         );

//         // if password does not match
//         if (!passwordMatch) {
//           throw new Error("Incorrect password");
//         }

//         return user;
//       },
//     }),
//   ],
//   secret: process.env.SECRET,
//   session: {
//     strategy: "jwt",
//   },

//   debug: process.env.NODE_ENV === "development",
// };

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };
// import NextAuth from "next-auth/next";
// import prisma from "../../../lib/db";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
// import CredentialsProvider from "next-auth/providers/credentials";

// import bcrypt from "bcrypt";

// export const authOptions = {
//   adapter: PrismaAdapter(prisma),
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "text", placeholder: "jsmith" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         // Check to see if email and password are provided
//         if (!credentials.email || !credentials.password) {
//           throw new Error("Please enter an email and password");
//         }

//         // Check to see if user exists
//         const user = await prisma.user.findUnique({
//           where: {
//             email: credentials.email,
//           },
//         });

//         // If no user was found
//         if (!user || !user?.password_hash) {
//           throw new Error("No user found");
//         }

//         // Check to see if password matches
//         const passwordMatch = await bcrypt.compare(
//           credentials.password,
//           user.password_hash
//         );

//         // If password does not match
//         if (!passwordMatch) {
//           throw new Error("Incorrect password");
//         }
//         console.log("from authorize", user);
//         return user;
//       },
//     }),
//   ],
//   secret: process.env.SECRET,
//   session: {
//     strategy: "jwt",
//   },

//   debug: process.env.NODE_ENV === "development",
// };

// const handler = NextAuth(authOptions);
// export { handler as GET, handler as POST };
import NextAuth from "next-auth/next";
import prisma from "../../../lib/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Check to see if email and password are provided
        if (!credentials.email || !credentials.password) {
          throw new Error("Please enter an email and password");
        }

        // Check to see if user exists
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        // If no user was found
        if (!user || !user?.password_hash) {
          throw new Error("No user found");
        }

        // Check to see if password matches
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        // If password does not match
        if (!passwordMatch) {
          throw new Error("Incorrect password");
        }

        console.log("from authorize", user);
        return user; // Return the entire user object
      },
    }),
  ],

  
  secret: process.env.SECRET,
  session: {
    strategy: "jwt",
 
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Convert BigInt properties to strings before adding to token
        token.user = {
          id: user.id.toString(), // Convert BigInt to string
          username: user.username,
          email: user.email,
          role_id: user.role_id.toString(), // Convert BigInt to string
          firstname: user.firstname,
          lastname: user.lastname,
          gender: user.gender,
          dob: user.dob,
          phone: user.phone,
          address: user.address,
          profilePic: user.profilePic,
          created_at: user.created_at,
          updated_at: user.updated_at,
        };
      }
      return token; // Return the modified token
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user; // Add the user object from the token to the session
      }
      return session; // Return the modified session
    },
  },
  
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
