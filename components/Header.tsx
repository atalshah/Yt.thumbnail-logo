
import React from 'react';
import { SparklesIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-700">
      <div className="container mx-auto flex items-center gap-3">
        <SparklesIcon className="w-8 h-8 text-red-400" />
        <h1 className="text-2xl font-bold tracking-tight text-white">AI YouTube Studio</h1>
      </div>
    </header>
  );
};
