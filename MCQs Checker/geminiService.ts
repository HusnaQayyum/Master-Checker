
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MCQ_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    studentName: { type: Type.STRING, description: "Name of the student if found on the sheet" },
    studentId: { type: Type.STRING, description: "ID of the student if found on the sheet" },
    answers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionNumber: { type: Type.INTEGER },
          answer: { type: Type.STRING, description: "The selected option (e.g., A, B, C, D) or empty string if not answered" }
        },
        required: ["questionNumber", "answer"]
      }
    }
  },
  required: ["answers"]
};

/**
 * Resizes an image to stay well within proxy payload limits (approx 1MB) 
 * while maintaining enough clarity for high-accuracy OCR.
 */
async function optimizeImage(base64Str: string, maxDim = 800): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);
      }
      // Using a lower quality factor to significantly reduce base64 string length
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
}

/**
 * Executes an API call with basic retry logic for 5xx errors.
 */
async function callGeminiWithRetry(params: any, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      if (!response.text) throw new Error("Empty response");
      return JSON.parse(response.text);
    } catch (error: any) {
      const isRetryable = error.message?.includes('500') || error.message?.includes('xhr') || i < retries;
      if (isRetryable && i < retries) {
        console.warn(`Retry attempt ${i + 1} for Gemini API...`);
        await new Promise(r => setTimeout(r, 2000 * (i + 1))); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

export async function processAnswerSheet(base64Image: string, isMasterKey: boolean = false): Promise<any> {
  // 1. Aggressively optimize image to avoid Proxy 500/XHR errors
  const optimizedBase64 = await optimizeImage(base64Image);
  
  const systemInstruction = isMasterKey 
    ? "Extract question numbers and correct answers from the provided Master Answer Key image. Return valid JSON only."
    : "Grade the student's answer sheet. Extract Name, ID, and selected options (A,B,C,D). Return valid JSON only.";

  return callGeminiWithRetry({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: optimizedBase64.split(',')[1] } },
        { text: "Analyze the attached MCQ sheet." }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: MCQ_RESPONSE_SCHEMA,
    },
  });
}
