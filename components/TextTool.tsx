
import React, { useState } from 'react';
import type { TextOverlay, AppState } from '../types';

interface TextToolProps {
  onStateChange: (newState: AppState) => void;
  currentState: AppState;
}

const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Impact', 'Comic Sans MS'];

export const TextTool: React.FC<TextToolProps> = ({ onStateChange, currentState }) => {
  const [content, setContent] = useState('Your Text Here');
  const [size, setSize] = useState(48);
  const [color, setColor] = useState('#FFFFFF');
  const [font, setFont] = useState('Impact');
  const [isBold, setIsBold] = useState(true);
  const [isItalic, setIsItalic] = useState(false);
  const [opacity, setOpacity] = useState(1);

  const handleAddText = () => {
    if (!content.trim()) return;
    
    const newText: TextOverlay = {
      id: Date.now().toString(),
      content,
      size,
      color,
      font,
      bold: isBold,
      italic: isItalic,
      opacity,
      x: 50, // Default position to center
      y: 50,
    };
    
    onStateChange({
      ...currentState,
      texts: [...currentState.texts, newText],
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Add Text</h3>
      <p className="text-sm text-gray-400">Customize and add text layers to your design. You can drag the text on the canvas to reposition it.</p>
      
      <div>
        <label htmlFor="text-content" className="block text-sm font-medium text-gray-300 mb-1">Text</label>
        <textarea
          id="text-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="font-size" className="block text-sm font-medium text-gray-300 mb-1">Size</label>
          <input
            type="number"
            id="font-size"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md"
          />
        </div>
        <div>
          <label htmlFor="font-color" className="block text-sm font-medium text-gray-300 mb-1">Color</label>
          <input
            type="color"
            id="font-color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full p-1 h-10 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
          />
        </div>
      </div>

      <div>
        <label htmlFor="font-opacity" className="block text-sm font-medium text-gray-300 mb-1">Opacity</label>
        <div className="flex items-center gap-2">
            <input
                type="range"
                id="font-opacity"
                min="0"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-400 w-8">{Math.round(opacity * 100)}%</span>
        </div>
      </div>

      <div>
        <label htmlFor="font-family" className="block text-sm font-medium text-gray-300 mb-1">Font</label>
        <select
          id="font-family"
          value={font}
          onChange={(e) => setFont(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
        >
          {fonts.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isBold} onChange={e => setIsBold(e.target.checked)} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 rounded text-red-600 focus:ring-red-500"/>
          <span className="font-bold">Bold</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isItalic} onChange={e => setIsItalic(e.target.checked)} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 rounded text-red-600 focus:ring-red-500"/>
          <span className="italic">Italic</span>
        </label>
      </div>

      <button
        onClick={handleAddText}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200"
      >
        Add Text to Canvas
      </button>
    </div>
  );
};
