import NextAuth from 'next-auth'
import prisma from '../../../lib/db' // Adjust the import path to your db file
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Check if email and password are provided
        if (!credentials.email || !credentials.password) {
          throw new Error('Please enter an email and password')
        }

        // Check if the user exists
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password_hash) {
          throw new Error('No user found')
        }

        // Check if the password matches
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password_hash
        )

        if (!passwordMatch) {
          throw new Error('Incorrect password')
        }

        return user // Return user object if successful
      },
    }),
  ],
  secret: process.env.SECRET,
  session: {
    strategy: 'jwt', // Use JWT for session management
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Include user data in the JWT token
        token.user = {
          id: user.id.toString(),
          email: user.email,
          username: user.username,
          role_id: user.role_id.toString(),
          firstname: user.firstname,
          lastname: user.lastname,
          profilePic: user.profilePic,
          created_at: user.created_at,
          updated_at: user.updated_at,
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        // Add user info from the JWT token to the session
        session.user = token.user
        const role = await prisma.role.findUnique({
          where: { id: BigInt(token.user.role_id) },
        })
        // Convert role data to ensure no BigInt values
        session.user.role = role ? {
          ...role,
          id: role.id.toString(),
          created_at: role.created_at,
          updated_at: role.updated_at,
        }
          : null
      }
      return session
    },
  },
  pages: {
    signIn: 'http://localhost:5173/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug logging in dev mode
}

export async function GET(req, res) {
  return NextAuth(req, res, authOptions)
}

export async function POST(req, res) {
  return NextAuth(req, res, authOptions)
}
