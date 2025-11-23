
import React from 'react';
import { ImageGenTool } from './ImageGenTool';
import { ImageEditTool } from './ImageEditTool';
import { ChatTool } from './ChatTool';
import { VoiceTool } from './VoiceTool';
import { TextTool } from './TextTool';
import { ImageIcon, EditIcon, ChatIcon, MicIcon, TextIcon, ClearIcon } from './icons';
import type { AppState } from '../types';

interface ToolPanelProps {
  activeTool: string;
  setActiveTool: (tool: string) => void;
  currentState: AppState;
  onStateChange: (newState: AppState) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const tools = [
  { id: 'generate', name: 'Generate', icon: ImageIcon },
  { id: 'edit', name: 'Edit', icon: EditIcon },
  { id: 'text', name: 'Text', icon: TextIcon },
  { id: 'chat', name: 'Assistant', icon: ChatIcon },
  { id: 'voice', name: 'Voice', icon: MicIcon },
];

export const ToolPanel: React.FC<ToolPanelProps> = (props) => {
  const { activeTool, setActiveTool, onStateChange } = props;

  const handleClearCanvas = () => {
    onStateChange({ image: null, texts: [] });
  };

  const renderTool = () => {
    switch (activeTool) {
      case 'generate':
        return <ImageGenTool {...props} />;
      case 'edit':
        return <ImageEditTool {...props} />;
      case 'chat':
        return <ChatTool {...props} />;
      case 'voice':
        return <VoiceTool {...props} />;
      case 'text':
        return <TextTool {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full md:w-96 lg:w-[450px] flex-shrink-0 bg-gray-800 rounded-lg flex flex-col overflow-hidden">
      <div className="flex justify-around bg-gray-900 p-2">
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`flex flex-col items-center p-2 rounded-md transition-colors duration-200 w-1/5 ${
              activeTool === tool.id ? 'bg-red-600 text-white' : 'hover:bg-gray-700 text-gray-300'
            }`}
            aria-label={tool.name}
          >
            <tool.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{tool.name}</span>
          </button>
        ))}
         <button
            onClick={handleClearCanvas}
            className="flex flex-col items-center p-2 rounded-md transition-colors duration-200 w-1/5 hover:bg-gray-700 text-gray-300"
            aria-label="Clear Canvas"
          >
            <ClearIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Clear</span>
          </button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        {renderTool()}
      </div>
    </div>
  );
};
