// ─── SellerGrid: Image Upload API ───
import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'ai');

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, filename), bytes);

    return NextResponse.json({
      filename,
      url: `/api/serve-upload?file=${filename}`,
    });
  } catch (e) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
