
import React, { useState } from 'react';
import type { AspectRatio, AppState } from '../types';
import * as geminiService from '../services/geminiService';

interface ImageGenToolProps {
  onStateChange: (newState: AppState) => void;
  currentState: AppState;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const ImageGenTool: React.FC<ImageGenToolProps> = ({ onStateChange, currentState, setIsLoading, setError }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const base64Image = await geminiService.generateImage(prompt, aspectRatio);
      onStateChange({
        ...currentState,
        image: `data:image/jpeg;base64,${base64Image}`,
      });
    } catch (e) {
      console.error(e);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Image Generation</h3>
      <p className="text-sm text-gray-400">Describe the thumbnail or logo you want to create. Be as specific as possible for the best results.</p>
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">Prompt</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A vibrant, high-tech logo for a gaming channel with a stylized wolf head"
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none h-28 resize-none"
        />
      </div>
      <div>
        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
        <select
          id="aspect-ratio"
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
        >
          <option value="16:9">16:9 (Thumbnail)</option>
          <option value="1:1">1:1 (Logo/Profile)</option>
          <option value="9:16">9:16 (Shorts)</option>
          <option value="4:3">4:3 (Standard)</option>
          <option value="3:4">3:4 (Portrait)</option>
        </select>
      </div>
      <button
        onClick={handleGenerate}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500"
      >
        Generate
      </button>
    </div>
  );
};
