export type StyleContextSummary = {
  preferred_styles?: string[];
  fashion_categories?: string[];
  budget_band?: string | null;
  climate?: string | null;
  lifestyle?: string | null;
  favorite_colors?: string[];
  disliked_colors?: string[];
  fit_preferences?: string[];
  summary?: string | null;
};

export type OutfitVisionInput = {
  imageUrl: string;
  occasion?: string | null;
  feedbackDepth: "casual" | "detailed" | "improvement";
  styleContext?: StyleContextSummary;
};

export type FollowUpVisionInput = {
  imageUrl: string;
  question: string;
  priorSummary: string;
  priorStrengths: string[];
  priorImprovements: string[];
};

export type CompareVisionInput = {
  imageUrlA: string;
  imageUrlB: string;
  occasionA?: string | null;
  occasionB?: string | null;
  styleContext?: StyleContextSummary;
};

export type CategorizeItemInput = {
  imageUrl: string;
  styleContext?: StyleContextSummary;
};

export type WardrobeCatalogItem = {
  id: string;
  name: string | null;
  category: string | null;
  color: string | null;
  brand: string | null;
  attributes?: Array<{ key: string; value: string }>;
};

export type GenerateCombinationsVisionInput = {
  items: WardrobeCatalogItem[];
  occasion?: string | null;
  count: number;
  styleContext?: StyleContextSummary;
};

export interface VisionAnalyzer {
  id: string;
  model: string;
  analyzeOutfit(input: OutfitVisionInput): Promise<unknown>;
  answerFollowUp(input: FollowUpVisionInput): Promise<unknown>;
  compareOutfits(input: CompareVisionInput): Promise<unknown>;
  categorizeItem(input: CategorizeItemInput): Promise<unknown>;
  generateCombinations(input: GenerateCombinationsVisionInput): Promise<unknown>;
}

export type VisionAnalyzerResult =
  | { ok: true; analyzer: VisionAnalyzer }
  | { ok: false; reason: "missing_key" };
