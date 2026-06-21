// ─── SellerGrid: AI Generate Product Images (5 variations) ───
import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import CreditTransactionModel from '@/lib/models/CreditTransaction';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'ai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const COST_CREDITS = 10; // 10 credits for 5 images (R2/image × 5 = R10)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filename, prompts } = await req.json();
    if (!filename || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ error: 'Missing filename or prompts' }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.credits < COST_CREDITS) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Read the source image for reference
    const sourcePath = join(UPLOAD_DIR, filename);
    const sourceBytes = await readFile(sourcePath);

    // Generate 5 images in parallel using GPT-Image-2 /images/edits
    const imagePromises = prompts.slice(0, 5).map(async (prompt: string, index: number) => {
      try {
        const form = new FormData();
        form.append('model', 'gpt-image-2');
        form.append('prompt', prompt);
        form.append('n', '1');
        form.append('size', '1024x1024');
        form.append('quality', 'medium');

        // Add reference image
        const blob = new Blob([sourceBytes], { type: 'image/png' });
        form.append('image[]', blob, 'source.png');

        const res = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: form,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Image gen error');

        const first = data.data?.[0];
        if (!first?.b64_json) throw new Error('No image in response');

        // Save to disk
        const imgFilename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}.png`;
        await mkdir(UPLOAD_DIR, { recursive: true });
        await writeFile(join(UPLOAD_DIR, imgFilename), Buffer.from(first.b64_json, 'base64'));

        const types = ['hero', 'lifestyle', 'detail', 'infographic', 'gallery'] as const;

        return {
          url: `/api/serve-upload?file=${imgFilename}`,
          filename: imgFilename,
          prompt,
          type: types[index] || 'gallery',
        };
      } catch (e) {
        console.error(`Image ${index} generation failed:`, e);
        return null;
      }
    });

    const results = await Promise.all(imagePromises);
    const validImages = results.filter(Boolean);

    if (validImages.length === 0) {
      throw new Error('All image generations failed');
    }

    // Deduct credits (proportional to successful images)
    const creditsToDeduct = Math.ceil((validImages.length / 5) * COST_CREDITS);
    user.credits -= creditsToDeduct;
    await user.save();
    await CreditTransactionModel.create({
      userId: user._id,
      amount: -creditsToDeduct,
      type: 'image',
      description: `${validImages.length} product images generated`,
    });

    return NextResponse.json({
      images: validImages,
      creditsRemaining: user.credits,
      creditsUsed: creditsToDeduct,
    });
  } catch (e) {
    console.error('AI images error:', e);
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }
}
