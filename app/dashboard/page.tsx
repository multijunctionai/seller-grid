'use client';
import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Camera, Upload, Loader2, Sparkles, Package, Clock, Download,
  Check, X, Image as ImageIcon, FileText, Tag,
} from 'lucide-react';

interface GeneratedImage {
  url: string;
  filename: string;
  prompt: string;
  type: string;
}

interface AnalysisResult {
  title: string;
  description: string;
  category: string;
  brand: string;
  keySpecs: { label: string; value: string }[];
  sellingPoints: string[];
  imagePrompts: string[];
  creditsRemaining: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadedFile, setUploadedFile] = useState<{ filename: string; url: string } | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [marketplace, setMarketplace] = useState<'all' | 'takealot' | 'amazon' | 'makro'>('all');
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    toast.loading('Uploading...', { id: 'upload' });

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUploadedFile(data);
      setPreview(data.url);
      toast.success('Photo uploaded', { id: 'upload' });
    } catch (e) {
      toast.error('Upload failed', { id: 'upload' });
    }
  }, []);

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    setAnalyzing(true);
    setAnalysis(null);
    setImages([]);
    toast.loading('Analyzing product photo...', { id: 'analyze' });

    try {
      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: uploadedFile.filename, marketplace }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalysis(data);
      toast.success(`Analyzed: ${data.title?.slice(0, 40)}...`, { id: 'analyze' });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed', { id: 'analyze' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!uploadedFile || !analysis?.imagePrompts) return;
    setGenerating(true);
    toast.loading('Generating 5 product images...', { id: 'gen' });

    try {
      const res = await fetch('/api/ai-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: uploadedFile.filename, prompts: analysis.imagePrompts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setImages(data.images);
      toast.success(`${data.images.length} images generated`, { id: 'gen' });

      // Save listing to DB
      await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready',
          sourceImage: uploadedFile.filename,
          sourceImageUrl: uploadedFile.url,
          title: analysis.title,
          description: analysis.description,
          keySpecs: analysis.keySpecs,
          sellingPoints: analysis.sellingPoints,
          category: analysis.category,
          brand: analysis.brand,
          marketplace,
          generatedImages: data.images,
          creditsUsed: 11,
        }),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed', { id: 'gen' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-1 text-[15px] text-slate-500">
          Upload a product photo → AI generates title, description, and 5 images
        </p>
      </div>

      {/* Upload Section */}
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-[16px] font-semibold text-slate-800">1. Upload Product Photo</h2>

        <div className="flex flex-col items-start gap-6 md:flex-row">
          {/* Upload dropzone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) handleUpload(f);
            }}
            className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:border-emerald-300 hover:bg-emerald-50/30 md:w-64"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Product" className="h-full w-full rounded-xl object-contain" />
            ) : (
              <>
                <Camera className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                <p className="mt-2 text-[13px] font-medium text-slate-400">Click or drop image</p>
                <p className="text-[11px] text-slate-300">PNG, JPG, WebP</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </div>

          {/* Marketplace selector + Analyze button */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-slate-500">Marketplace</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Marketplaces' },
                  { id: 'takealot', label: 'Takealot' },
                  { id: 'amazon', label: 'Amazon' },
                  { id: 'makro', label: 'Makro' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMarketplace(m.id as any)}
                    className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-all ${
                      marketplace === m.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!uploadedFile || analyzing}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800 disabled:opacity-40"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing product...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze Product (1 credit)
                </>
              )}
            </button>

            <p className="text-[12px] text-slate-400">
              GPT-4o will analyze your photo and generate title, description, specs, and selling points.
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-slate-800">2. Product Details</h2>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-medium text-emerald-700">
              {analysis.creditsRemaining} credits left
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                  <Tag className="h-3 w-3" /> Title
                </label>
                <p className="mt-1 rounded-lg bg-slate-50 p-3 text-[14px] font-medium text-slate-800">{analysis.title}</p>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                  <FileText className="h-3 w-3" /> Description
                </label>
                <p className="mt-1 max-h-40 overflow-y-auto rounded-lg bg-slate-50 p-3 text-[13px] leading-relaxed text-slate-600">{analysis.description}</p>
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-500">Category</label>
                <p className="mt-1 rounded-lg bg-slate-50 p-2 text-[13px] text-slate-600">{analysis.category}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-slate-500">Key Specs</label>
                <div className="mt-1 space-y-1">
                  {analysis.keySpecs.map((s, i) => (
                    <div key={i} className="flex justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-[13px]">
                      <span className="font-medium text-slate-500">{s.label}</span>
                      <span className="text-slate-800">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-slate-500">Selling Points</label>
                <ul className="mt-1 space-y-1">
                  {analysis.sellingPoints.map((sp, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" strokeWidth={2.5} />
                      {sp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Generate Images Button */}
          <button
            onClick={handleGenerateImages}
            disabled={generating}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-40"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating 5 images...
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                Generate 5 Product Images (10 credits)
              </>
            )}
          </button>
        </div>
      )}

      {/* Generated Images */}
      {images.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-[16px] font-semibold text-slate-800">3. Generated Images</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`Product ${i + 1}`} className="aspect-square w-full object-cover" />
                <div className="p-2">
                  <p className="text-[11px] font-medium capitalize text-slate-500">{img.type}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-all group-hover:opacity-100">
                  <button
                    onClick={() => setPreviewUrl(img.url)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-slate-700 hover:bg-white"
                  >
                    <Package className="h-4 w-4" />
                  </button>
                  <a
                    href={img.url}
                    download={`product-${i + 1}.png`}
                    target="_blank"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-slate-700 hover:bg-white"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] rounded-2xl bg-white p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-lg ring-1 ring-gray-200 hover:bg-red-50 hover:text-red-500"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="max-h-[75vh] max-w-[80vw] rounded-xl object-contain" />
            <div className="mt-3 flex justify-center">
              <a
                href={previewUrl}
                download="product-image.png"
                target="_blank"
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
