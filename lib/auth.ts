// ─── SellerGrid: Simple Password Auth ───
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from './mongodb';
import UserModel from './models/User';

const ADMIN_EMAIL = 'admin@sellergrid.co.za';
const ADMIN_PASSWORD = 'admin321';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Admin login
        if (credentials.email === ADMIN_EMAIL && credentials.password === ADMIN_PASSWORD) {
          await connectDB();
          let user = await UserModel.findOne({ email: ADMIN_EMAIL });
          if (!user) {
            user = await UserModel.create({
              email: ADMIN_EMAIL,
              name: 'Admin',
              credits: 9999,
              role: 'owner',
            });
          }
          return { id: user._id.toString(), email: user.email, name: user.name } as any;
        }

        // Regular users (future)
        await connectDB();
        const user = await UserModel.findOne({ email: credentials.email });
        if (!user) return null;

        // For now, only admin login supported
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id;
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
  pages: { signIn: '/login' },
};
