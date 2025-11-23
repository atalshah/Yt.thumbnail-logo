
import React, { useState, useEffect, useRef } from 'react';
import type { Chat } from '@google/genai';
import * as geminiService from '../services/geminiService';
import type { ChatMessage } from '../types';
import { UserIcon, SparklesIcon, SearchIcon, MapIcon, BrainIcon } from './icons';

export const ChatTool: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const [useMaps, setUseMaps] = useState(false);
    const [thinkingMode, setThinkingMode] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; } | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chat) {
            setChat(geminiService.startChat());
        }
    }, [chat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);
    
    useEffect(() => {
        if(useMaps && !userLocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    console.warn("Could not get user location:", error.message);
                    setUseMaps(false); // Disable if permission denied
                }
            );
        }
    }, [useMaps, userLocation]);

    const handleSendMessage = async () => {
        if (!input.trim() || isLoading) return;
        const messageText = input;
        setInput('');
        setIsLoading(true);

        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: messageText }] };
        setHistory(prev => [...prev, newUserMessage]);

        try {
            let responseText = '';
            let groundingChunks: any[] = [];

            if (useSearch || useMaps || thinkingMode) {
                 const { text, chunks } = await geminiService.getGroundedResponse(messageText, useSearch, useMaps, thinkingMode, userLocation);
                 responseText = text;
                 groundingChunks = chunks;
            } else {
                 if(chat){
                    const result = await geminiService.sendMessage(chat, messageText);
                    responseText = result.text;
                 }
            }
            
            const newModelMessage: ChatMessage = { role: 'model', parts: [{ text: responseText }], groundingChunks };
            setHistory(prev => [...prev, newModelMessage]);

        } catch (error) {
            console.error(error);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: 'Sorry, I encountered an error.' }] };
            setHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = (msg: ChatMessage, index: number) => {
        const isUser = msg.role === 'user';
        const Icon = isUser ? UserIcon : SparklesIcon;
        return (
            <div key={index} className={`flex gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-xs md:max-w-sm ${isUser ? 'bg-red-600 order-2' : 'bg-gray-700 order-1'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                        <div className="mt-2 border-t border-gray-600 pt-2">
                            <h4 className="text-xs font-semibold text-gray-400 mb-1">Sources:</h4>
                            <ul className="text-xs space-y-1">
                                {msg.groundingChunks.map((chunk, i) => {
                                    const source = chunk.web || chunk.maps;
                                    return source?.uri ? (
                                    <li key={i} className="truncate">
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline">
                                           {i+1}. {source.title}
                                        </a>
                                    </li>
                                    ) : null;
                                })}
                            </ul>
                        </div>
                    )}
                </div>
                 <div className={`p-2 rounded-full h-8 w-8 flex-shrink-0 flex items-center justify-center ${isUser ? 'bg-gray-600 order-1' : 'bg-red-600 order-2'}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold text-white mb-2">AI Assistant</h3>
            <p className="text-sm text-gray-400 mb-2">Ask for thumbnail ideas, channel names, or video scripts. Enable tools for up-to-date or location-based info.</p>
            <div className="flex flex-wrap gap-2 mb-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer p-2 bg-gray-700 rounded-full has-[:checked]:bg-green-600 has-[:checked]:text-white transition-colors">
                    <SearchIcon className="w-4 h-4" /> Google Search <input type="checkbox" checked={useSearch} onChange={e => { setUseSearch(e.target.checked); setThinkingMode(false); }} className="hidden"/>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer p-2 bg-gray-700 rounded-full has-[:checked]:bg-green-600 has-[:checked]:text-white transition-colors">
                    <MapIcon className="w-4 h-4" /> Google Maps <input type="checkbox" checked={useMaps} onChange={e => { setUseMaps(e.target.checked); setThinkingMode(false); }} className="hidden"/>
                </label>
                 <label className="flex items-center gap-2 text-xs cursor-pointer p-2 bg-gray-700 rounded-full has-[:checked]:bg-purple-600 has-[:checked]:text-white transition-colors">
                    <BrainIcon className="w-4 h-4" /> Thinking Mode <input type="checkbox" checked={thinkingMode} onChange={e => { setThinkingMode(e.target.checked); setUseMaps(false); setUseSearch(false); }} className="hidden"/>
                </label>
            </div>
            <div className="flex-grow bg-gray-900/50 rounded-md p-2 overflow-y-auto mb-2 min-h-64">
                {history.length === 0 && <div className="text-center text-gray-500 pt-10">Chat history will appear here.</div>}
                {history.map(renderMessage)}
                {isLoading && <div className="flex justify-start"><div className="p-3 rounded-lg bg-gray-700 text-sm">Thinking...</div></div>}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask for ideas..."
                    className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500">
                    Send
                </button>
            </div>
        </div>
    );
};
