'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Sparkles, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@sellergrid.co.za');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error('Invalid credentials');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sign in to SellerGrid</h1>
          <p className="mt-1 text-[14px] text-slate-500">One photo to marketplace listings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[14px] outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-[14px] outline-none transition-all focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-50"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[12px] text-slate-400">
          Default: admin@sellergrid.co.za / admin321
        </p>
      </div>
    </div>
  );
}
