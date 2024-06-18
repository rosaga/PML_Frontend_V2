// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import { authOptions } from "../../../lib/auth"

// src/app/api/auth/[...nextauth]/route.js


const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };