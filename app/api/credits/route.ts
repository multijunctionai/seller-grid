// ─── SellerGrid: Credits API ───
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import CreditTransactionModel from '@/lib/models/CreditTransaction';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const transactions = await CreditTransactionModel.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ credits: user.credits, transactions });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
  }
}

// Top up credits (simplified — in production, integrate PayFast/Yoco)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { amount } = await req.json();
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.credits += amount;
    await user.save();
    await CreditTransactionModel.create({
      userId: user._id,
      amount,
      type: 'topup',
      description: `Credit top-up: ${amount} credits (R${amount})`,
    });

    return NextResponse.json({ ok: true, credits: user.credits });
  } catch (e) {
    return NextResponse.json({ error: 'Top-up failed' }, { status: 500 });
  }
}
