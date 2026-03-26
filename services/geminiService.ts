/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import type { ImageData } from '../types';

// Initialize Gemini (used for Vision Analysis)
const getAi = () => {
    // Vite config implicitly replaces process.env.API_KEY with the value from .env.local
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set in .env.local.");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper: Calls Hugging Face's API with the Free FLUX model
async function generateImageFromPrompt(detailedPrompt: string): Promise<string> {
    const hfToken = import.meta.env.VITE_HF_TOKEN;
    if (!hfToken) {
        throw new Error("Missing VITE_HF_TOKEN in .env.local file. Please add your Hugging Face proxy token back!");
    }

    console.log("Sending optimized prompt to Hugging Face FLUX.1-schnell: ", detailedPrompt);

    let response;
    try {
        response = await fetch(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
            {
                headers: { 
                    Authorization: `Bearer ${hfToken}`,
                    "Content-Type": "application/json",
                    "x-wait-for-model": "true", // Crucial for sleeping HF models
                    "x-use-cache": "false"
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: detailedPrompt,
                    parameters: { num_inference_steps: 4 }
                }),
            }
        );
    } catch (networkErr: any) {
        throw new Error(`HuggingFace Network Error (Check Adblocker/VPN): ${networkErr.message}`);
    }

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`FLUX Generation Failed (${response.status}): ${err}`);
    }

    // Convert binary image directly to base64 in the browser
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper: Calls Gemini 2.5 Flash Vision to extract precise features
async function analyzeWithGemini(systemPrompt: string, parts: any[]): Promise<string> {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: systemPrompt }, ...parts] }]
        });
        return response.text || "A photorealistic fashion editorial photograph";
    } catch (error: any) {
        throw new Error(`Gemini Vision Analysis Failed: ${error.message}`);
    }
}

// Mode 1: FUSE
export async function fuseImages(foreground: ImageData, background: ImageData): Promise<string> {
  const foregroundPart = { inlineData: { data: foreground.base64.split(',')[1], mimeType: foreground.mimeType } };
  const backgroundPart = { inlineData: { data: background.base64.split(',')[1], mimeType: background.mimeType } };
  
  const analysisPrompt = `You are a world-class prompt engineer for FLUX image models. Look at the FIRST image (a fashion outfit/model) and the SECOND image (a background/scene vibe). 
  Write a hyper-detailed, exhaustive text-to-image prompt (max 100 words) describing a stunning, perfectly coherent scene. 
  CRUCIAL: Precisely describe the EXACT clothing patterns, colors, fabrics, and shapes from the First Image, and place the model flawlessly into a room matching the EXACT lighting, color tone, archways, and mood from the Second Image. The result must be a true photorealistic masterpiece. ONLY output the raw image prompt.`;

  const detailedPrompt = await analyzeWithGemini(analysisPrompt, [foregroundPart, backgroundPart]);
  return generateImageFromPrompt(detailedPrompt);
}

// Mode 2: EXTEND SCENE
export async function extendScene(source: ImageData): Promise<string> {
    const sourcePart = { inlineData: { data: source.base64.split(',')[1], mimeType: source.mimeType } };
    
    const analysisPrompt = `You are a cinematic architectural designer. Analyze this room/scene. Write a hyper-detailed FLUX image generation prompt (max 80 words) describing a brand new room that exists directly connected to this one, sharing the exact same surreal aesthetic, specific neon light colors, floor reflections, and specific architectural styles. Output ONLY the raw image generation prompt.`;

    const detailedPrompt = await analyzeWithGemini(analysisPrompt, [sourcePart]);
    return generateImageFromPrompt(detailedPrompt);
}

// Mode 3: REMIX STYLE
export async function remixStyle(styleDonor: ImageData, targetScene: ImageData): Promise<string> {
    const styleDonorPart = { inlineData: { data: styleDonor.base64.split(',')[1], mimeType: styleDonor.mimeType } };
    const targetScenePart = { inlineData: { data: targetScene.base64.split(',')[1], mimeType: targetScene.mimeType } };
    
    const analysisPrompt = `You are a High-Fashion Stylist. Look at the FIRST image (outfit and style details) and the SECOND image (a new room/scene). Write a hyper-detailed FLUX prompt (max 100 words) describing a fashion model wearing the EXACT same highly-detailed outfit/fabric/embroidery as the first image, but physically lounging/sitting naturally inside a room that perfectly matches the aesthetic of the second image. The lighting should seamlessly bounce off the model. Output ONLY the raw prompt.`;
    
    const detailedPrompt = await analyzeWithGemini(analysisPrompt, [styleDonorPart, targetScenePart]);
    return generateImageFromPrompt(detailedPrompt);
}