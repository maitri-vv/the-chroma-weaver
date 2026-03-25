import React, { useState, useRef, useCallback, useEffect } from 'react';
import { fuseImages, extendScene, remixStyle } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import type { ImageData, WeaveMode } from './types';

// Catchy loading phases to build anticipation
const LOADING_PHRASES = [
  "Analyzing your Fit... 👗",
  "Consulting the Vogue Archives... 📖",
  "Extracting the true Vibe... ✨",
  "Weaving the Chroma... 🧶",
  "Perfecting the Lighting... 📸",
  "Serving the final Look... 💅"
];

// Helper Uploader Component
interface UploaderProps {
  title: string;
  icon: string;
  imagePreview: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  shape?: 'square' | 'video';
}

const Uploader: React.FC<UploaderProps> = ({ title, icon, imagePreview, onUpload, onClear, shape = 'square' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onUpload(e.target.files[0]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) onUpload(e.dataTransfer.files[0]);
  }, [onUpload]);

  const aspectRatioClass = shape === 'square' ? 'aspect-square lg:aspect-[4/3]' : 'aspect-video';

  return (
    <div className="relative bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 lg:p-5 pink-glow-shadow transition-all duration-500 hover:shadow-xl hover:-translate-y-1 group border border-white/60">
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none rounded-2xl"></div>
      <label className="block text-xs font-bold text-[#a7295a] dark:text-pink-300 mb-3 uppercase tracking-widest relative z-10">{title}</label>
      
      {!imagePreview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`w-full rounded-xl bg-white/60 dark:bg-slate-900/40 border-2 border-dashed border-[#a7295a]/30 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/90 hover:border-[#a7295a]/80 transition-all ${aspectRatioClass} min-h-[120px] shadow-inner group-hover:scale-[1.02] relative z-10`}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <div className="w-12 h-12 rounded-full bg-[#fcedf2] dark:bg-pink-900/50 flex items-center justify-center text-[#a7295a] shadow-sm transform transition-transform group-hover:rotate-12">
            <span className="material-symbols-outlined text-xl">{icon}</span>
          </div>
          <p className="text-[10px] sm:text-xs font-semibold text-[#a7295a]/70">Tap or drop your inspiration</p>
        </div>
      ) : (
        <div className="w-full flex items-center justify-center rounded-xl overflow-hidden relative shadow-inner bg-black/5 p-1">
          <img src={imagePreview} alt="Selected Preview" className="w-full h-auto max-h-[35vh] lg:max-h-[250px] object-contain hover:scale-[1.02] transition-transform duration-700 rounded-lg" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#a7295a] shadow-lg hover:scale-110 hover:bg-red-50 hover:text-red-500 transition-all z-10"
          >
            <span className="material-symbols-outlined text-[16px] font-bold">close</span>
          </button>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<WeaveMode>('FUSE');
  const [image1, setImage1] = useState<{ data: ImageData, preview: string } | null>(null);
  const [image2, setImage2] = useState<{ data: ImageData, preview: string } | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedFile, setGeneratedFile] = useState<File | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
      }, 2500);
    } else {
      setLoadingTextIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleModeChange = (newMode: WeaveMode) => {
    setMode(newMode);
    setImage1(null);
    setImage2(null);
    setGeneratedImage(null);
    setGeneratedFile(null);
    setError(null);
  };

  const handleUpload = async (file: File, isFirst: boolean) => {
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const preview = URL.createObjectURL(file);
      if (isFirst) setImage1({ data: { base64, mimeType }, preview });
      else setImage2({ data: { base64, mimeType }, preview });
      setError(null);
    } catch (err) {
      setError('Failed to process image upload.');
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let result: string | null = null;
      if (mode === 'FUSE') {
        if (!image1 || !image2) throw new Error('Please upload both inspirations.');
        result = await fuseImages(image1.data, image2.data);
      } else if (mode === 'EXTEND') {
        if (!image1) throw new Error('Please upload your source aesthetic.');
        result = await extendScene(image1.data);
      } else if (mode === 'REMIX') {
        if (!image1 || !image2) throw new Error('Please upload both inspirations.');
        result = await remixStyle(image1.data, image2.data);
      }
      
      if (result) {
        const finalUrl = result.startsWith('http') || result.startsWith('data:') 
          ? result 
          : `data:image/jpeg;base64,${result}`;
          
        setGeneratedImage(finalUrl);
        
        // Pre-build the File object so sharing is completely synchronous (Required for strict iOS Safari PWAs)
        try {
            const res = await fetch(finalUrl);
            const blob = await res.blob();
            const file = new File([blob], `TheChromaWeaver-${Date.now()}.png`, { type: blob.type });
            setGeneratedFile(file);
        } catch (e) {
            console.error("Failed to build shareable file:", e);
        }

        setHistory(prev => [finalUrl, ...prev].slice(0, 3));
        showToast("✨ Masterpiece Created ✨");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'The weaving threads snapped! Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!generatedImage || !generatedFile) return;

    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent.toLowerCase())) {
        try {
            // Synchronous call using pre-computed file! Safari won't block this!
            if (navigator.canShare && navigator.canShare({ files: [generatedFile] })) {
                await navigator.share({
                    title: 'The Chroma Weaver',
                    text: 'Look at this pristine fashion look I created on The Chroma Weaver! ✨💅',
                    files: [generatedFile]
                });
            } else {
                await navigator.share({
                    title: 'The Chroma Weaver',
                    text: 'Look at this pristine fashion look I created on The Chroma Weaver! ✨💅',
                    url: "https://thechromaweaver.com"
                });
            }
            showToast("Shared successfully!");
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                console.error("Native share failed:", e);
                showToast("Share failed. Try long-pressing the image to copy it.");
            }
        }
        return;
    }

    try {
        await navigator.clipboard.write([
            new ClipboardItem({ [generatedFile.type]: generatedFile })
        ]);
        showToast("💅 Copied to Clipboard! Ready to paste.");
    } catch (e) {
        navigator.clipboard.writeText("https://thechromaweaver.com");
        showToast("Link copied!");
    }
  };

  const isBtnDisabled = isLoading || (!image1) || (mode !== 'EXTEND' && !image2);

  return (
    <div className="text-[#302e30] dark:text-gray-100 min-h-screen lg:h-screen lg:overflow-hidden selection:bg-pink-200 selection:text-pink-900 flex flex-col font-sans mb-20 lg:mb-0">
      
      {/* Toast Notification */}
      <div className={`fixed top-20 right-1/2 translate-x-1/2 lg:translate-x-0 lg:right-8 z-50 transition-all duration-500 transform custom-shadow-lg ${toastMessage ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
          <div className="bg-white/95 backdrop-blur-xl border border-pink-200 px-6 py-3 rounded-full flex items-center gap-3">
              <span className="text-[#a7295a] font-bold text-sm tracking-wide">{toastMessage}</span>
          </div>
      </div>

      {/* Minimalism TopAppBar */}
      <header className="fixed top-0 w-full flex justify-between items-center px-6 lg:px-12 py-4 bg-white/70 backdrop-blur-2xl dark:bg-slate-900/70 z-40 shadow-sm h-16 border-b border-[#a7295a]/10">
        <div className="flex items-center gap-2">
          <span className="text-xl lg:text-2xl font-serif italic font-bold text-[#302e30] dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-[#a7295a] to-[#ff709f]">
            THE CHROMA WEAVER
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <a className="text-[#302e30]/80 font-bold text-[10px] uppercase tracking-[0.2em] hover:text-[#a7295a] transition-colors relative group hidden sm:block" href="#">
            The Manifesto
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-[#a7295a] transition-all duration-300 group-hover:w-full"></span>
          </a>
          <a href="https://github.com/maitri-vv/the-chroma-weaver" target="_blank" rel="noreferrer" className="glass-icon-btn w-8 h-8 rounded-full flex items-center justify-center text-[#302e30]/60 hover:text-[#a7295a] hover:bg-pink-50 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
          </a>
        </div>
      </header>

      <main className="flex-1 mt-16 px-4 md:px-8 max-w-[1500px] w-full mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10 pb-20 lg:pb-8 overflow-y-auto lg:overflow-hidden pt-6 lg:pt-8">
        
        {/* Left Sidebar (Uploaders) */}
        <aside className="w-full lg:w-[420px] xl:w-[480px] flex flex-col gap-4 lg:h-full lg:overflow-y-auto no-scrollbar order-1 lg:order-none pb-4 flex-shrink-0">
          
          <section className="bg-white/50 backdrop-blur-xl dark:bg-slate-800/50 p-5 rounded-3xl flex flex-col gap-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60">
            <div>
              <h2 className="font-serif text-2xl text-[#302e30] dark:text-white tracking-tighter mb-1">Concept Studio ✨</h2>
              <p className="text-[#a7295a]/80 text-[10px] font-bold uppercase tracking-widest">Select Generation Method</p>
            </div>
            
            <div className="flex p-1.5 bg-black/5 dark:bg-black/20 rounded-full gap-1">
              {[
                { id: 'FUSE', icon: 'auto_fix_high', label: 'Fuse' },
                { id: 'EXTEND', icon: 'aspect_ratio', label: 'Extend' },
                { id: 'REMIX', icon: 'style', label: 'Remix' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id as WeaveMode)}
                  className={`flex-1 flex flex-col items-center justify-center px-2 py-2.5 rounded-full transition-all duration-500 relative overflow-hidden ${
                    mode === m.id 
                      ? 'bg-white shadow-md text-[#a7295a] scale-[1.02]'
                      : 'text-gray-500 hover:text-[#a7295a] hover:bg-white/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] mb-1 z-10">{m.icon}</span>
                  <span className="text-[9px] uppercase tracking-widest font-black z-10">{m.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Uploaders */}
          <section className="flex flex-col gap-4 flex-shrink-0">
            <Uploader 
              title={mode === 'FUSE' ? 'The Fit (Outfit Idea)' : mode === 'EXTEND' ? 'The Vibe (Source Room)' : 'Style Donor (Aesthetic)'} 
              icon="add_photo_alternate" 
              imagePreview={image1?.preview || null} 
              onUpload={(file) => handleUpload(file, true)} 
              onClear={() => setImage1(null)} 
              shape="square" 
            />

            {mode !== 'EXTEND' && (
              <Uploader 
                title={mode === 'FUSE' ? 'The Vibe (Background Room)' : 'Target Scene (Background)'} 
                icon="wallpaper" 
                imagePreview={image2?.preview || null} 
                onUpload={(file) => handleUpload(file, false)} 
                onClear={() => setImage2(null)} 
                shape="video" 
              />
            )}
          </section>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg shadow-sm">
              <p className="text-red-700 font-bold text-[11px] font-sans">{error}</p>
            </div>
          )}

          {/* Solid Pink Clean "Weave" Button */}
          <button 
            onClick={handleGenerate}
            disabled={isBtnDisabled}
            className={`w-full rounded-2xl py-5 lg:py-6 mt-auto text-white font-black text-[15px] uppercase tracking-[0.15em] transition-all duration-500 flex flex-col items-center justify-center gap-1 flex-shrink-0 ${
              isBtnDisabled 
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-400 cursor-not-allowed border-none shadow-none' 
                : 'bg-[#a7295a] shadow-[0_15px_40px_rgb(167,41,90,0.3)] hover:bg-[#851d45] hover:shadow-[0_20px_50px_rgb(167,41,90,0.4)] hover:-translate-y-1 active:scale-95'
            }`}
          >
            {isLoading ? (
              <span className="animate-pulse">{LOADING_PHRASES[loadingTextIndex]}</span>
            ) : (
              <span className="flex items-center gap-2">
                Weave the Magic <span className="material-symbols-outlined text-lg">magic_button</span>
              </span>
            )}
          </button>
        </aside>

        {/* Right Panel (Generated Image filled container AND History Below) */}
        <div className="w-full h-full min-h-[550px] lg:min-h-0 flex-1 flex flex-col gap-5 lg:pb-0 relative">
          
          {/* Main Display Container - Absolutely filled by the image instead of boxed */}
          <div className="relative flex-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-3xl rounded-3xl overflow-hidden border border-white/80 shadow-[0_20px_60px_rgb(0,0,0,0.06)] min-h-[400px]">
            
            <div className={`absolute inset-0 bg-gradient-to-tr from-[#fcedf2] to-white dark:from-slate-800 dark:to-slate-900 transition-opacity duration-1000 ${generatedImage ? 'opacity-0' : 'opacity-100'}`}></div>

            {generatedImage ? (
              <div className="w-full h-full relative group pointer-events-none fade-in flex items-center justify-center p-2 lg:p-6">
                <img 
                  src={generatedImage} 
                  alt="Woven Result" 
                  className="w-full h-full object-contain rounded-2xl lg:rounded-3xl transition-transform duration-1000 group-hover:scale-[1.02] pointer-events-auto drop-shadow-2xl" 
                />
                
                {/* Floating Tag */}
                <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 dark:bg-black/90 backdrop-blur-3xl rounded-full text-[#302e30] dark:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl border border-white/50 pointer-events-auto hover:bg-white transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse"></span>
                  Editorial Cut • {mode}
                </div>
                
                {/* Interaction Dock floating cleanly on the image */}
                <div className="absolute bottom-6 right-6 flex items-center gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:translate-y-4 lg:group-hover:translate-y-0 transition-all duration-500 bg-white/90 dark:bg-black/80 backdrop-blur-2xl p-2.5 rounded-full shadow-2xl pointer-events-auto border border-white/60">
                  <a href={generatedImage} download={`woven-${Date.now()}.png`} title="Download" className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-[#a7295a] dark:text-pink-300 shadow-sm hover:scale-105 transition-all active:scale-95 group/btn border border-gray-100">
                    <span className="material-symbols-outlined text-[22px] group-hover/btn:-translate-y-1 transition-transform">download</span>
                  </a>
                  <button onClick={handleShare} title="Copy to Clipboard or Share" className="w-12 h-12 bg-[#a7295a] text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all active:scale-95 group/btn">
                    <span className="material-symbols-outlined text-[20px] group-hover/btn:-rotate-12 transition-transform">ios_share</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in z-10 pointer-events-none">
                <div className="w-28 h-28 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center mb-2 shadow-xl border border-pink-100/50 backdrop-blur-md">
                  <span className="material-symbols-outlined text-[50px] text-[#a7295a]/30 animate-pulse">style</span>
                </div>
                <h3 className="font-serif text-3xl lg:text-4xl text-[#302e30]/40 dark:text-white/40 tracking-tighter italic font-light drop-shadow-sm">Awaiting Magic</h3>
                <p className="text-[#a7295a]/50 text-xs font-bold max-w-[250px] uppercase tracking-[0.2em] leading-relaxed">
                  Provide your visual thesis to start weaving.
                </p>
              </div>
            )}
          </div>

          {/* History Gallery: Larger rectangles with elegant empty states */}
          <div className="flex items-center gap-4 h-28 lg:h-36 flex-shrink-0 overflow-x-auto no-scrollbar pt-1 pb-2">
            
            {/* Populated History Items */}
            {history.map((url, i) => (
              <div 
                key={i}
                onClick={() => setGeneratedImage(url)}
                className="w-36 lg:w-48 h-full bg-white/50 backdrop-blur-lg rounded-2xl overflow-hidden cursor-pointer hover:ring-4 ring-offset-2 ring-white hover:ring-[#a7295a]/70 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex-shrink-0 transform hover:-translate-y-1.5"
                title="Click to view full width"
              >
                <img src={url} alt={`History ${i}`} className="w-full h-full object-cover" />
              </div>
            ))}
            
            {/* Beautiful Vintage "Timer" Placeholder Slots */}
            {Array.from({ length: Math.max(0, 3 - history.length) }).map((_, i) => (
              <div 
                key={`empty-${i}`} 
                className="w-36 lg:w-48 h-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-dashed border-[#a7295a]/30 rounded-2xl flex flex-col items-center justify-center opacity-70 flex-shrink-0 shadow-inner gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#fcedf2] dark:bg-pink-900/30 flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[#a7295a]/50 text-lg">history</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#a7295a]/50">History Slot</span>
              </div>
            ))}
          </div>

        </div>

      </main>

      {/* Super Slick Mobile Nav Bar */}
      <div className="lg:hidden fixed bottom-6 left-0 w-full z-50 flex justify-center items-center pointer-events-none px-4">
        <nav className="bg-white/95 backdrop-blur-3xl dark:bg-slate-900/95 w-full max-w-sm rounded-[2rem] p-1.5 flex justify-between shadow-[0_20px_60px_rgba(167,41,90,0.25)] pointer-events-auto border border-pink-100 items-center">
          {[
            { id: 'FUSE', icon: 'auto_fix_high', label: 'Fuse' },
            { id: 'EXTEND', icon: 'aspect_ratio', label: 'Extend' },
            { id: 'REMIX', icon: 'style', label: 'Remix' },
          ].map((m) => (
            <button
              key={`mobile-${m.id}`}
              onClick={() => handleModeChange(m.id as WeaveMode)}
              className={`flex flex-col items-center justify-center py-2.5 rounded-[1.5rem] transition-all duration-300 flex-1 ${
                mode === m.id
                  ? 'bg-[#a7295a] text-white shadow-xl transform -translate-y-1 scale-105'
                  : 'text-[#302e30]/60 hover:bg-pink-50 hover:text-[#a7295a]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] mb-0.5">{m.icon}</span>
              <span className="font-sans text-[8px] uppercase tracking-widest font-black">{m.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden bg-[#fafafa] dark:bg-slate-950">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-pink-300/20 blur-[150px] rounded-full mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-orange-300/15 blur-[150px] rounded-full mix-blend-multiply animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>
    </div>
  );
};

export default App;
