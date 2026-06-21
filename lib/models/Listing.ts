// ─── SellerGrid: Listing Model ───
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ListingImage {
  url: string;
  filename: string;
  prompt: string;
  type: 'hero' | 'gallery' | 'lifestyle' | 'infographic' | 'detail';
}

export interface IListing extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'pending' | 'analyzing' | 'generating' | 'ready' | 'submitted' | 'error';
  sourceImage: string;       // uploaded photo filename
  sourceImageUrl: string;    // /api/serve-upload?file=xxx
  title: string;
  description: string;
  keySpecs: { label: string; value: string }[];
  sellingPoints: string[];
  category: string;
  brand?: string;
  price?: string;
  marketplace: 'takealot' | 'makro' | 'amazon' | 'all';
  generatedImages: ListingImage[];
  errorMessage?: string;
  creditsUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const ListingImageSchema = new Schema<ListingImage>(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    prompt: { type: String, required: true },
    type: { type: String, enum: ['hero', 'gallery', 'lifestyle', 'infographic', 'detail'], default: 'gallery' },
  },
  { _id: false },
);

const KeySpecSchema = new Schema(
  {
    label: { type: String },
    value: { type: String },
  },
  { _id: false },
);

const ListingSchema = new Schema<IListing>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'analyzing', 'generating', 'ready', 'submitted', 'error'], default: 'pending', index: true },
    sourceImage: { type: String, required: true },
    sourceImageUrl: { type: String, required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    keySpecs: { type: [KeySpecSchema], default: [] },
    sellingPoints: { type: [String], default: [] },
    category: { type: String, default: '' },
    brand: { type: String },
    price: { type: String },
    marketplace: { type: String, enum: ['takealot', 'makro', 'amazon', 'all'], default: 'all' },
    generatedImages: { type: [ListingImageSchema], default: [] },
    errorMessage: { type: String },
    creditsUsed: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const modelName = 'Listing';
const ListingModel: Model<IListing> =
  mongoose.models[modelName] || mongoose.model<IListing>(modelName, ListingSchema);

export default ListingModel;
