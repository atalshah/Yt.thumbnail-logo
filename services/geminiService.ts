
import { GoogleGenAI, Chat, GenerateContentResponse, Modality, LiveSession, LiveServerMessage } from "@google/genai";
import type { AspectRatio } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio,
        },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Image generation failed, no images returned.");
    }
    return response.generatedImages[0].image.imageBytes;
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("Image editing failed, no image returned.");
};

export const analyzeImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType } },
                { text: prompt },
            ],
        },
    });
    return response.text;
};

export const startChat = (): Chat => {
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: 'You are a creative assistant for a YouTube content creator. Provide concise, helpful, and inspiring ideas for thumbnails, channel logos, video topics, and scripts. Be friendly and encouraging.',
        },
    });
};

export const sendMessage = async (chat: Chat, message: string): Promise<GenerateContentResponse> => {
    return await chat.sendMessage({ message });
};

export const getGroundedResponse = async (
    prompt: string,
    useSearch: boolean,
    useMaps: boolean,
    thinkingMode: boolean,
    location: { latitude: number; longitude: number; } | null
): Promise<{ text: string, chunks: any[] }> => {
    const tools: any[] = [];
    if (useSearch) tools.push({ googleSearch: {} });
    if (useMaps) tools.push({ googleMaps: {} });

    const model = thinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    const config: any = {};
    if (tools.length > 0) {
        config.tools = tools;
        if (useMaps && location) {
            config.toolConfig = { retrievalConfig: { latLng: location } };
        }
    }
    if (thinkingMode) {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { text: response.text, chunks };
};

interface LiveCallbacks {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (error: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}

export const connectToLive = async (callbacks: LiveCallbacks): Promise<LiveSession> => {
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are a friendly and helpful YouTube creator assistant. Keep your responses conversational and concise.',
        },
    });
};
