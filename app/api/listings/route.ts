// ─── SellerGrid: Listings API (CRUD) ───
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import ListingModel from '@/lib/models/Listing';
import UserModel from '@/lib/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json([]);

    const listings = await ListingModel.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json(listings);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const listing = await ListingModel.create({
      userId: user._id,
      status: body.status || 'pending',
      sourceImage: body.sourceImage,
      sourceImageUrl: body.sourceImageUrl,
      title: body.title || '',
      description: body.description || '',
      keySpecs: body.keySpecs || [],
      sellingPoints: body.sellingPoints || [],
      category: body.category || '',
      brand: body.brand,
      price: body.price,
      marketplace: body.marketplace || 'all',
      generatedImages: body.generatedImages || [],
      creditsUsed: body.creditsUsed || 0,
    });

    return NextResponse.json({ ok: true, id: listing._id });
  } catch (e) {
    console.error('POST /api/listings error:', e);
    return NextResponse.json({ error: 'Failed to save listing' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await ListingModel.deleteOne({ _id: id as any, userId: user._id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
