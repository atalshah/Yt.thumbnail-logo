
import React, { useState, useRef } from 'react';
import * as geminiService from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import type { AppState } from '../types';

interface ImageEditToolProps {
  currentState: AppState;
  onStateChange: (newState: AppState) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const quickEdits = [
    { name: 'Hi-Res Fix', prompt: 'Upscale the image to a higher resolution, enhance details, and fix any compression artifacts.'},
    { name: 'Enhance Face', prompt: 'Identify the main face and enhance it. Make the skin look smoother, eyes sharper, and lighting more professional.'},
    { name: 'Cinematic Look', prompt: 'Apply a cinematic color grade to the image. Increase contrast, add a slight teal and orange tone.'},
    { name: 'Vibrant Colors', prompt: 'Increase the color saturation and vibrance to make the image pop.'},
];


export const ImageEditTool: React.FC<ImageEditToolProps> = ({ currentState, onStateChange, setIsLoading, setError }) => {
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { image: currentImage } = currentState;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      try {
        const base64String = await fileToBase64(file);
        onStateChange({ ...currentState, image: base64String });
      } catch (e) {
        console.error(e);
        setError('Failed to load image.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = async (editPrompt: string) => {
    if (!currentImage) {
      setError('Please generate or upload an image first.');
      return;
    }
    if (!editPrompt) {
      setError('Please enter an editing instruction.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [header, base64Data] = currentImage.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
      
      const editedImageBase64 = await geminiService.editImage(base64Data, mimeType, editPrompt);
      onStateChange({ ...currentState, image: `data:${mimeType};base64,${editedImageBase64}` });
    } catch (e) {
      console.error(e);
      setError('Failed to edit image. The model might not support this edit.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnalyze = async () => {
    if (!currentImage) {
      setError('Please generate or upload an image first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const [header, base64Data] = currentImage.split(',');
        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
        const analysis = await geminiService.analyzeImage(base64Data, mimeType, "Analyze this YouTube thumbnail. Provide feedback on its strengths and weaknesses for attracting viewers. Suggest 3 improvements.");
        alert(`AI Analysis:\n\n${analysis}`);
    } catch (e) {
        console.error(e);
        setError('Failed to analyze image.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Image Editor & Analyzer</h3>
      <p className="text-sm text-gray-400">Upload an image or use the one on your canvas. Then, describe the changes you want to make or use a quick edit.</p>
      
      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
      >
        Upload Image
      </button>
      
      <div className="space-y-2">
         <label className="block text-sm font-medium text-gray-300">Quick Edits</label>
         <div className="grid grid-cols-2 gap-2">
            {quickEdits.map(edit => (
                <button key={edit.name} onClick={() => handleEdit(edit.prompt)} disabled={!currentImage} className="text-xs text-center bg-gray-700 hover:bg-gray-600 p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {edit.name}
                </button>
            ))}
         </div>
      </div>

      <div>
        <label htmlFor="edit-prompt" className="block text-sm font-medium text-gray-300 mb-1">Custom Edit Instruction</label>
        <textarea
          id="edit-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Add a retro filter, or Remove the person in the background"
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none h-24 resize-none"
          disabled={!currentImage}
        />
      </div>
      
      <button
        onClick={() => handleEdit(prompt)}
        disabled={!currentImage || !prompt}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        Apply Custom Edit
      </button>
      
      <button
        onClick={handleAnalyze}
        disabled={!currentImage}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        Analyze Thumbnail
      </button>
    </div>
  );
};
