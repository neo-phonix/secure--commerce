import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenAI, Type } from "@google/genai";
import rateLimit from '@/lib/rate-limit';
import { z } from 'zod';

const recommendationsSchema = z.object({
  currentProductId: z.string().uuid().optional(),
  recentlyViewedIds: z.array(z.string().uuid()).optional(),
});

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
  strict: false,
});

export async function POST(request: Request) {
  try {
    // 1. Auth check first (to get user ID for rate limiting)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Rate limiting by user ID
    try {
      await limiter.check(10, `ai-rec-${user.id}`); // 10 requests per minute per user
    } catch {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const validated = recommendationsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validated.error.format() },
        { status: 400 }
      );
    }

    const { currentProductId, recentlyViewedIds } = validated.data;

    const apiKey = process.env.GEMINI_API_KEY; // Using the server-side key
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 3. Fetch products for context
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, price, slug, image_url');

    if (productsError || !allProducts) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    const recentlyViewed = allProducts.filter(p => recentlyViewedIds?.includes(p.id));
    const currentProduct = allProducts.find(p => p.id === currentProductId);

    const history = recentlyViewed.map(p => p.name).join(', ') || 'None';
    const current = currentProduct ? `${currentProduct.name}: ${currentProduct.description}` : 'None';

    const prompt = `
      You are an AI shopping assistant for a high-security tech store.
      Current Product: ${current}
      User Browsing History: ${history}
      
      Available Products:
      ${allProducts.map(p => `- ${p.name} (ID: ${p.id}): ${p.description}`).join('\n')}
      
      Based on the current product and history, select the 3 most relevant products from the "Available Products" list.
      Return ONLY a JSON array of the product IDs.
    `;

    // Use AbortController for timeout (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      });

      clearTimeout(timeoutId);

      const recommendedIds = JSON.parse(response.text || "[]");
      const recommendations = allProducts.filter(p => recommendedIds.includes(p.id));

      return NextResponse.json({ recommendations });
    } catch (aiError: any) {
      clearTimeout(timeoutId);
      if (aiError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'AI service timed out. Please try again.' },
          { status: 504 }
        );
      }
      throw aiError;
    }
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
