import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function summarizeReviews(reviews: string[]) {
  if (reviews.length === 0) return "No reviews yet.";
  
  const prompt = `Summarize the following customer reviews for a service provider. Highlight the key strengths and any recurring issues. Keep it concise (2-3 sentences).
  
  Reviews:
  ${reviews.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Summary unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate summary.";
  }
}

export async function analyzeSentiment(text: string) {
  const prompt = `Analyze the sentiment of the following review. Return ONLY one word: "positive", "neutral", or "negative".
  
  Review: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    const sentiment = response.text?.toLowerCase().trim();
    if (sentiment?.includes("positive")) return "positive";
    if (sentiment?.includes("negative")) return "negative";
    return "neutral";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "neutral";
  }
}

export async function detectFraud(reviewText: string, otherReviews: string[]) {
  const prompt = `Act as a fraud detection system for a service marketplace. Analyze if the following review is likely fake or a bot-generated pattern. Consider if it's too similar to other reviews or uses suspicious language.
  
  New Review: "${reviewText}"
  Existing Reviews:
  ${otherReviews.slice(0, 5).map((r, i) => `${i + 1}. ${r}`).join('\n')}
  
  Return a JSON object:
  {
    "isSuspicious": boolean,
    "reason": string,
    "confidence": number (0-1)
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSuspicious: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["isSuspicious", "reason", "confidence"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return { isSuspicious: false, reason: "Detection failed", confidence: 0 };
  }
}

export async function smartSearch(query: string, providers: any[]) {
  const prompt = `Given the user query "${query}", recommend the best 3 service providers from the following list. Explain why they are a good match.
  
  Providers:
  ${providers.map(p => `- ${p.name} (${p.category}): Trust Score ${p.trustScore}, Rating ${p.rating}`).join('\n')}
  
  Return a JSON array of objects:
  [{ "providerId": string, "reason": string }]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              providerId: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["providerId", "reason"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
}
