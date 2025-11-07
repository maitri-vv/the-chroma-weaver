
import { GoogleGenAI, Modality } from "@google/genai";
import type { ImageData } from '../types';

// Helper to initialize AI and handle common logic
const getAi = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey });
};

// Helper to run the generation and extract the image
async function generateImage(parts: any[]): Promise<string> {
    const ai = getAi();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
                return part.inlineData.data;
            }
        }
        
        throw new Error("No image was generated in the response.");
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Failed to generate image. Please check your inputs and API key.");
    }
}


// Mode 1: FUSE with Unified Camera Perspective
const fusePrompt = `As a High-Fashion AI Designer and Photographer, generate a new, unique high-fashion model and seamlessly integrate them into the 'Background Image (Room)'.

1.  **New Model:** Create a distinct model; do not replicate the 'Model Style Donor (Vibe)' individual.
2.  **Harmonized Style:** Extract the fashion aesthetic from the 'Model Style Donor' (clothing, fabrics, hair, vibe). Adapt and harmonize this style with the 'Background Image's' theme, color palette, and atmosphere, creating a cohesive new outfit and look.
3.  **Dynamic Pose:** Place the new model in a fresh, elegant pose that interacts naturally with the 'Background Image'.
4.  **Photorealistic Integration:** Ensure perfect matching of scale, perspective, lighting, and shadows with the 'Background Image' for a single, high-quality editorial shot.
5.  **Unique Output:** Strive for a unique vibe, theme, and distinct visual outcome with each generation, avoiding repetition.`;


export async function fuseImages(foreground: ImageData, background: ImageData): Promise<string> {
  const foregroundPart = { inlineData: { data: foreground.base64.split(',')[1], mimeType: foreground.mimeType } };
  const backgroundPart = { inlineData: { data: background.base64.split(',')[1], mimeType: background.mimeType } };
  const textPart = { text: fusePrompt };
  
  return generateImage([textPart, foregroundPart, backgroundPart]);
}

// Mode 2: EXTEND SCENE
const extendPrompt = `As an Interior Architect and Conceptual Designer, analyze the 'Vibe Donor' image to extract its key aesthetics: soft pink/peach walls, striped rainbow light, glossy marble floor, and neon archways.

Generate a **completely new interior scene** from a **radically different camera angle/point of view**. The new scene must feature:

1.  **Unique Architecture:** Design new, distinct interior corners and architectural elements; do not replicate the 'Vibe Donor's' layout.
2.  **Novel Elements:** Introduce new, thematically consistent props, furniture, and design elements that align with the 'Vibe Donor's' high-fashion aesthetic.
3.  **Vibe Continuity:** Incorporate the 'Vibe Donor's' extracted elements (wall color, light reflections, floor texture, archways) seamlessly to create a consistent, sophisticated, yet fresh scene.

The final output should be a captivating, high-fashion architectural render.`;

export async function extendScene(source: ImageData): Promise<string> {
    const sourcePart = { inlineData: { data: source.base64.split(',')[1], mimeType: source.mimeType } };
    const textPart = { text: extendPrompt };
    return generateImage([textPart, sourcePart]);
}

// Mode 3: REMIX STYLE
const remixPrompt = `As a High-Fashion Stylist and AI Visual Mixer, generate a *new and unique* image featuring an *entirely distinct model* within the 'Target Scene' background. Avoid direct copies of the 'Style Donor'.

1.  **New Model:** Create a brand new model; do not replicate the 'Style Donor' individual.
2.  **Style Inspiration:** Analyze 'Style Donor' for distinctive fashion elements (outfit design, hair, accessories). Use this as *inspiration* to design a **new, high-fashion outfit and look** for the generated model, evoking the 'Style Donor's' spirit and complexity (e.g., elaborate details) but as a fresh interpretation.
3.  **New Pose & Integration:** Place the unique model in a casual, natural pose within the 'Target Scene'. Ensure perfect integration of scale, lighting, and shadows, as if originally photographed there.
4.  **Dynamic Color Remix:** Dynamically remix the generated model's clothing and accessory colors to *exclusively match the primary, vibrant colors* of the 'Target Scene's' rainbow yarn couch. Ensure a natural, high-fashion color transformation.
5.  **Visual Uniqueness:** Strive for novel compositions and distinct visual outcomes in each generation, avoiding repetitive imagery.

The final output must be a single, cohesive high-fashion editorial image, merging new creativity with guided inspiration.`;

export async function remixStyle(styleDonor: ImageData, targetScene: ImageData): Promise<string> {
    const styleDonorPart = { inlineData: { data: styleDonor.base64.split(',')[1], mimeType: styleDonor.mimeType } };
    const targetScenePart = { inlineData: { data: targetScene.base64.split(',')[1], mimeType: targetScene.mimeType } };
    const textPart = { text: remixPrompt };
    
    return generateImage([textPart, styleDonorPart, targetScenePart]);
}
