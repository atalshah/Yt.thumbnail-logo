
export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface TextOverlay {
    id: string;
    content: string;
    x: number;
    y: number;
    size: number;
    color: string;
    font: string;
    bold: boolean;
    italic: boolean;
    opacity: number;
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    groundingChunks?: any[];
}

export interface AppState {
  image: string | null;
  texts: TextOverlay[];
}
