// ─── SellerGrid: AI Analyze Photo → Title + Description + Specs + Image Prompts ───
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import CreditTransactionModel from '@/lib/models/CreditTransaction';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'ai');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const COST_CREDITS = 1; // 1 credit for analysis (~R0.27)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filename, marketplace } = await req.json();
    if (!filename) {
      return NextResponse.json({ error: 'Missing filename' }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.credits < COST_CREDITS) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Read the uploaded image
    const imagePath = join(UPLOAD_DIR, filename);
    const imageBytes = await readFile(imagePath);
    const base64Image = imageBytes.toString('base64');
    const mimeType = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';

    // Build marketplace-specific system prompt
    const marketplaceContext = marketplace === 'takealot'
      ? 'Optimize for Takealot South Africa. Titles should be clear, descriptive, max 120 characters. Include brand, key feature, and product type.'
      : marketplace === 'amazon'
      ? 'Optimize for Amazon.co.za. Titles should follow Amazon format: Brand + Model + Type + Key Features. Max 200 characters.'
      : marketplace === 'makro'
      ? 'Optimize for Makro South Africa. Clear product titles with brand and key specifications.'
      : 'Optimize for South African e-commerce marketplaces (Takealot, Amazon, Makro). Clear, descriptive titles with brand and key features.';

    const systemPrompt = `You are a professional e-commerce listing specialist for South African marketplaces. ${marketplaceContext}

Analyze the product in the image and return a JSON object with:
{
  "title": "Compelling product title (max 120 chars)",
  "description": "Detailed product description (3-4 paragraphs, highlighting benefits and features)",
  "category": "Product category path (e.g. Electronics > Audio > Headphones)",
  "brand": "Brand name if visible, otherwise 'Generic'",
  "keySpecs": [{"label": "Material", "value": "Plastic"}, {"label": "Color", "value": "Black"}, ...],
  "sellingPoints": ["5 key selling points as bullet strings"],
  "imagePrompts": [
    "Prompt for hero shot: clean white background, product centered, professional studio lighting",
    "Prompt for lifestyle shot: product in real-world usage context",
    "Prompt for detail shot: close-up of key feature or texture",
    "Prompt for infographic shot: product with callout labels and feature highlights",
    "Prompt for gallery shot: 3-quarter angle view, soft shadow, white background"
  ]
}

Return ONLY the JSON, no markdown or explanation.`;

    // Call GPT-4o Vision
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this product image and generate the listing data.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
            ],
          },
        ],
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('GPT-4o error:', data);
      throw new Error(data.error?.message || 'GPT-4o API error');
    }

    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    // Deduct credits
    user.credits -= COST_CREDITS;
    await user.save();
    await CreditTransactionModel.create({
      userId: user._id,
      amount: -COST_CREDITS,
      type: 'listing',
      description: `AI analysis: ${parsed.title || 'product'}`,
    });

    return NextResponse.json({
      ...parsed,
      creditsRemaining: user.credits,
    });
  } catch (e) {
    console.error('AI analyze error:', e);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
