'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Sparkles, Camera, Package, BarChart3, ArrowRight } from 'lucide-react';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-blue-50/30">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -left-8 top-32 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-[1200px] px-6 py-20 lg:py-28">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-[13px] font-medium text-emerald-700">
              <Sparkles className="h-3.5 w-3.5" />
              One photo. Three marketplaces. Minutes.
            </div>

            <h1 className="text-[36px] font-bold tracking-tight text-slate-900 lg:text-[52px] lg:leading-[1.1]">
              Turn one product photo into
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                marketplace-ready listings
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-[17px] text-slate-600">
              Upload a product photo. AI generates the title, description, specs, and 5 product images.
              Optimized for Takealot, Amazon, and Makro.
            </p>

            <div className="mt-8 flex items-center justify-center gap-3">
              {session ? (
                <Link
                  href="/dashboard"
                  className="flex h-12 items-center gap-2 rounded-xl bg-slate-950 px-6 text-[15px] font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="flex h-12 items-center gap-2 rounded-xl bg-emerald-600 px-6 text-[15px] font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    Try Free — 75 Credits
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="flex h-12 items-center rounded-xl border border-slate-200 bg-white px-6 text-[15px] font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>

            <p className="mt-4 text-[13px] text-slate-400">
              R15 per listing · R2 per image · No subscription required
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-auto max-w-[1200px] px-6 pb-20">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: Camera, title: '1. Upload Photo', desc: 'Snap or upload a product image. One photo is all we need.' },
            { icon: Sparkles, title: '2. AI Generates', desc: 'GPT-4o analyzes the photo. Gets title, description, specs, and 5 images.' },
            { icon: Package, title: '3. Submit Listings', desc: 'Review and submit to Takealot, Amazon, or Makro — all from one place.' },
          ].map((step) => (
            <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 text-white shadow-sm">
                <step.icon className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <h3 className="text-[16px] font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-[14px] text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 py-8 text-center text-[13px] text-slate-400">
        SellerGrid — Marketplace listing automation for South African sellers
      </footer>
    </div>
  );
}
