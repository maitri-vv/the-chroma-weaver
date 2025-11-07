import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ResultDisplay from './components/ResultDisplay';
import LoadingIndicator from './components/LoadingIndicator';
import { fuseImages, extendScene, remixStyle } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import type { ImageData, WeaveMode } from './types';
import { UndoIcon } from './components/icons/UndoIcon';
import { RedoIcon } from './components/icons/RedoIcon';

const ModeSelector: React.FC<{
  currentMode: WeaveMode;
  onModeChange: (mode: WeaveMode) => void;
}> = ({ currentMode, onModeChange }) => {
  const modes: { id: WeaveMode; label: string; description: string }[] = [
    { id: 'FUSE', label: 'Fuse Model into Scene', description: 'Generate a unique model, inspired by a style donor, and seamlessly blend them into a new background scene with harmonized styling.' },
    { id: 'EXTEND', label: 'Extend Scene View', description: 'Generate a new view from an existing scene, maintaining its style.' },
    { id: 'REMIX', label: 'Remix Model Style', description: 'Create a new model using a style donor, and place it in a target scene.' },
  ];

  const baseButtonClass = "px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500";
  const activeClass = "bg-purple-600 text-white";
  const inactiveClass = "text-gray-300 bg-gray-700 hover:bg-gray-600";

  return (
    <div className="mb-8 text-center">
        <div className="inline-flex flex-wrap justify-center rounded-lg shadow-md bg-gray-800 p-1 gap-1">
            {modes.map((mode) => (
                <button
                    key={mode.id}
                    onClick={() => onModeChange(mode.id)}
                    className={`${baseButtonClass} ${currentMode === mode.id ? activeClass : inactiveClass}`}
                    aria-current={currentMode === mode.id ? 'page' : undefined}
                >
                    {mode.label}
                </button>
            ))}
        </div>
        <p className="text-gray-400 mt-3 text-sm max-w-2xl mx-auto min-h-[2.5rem] flex items-center justify-center">
            {modes.find(m => m.id === currentMode)?.description}
        </p>
    </div>
  );
};

interface History {
  past: string[];
  present: string;
  future: string[];
}

const initialHistory: History = {
  past: [],
  present: '',
  future: [],
};


const App: React.FC = () => {
  const [mode, setMode] = useState<WeaveMode>('FUSE');
  const [image1, setImage1] = useState<ImageData | null>(null);
  const [image2, setImage2] = useState<ImageData | null>(null);
  const [history, setHistory] = useState<History>(initialHistory);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: WeaveMode) => {
    setMode(newMode);
    setImage1(null);
    setImage2(null);
    setHistory(initialHistory);
    setError(null);
  };

  const handleImage1Upload = async (file: File) => {
    try {
      const { base64, mimeType } = await fileToBase64(file);
      setImage1({ base64, mimeType });
      setHistory(initialHistory);
      setError(null);
    } catch (err) {
      setError('Failed to read the first image.');
    }
  };

  const handleImage2Upload = async (file: File) => {
    try {
      const { base64, mimeType } = await fileToBase64(file);
      setImage2({ base64, mimeType });
      setHistory(initialHistory);
      setError(null);
    } catch (err) {
      setError('Failed to read the second image.');
    }
  };

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let result: string | null = null;
      switch (mode) {
        case 'FUSE':
          if (!image1 || !image2) {
            throw new Error('Please upload both a Model Style Donor and a Background image.');
          }
          result = await fuseImages(image1, image2);
          break;
        case 'EXTEND':
          if (!image1) {
            throw new Error('Please upload a Source Scene image.');
          }
          result = await extendScene(image1);
          break;
        case 'REMIX':
          if (!image1 || !image2) {
            throw new Error('Please upload both a Style Donor and a Target Scene image.');
          }
          result = await remixStyle(image1, image2);
          break;
        default:
          throw new Error('Invalid mode selected.');
      }
      
      const newImage = `data:image/jpeg;base64,${result}`;
      setHistory(current => {
        const newPast = [...current.past, current.present];
        return {
            past: newPast,
            present: newImage,
            future: [],
        };
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  }, [mode, image1, image2]);

  const handleUndo = useCallback(() => {
    setHistory(current => {
      if (current.past.length === 0) return current;
      const newFuture = [current.present, ...current.future];
      const newPresent = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, current.past.length - 1);
      return { past: newPast, present: newPresent, future: newFuture };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setHistory(current => {
      if (current.future.length === 0) return current;
      const newPast = [...current.past, current.present];
      const newPresent = current.future[0];
      const newFuture = current.future.slice(1);
      return { past: newPast, present: newPresent, future: newFuture };
    });
  }, []);

  const getUploaderConfig = () => {
      switch (mode) {
          case 'FUSE':
              return {
                  showUploader1: true,
                  uploader1Title: "Model Style Donor (Vibe)",
                  showUploader2: true,
                  uploader2Title: "Background Image (Room)",
                  buttonText: "Fuse Style",
                  isButtonDisabled: !image1 || !image2 || isLoading,
              };
          case 'EXTEND':
              return {
                  showUploader1: true,
                  uploader1Title: "Source Scene (Vibe Donor)",
                  showUploader2: false,
                  uploader2Title: "",
                  buttonText: "Extend Scene",
                  isButtonDisabled: !image1 || isLoading,
              };
          case 'REMIX':
              return {
                  showUploader1: true,
                  uploader1Title: "Style Donor (Model)",
                  showUploader2: true,
                  uploader2Title: "Target Scene (Room)",
                  buttonText: "Remix Style",
                  isButtonDisabled: !image1 || !image2 || isLoading,
              };
      }
  };

  const config = getUploaderConfig();
  const gridLayoutClass = mode === 'EXTEND' ? 'lg:grid-cols-2' : 'lg:grid-cols-3';
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 md:p-8">
      {isLoading && <LoadingIndicator />}
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="mt-8">
          <ModeSelector currentMode={mode} onModeChange={handleModeChange} />
          <div className={`grid grid-cols-1 ${gridLayoutClass} gap-8`}>
            {config.showUploader1 && (
                <ImageUploader 
                  title={config.uploader1Title} 
                  onImageUpload={handleImage1Upload} 
                  imagePreview={image1?.base64}
                />
            )}
            {config.showUploader2 && (
                <ImageUploader 
                  title={config.uploader2Title} 
                  onImageUpload={handleImage2Upload} 
                  imagePreview={image2?.base64}
                />
            )}
            <ResultDisplay generatedImage={history.present} />
          </div>
          <div className="mt-8 text-center">
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={handleUndo}
                disabled={!canUndo || isLoading}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                aria-label="Undo last generation"
                title="Undo"
              >
                <UndoIcon className="w-6 h-6" />
              </button>
              <button
                onClick={handleGenerate}
                disabled={config.isButtonDisabled}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 ease-in-out shadow-lg shadow-purple-900/50 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-400"
              >
                {isLoading ? 'Weaving...' : config.buttonText}
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo || isLoading}
                className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
                aria-label="Redo generation"
                title="Redo"
              >
                <RedoIcon className="w-6 h-6" />
              </button>
            </div>
            {error && <p className="text-red-400 mt-4">{error}</p>}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;