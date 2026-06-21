// ─── SellerGrid: Serve Uploaded Images ───
import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, normalize } from 'path';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'ai');

function contentTypeFor(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    default: return 'image/png';
  }
}

export async function GET(req: NextRequest) {
  const file = new URL(req.url).searchParams.get('file');
  if (!file || file.includes('..') || file.includes('/')) {
    return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
  }

  const path = normalize(join(UPLOAD_DIR, file));
  if (!path.startsWith(UPLOAD_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const bytes = await readFile(path);
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': contentTypeFor(file),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
