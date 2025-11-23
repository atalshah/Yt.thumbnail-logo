
import React, { useState, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { ToolPanel } from './components/ToolPanel';
import { Loader } from './components/Loader';
import type { TextOverlay } from './types';
import { SparklesIcon, DownloadIcon, UndoIcon, RedoIcon } from './components/icons';

interface AppState {
  image: string | null;
  texts: TextOverlay[];
}

const App: React.FC = () => {
  const [history, setHistory] = useState<AppState[]>([{ image: null, texts: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTool, setActiveTool] = useState('generate');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Drag-and-drop state
  const [draggingTextId, setDraggingTextId] = useState<string | null>(null);
  const [tempTexts, setTempTexts] = useState<TextOverlay[] | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const currentState = history[historyIndex];
  const { image: currentImage } = currentState;
  const textsToRender = tempTexts ?? currentState.texts;

  const recordState = useCallback((newState: AppState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newState]);
    setHistoryIndex(newHistory.length);
  }, [history, historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleSetError = useCallback((message: string | null) => {
    setError(message);
    if (message) {
      setTimeout(() => setError(null), 5000);
    }
  }, []);

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const texts = currentState.texts;

    const drawContent = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        texts.forEach(text => {
            ctx.globalAlpha = text.opacity;
            const fontStyle = text.italic ? 'italic' : 'normal';
            const fontWeight = text.bold ? 'bold' : 'normal';
            ctx.font = `${fontStyle} ${fontWeight} ${text.size}px ${text.font}`;
            ctx.fillStyle = text.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const x = canvas.width * (text.x / 100);
            const y = canvas.height * (text.y / 100);
            
            ctx.fillText(text.content, x, y);
            ctx.globalAlpha = 1.0;
        });
        
        const link = document.createElement('a');
        link.download = 'youtube-studio-creation.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    if (currentImage) {
        const imageElement = new Image();
        imageElement.crossOrigin = 'anonymous';
        imageElement.src = currentImage;
        imageElement.onload = () => {
            canvas.width = imageElement.naturalWidth;
            canvas.height = imageElement.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(imageElement, 0, 0);
            drawContent();
        };
        imageElement.onerror = () => {
            setError("Could not load image for download.");
        };
    } else {
        canvas.width = 1280;
        canvas.height = 720;
        drawContent();
    }
  };
  
  const handleTextMouseDown = (e: React.MouseEvent, text: TextOverlay) => {
    e.preventDefault();
    setDraggingTextId(text.id);
    setTempTexts(currentState.texts); // Create a snapshot for dragging

    const containerRect = canvasContainerRef.current!.getBoundingClientRect();
    const textXpx = (text.x / 100) * containerRect.width;
    const textYpx = (text.y / 100) * containerRect.height;

    dragOffsetRef.current = {
        x: e.clientX - containerRect.left - textXpx,
        y: e.clientY - containerRect.top - textYpx
    };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingTextId || !canvasContainerRef.current) return;

    const containerRect = canvasContainerRef.current.getBoundingClientRect();
    const newX = ((e.clientX - containerRect.left - dragOffsetRef.current.x) / containerRect.width) * 100;
    const newY = ((e.clientY - containerRect.top - dragOffsetRef.current.y) / containerRect.height) * 100;

    setTempTexts(prevTexts =>
      prevTexts!.map(t =>
        t.id === draggingTextId ? { ...t, x: newX, y: newY } : t
      )
    );
  };

  const handleCanvasMouseUp = () => {
    if (draggingTextId && tempTexts) {
      recordState({ ...currentState, texts: tempTexts });
    }
    setDraggingTextId(null);
    setTempTexts(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col font-sans">
      <Header />
      {error && (
        <div className="absolute top-20 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50">
          <p>{error}</p>
        </div>
      )}
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4">
        <ToolPanel
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          currentState={currentState}
          onStateChange={recordState}
          setIsLoading={setIsLoading}
          setError={handleSetError}
        />
        <div 
          ref={canvasContainerRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          className="flex-grow flex items-center justify-center bg-gray-800 rounded-lg p-4 relative aspect-[16/9] md:aspect-auto overflow-hidden"
        >
          {isLoading && <Loader message="AI is thinking..." />}
          {!currentImage && !isLoading && !textsToRender.length && (
             <div className="text-center text-gray-400">
                <SparklesIcon className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Your Creation Starts Here</h2>
                <p>Use the tools on the left to generate an image or start fresh.</p>
            </div>
          )}
          {currentImage && (
              <img ref={imageRef} src={currentImage} alt="Generated or uploaded content" className="max-w-full max-h-full object-contain rounded-md select-none pointer-events-none" />
          )}
          {textsToRender.map(text => (
             <div 
                key={text.id} 
                onMouseDown={(e) => handleTextMouseDown(e, text)}
                className="absolute p-2 cursor-move select-none" 
                style={{ 
                    left: `${text.x}%`, 
                    top: `${text.y}%`, 
                    transform: 'translate(-50%, -50%)', 
                    color: text.color, 
                    fontFamily: text.font, 
                    fontSize: `${text.size}px`, 
                    fontWeight: text.bold ? 'bold' : 'normal', 
                    fontStyle: text.italic ? 'italic' : 'normal', 
                    textShadow: '2px 2px 4px rgba(0,0,0,0.7)', 
                    opacity: text.opacity 
                }}>
                {text.content}
            </div>
          ))}
          <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={historyIndex === 0}
                className="bg-gray-900/50 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo"
              >
                <UndoIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex === history.length - 1}
                className="bg-gray-900/50 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo"
              >
                <RedoIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleDownload}
                className="bg-gray-900/50 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-200"
                title="Download Image"
              >
                <DownloadIcon className="w-6 h-6" />
              </button>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
