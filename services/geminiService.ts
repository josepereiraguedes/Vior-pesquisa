import { GoogleGenAI } from "@google/genai";
import { CompletedSurvey } from "../types";

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; // In a real app, handle missing key gracefully in UI
const ai = new GoogleGenAI({ apiKey });

export const analyzeSurveyData = async (data: CompletedSurvey[]) => {
  if (!apiKey) {
    throw new Error("API Key missing");
  }

  // Prepare a summary of the data for the prompt to save tokens
  // In a real app, we would calculate rigorous stats here first.
  const total = data.length;
  const sample = data.slice(0, 20); // Send a sample to avoid token limits if list is huge
  const sampleStr = JSON.stringify(sample);

  const prompt = `
    You are a Senior Market Research Analyst for a brand called "Vior Store". I have survey data from ${total} respondents in the Beauty & Cosmetics niche.
    Here is a sample of the raw JSON data (responses to questions about category, budget, platform, etc.):
    ${sampleStr}

    Please provide a concise, high-value strategic analysis **in Portuguese (PT-BR)** HTML format (just the <div> content, no <html> tags).
    
    Focus on:
    1. **Top Oportunidades:** What specific product categories have high demand but maybe low satisfaction or high openness to new things?
    2. **Persona do Cliente:** Describe the ideal customer based on the age, spending, and platform habits.
    3. **Estratégia de Canais:** Where should we focus our marketing ads?
    4. **Sugestão de Preço:** Based on the ticket size, what is the sweet spot price for a bundle?

    Use <h3> for headings, <ul> for lists, and <p> for paragraphs. Keep it professional but actionable.
    Use Tailwind CSS classes for styling (e.g., text-slate-700, font-bold, mb-2).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};