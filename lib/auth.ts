// ─── SellerGrid: NextAuth Config ───
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import { connectDB } from './mongodb';
import UserModel from './models/User';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(connectDB() as any),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
        // Fetch credits from DB
        try {
          await connectDB();
          const dbUser = await UserModel.findOne({ email: session.user.email });
          if (dbUser) {
            (session.user as any).credits = dbUser.credits;
            (session.user as any).role = dbUser.role;
          }
        } catch {}
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
