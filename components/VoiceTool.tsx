
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { LiveSession } from '@google/genai';
import { connectToLive } from '../services/geminiService';
import { decode, decodeAudioData, encode } from '../utils/audioUtils';
import { MicIcon } from './icons';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

export const VoiceTool: React.FC<{ setError: (error: string | null) => void }> = ({ setError }) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [transcription, setTranscription] = useState<{ user: string; model: string; history: string[] }>({
        user: '',
        model: '',
        history: [],
    });
    
    const sessionRef = useRef<LiveSession | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);

    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const stopConversation = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
         if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
        setConnectionState('idle');
    }, []);

    const startConversation = async () => {
        if (connectionState !== 'idle') return;

        setConnectionState('connecting');
        setTranscription({ user: '', model: '', history: [] });
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const sessionPromise = connectToLive({
                onopen: () => setConnectionState('connected'),
                onclose: () => stopConversation(),
                onerror: (e) => {
                    console.error('Live connection error:', e);
                    setError('Voice connection failed.');
                    stopConversation();
                },
                onmessage: async (message) => {
                    setTranscription(prev => {
                        const newState = { ...prev };
                        if (message.serverContent?.inputTranscription) {
                            newState.user = message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            newState.model = message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            if (newState.user || newState.model) {
                                newState.history = [...newState.history, `You: ${newState.user}`, `AI: ${newState.model}`];
                            }
                            newState.user = '';
                            newState.model = '';
                        }
                        return newState;
                    });

                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData && outputAudioContextRef.current) {
                        const outputCtx = outputAudioContextRef.current;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                }
            });
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const source = audioContextRef.current.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (event) => {
                 sessionPromise.then(session => {
                    const inputData = event.inputBuffer.getChannelData(0);
                    const l = inputData.length;
                    const int16 = new Int16Array(l);
                    for (let i = 0; i < l; i++) {
                        int16[i] = inputData[i] * 32768;
                    }
                    session.sendRealtimeInput({
                        media: {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        }
                    });
                });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current.destination);
            processorRef.current = scriptProcessor;
            sessionRef.current = await sessionPromise;

        } catch (e) {
            console.error('Failed to start conversation:', e);
            setError('Could not access microphone.');
            stopConversation();
        }
    };
    
    useEffect(() => {
        return () => stopConversation();
    }, [stopConversation]);

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Voice Assistant</h3>
            <p className="text-sm text-gray-400">Have a real-time conversation with the AI. Brainstorm ideas, ask for advice, or practice your video script.</p>
            
            <div className="flex justify-center my-4">
                <button
                    onClick={connectionState === 'idle' ? startConversation : stopConversation}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-300 ${
                        connectionState === 'connected' ? 'bg-red-600 animate-pulse' :
                        connectionState === 'connecting' ? 'bg-yellow-500' : 'bg-red-600'
                    }`}
                >
                    <MicIcon className="w-10 h-10" />
                </button>
            </div>
             <p className="text-center text-gray-300 font-medium">
                {connectionState === 'idle' && 'Tap to Start'}
                {connectionState === 'connecting' && 'Connecting...'}
                {connectionState === 'connected' && 'Listening... Tap to Stop'}
                {connectionState === 'error' && 'Error! Tap to Retry'}
            </p>

            <div className="bg-gray-900/50 rounded-md p-3 space-y-2 h-48 overflow-y-auto">
                {transcription.history.map((line, index) => (
                    <p key={index} className={`text-sm ${line.startsWith('You:') ? 'text-gray-300' : 'text-red-300'}`}>{line}</p>
                ))}
                 {transcription.user && <p className="text-sm text-gray-300">You: {transcription.user}</p>}
                 {transcription.model && <p className="text-sm text-red-300">AI: {transcription.model}</p>}
            </div>
        </div>
    );
};
