import React, { useState, useMemo } from 'react';
import { Slide } from '@/types/editor';
import { SlideCanvas } from './SlideCanvas';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { tiptapToBlocks } from '@/lib/slideGenerator';
import katex from 'katex';

interface PresentationEditorProps {
  slides: Slide[];
  onSlidesChange: (slides: Slide[]) => void;
  pageContent?: string;
}

export const PresentationEditor: React.FC<PresentationEditorProps> = ({ slides, onSlidesChange, pageContent }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sidebarView, setSidebarView] = useState<'slides' | 'page'>('slides');

  const pageBlocks = useMemo(() => {
    if (!pageContent) return [];
    try {
      const doc = JSON.parse(pageContent);
      return tiptapToBlocks(doc);
    } catch {
      return [];
    }
  }, [pageContent]);

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No slides yet. Write content in Page mode, then click "Generate Video".
      </div>
    );
  }

  const currentSlide = slides[currentIndex];
  const highlightedIndices = new Set(currentSlide.sourceNodeIndices || []);

  const updateSpeech = (speech: string) => {
    const updated = slides.map((s, i) => (i === currentIndex ? { ...s, speech } : s));
    onSlidesChange(updated);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - full height */}
      <div className="w-64 border-r border-border flex flex-col bg-surface-sunken shrink-0">
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {sidebarView === 'slides' ? (
              slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-full p-2 rounded-lg text-left text-xs transition-colors ${
                    i === currentIndex
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-surface-elevated border border-transparent hover:border-border'
                  }`}
                >
                  <div className="text-muted-foreground mb-1">Slide {i + 1}</div>
                  <div className="truncate text-foreground">
                    {slide.blocks[0]?.content || 'Empty slide'}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-xs space-y-1 p-1">
                {pageBlocks.map((block, i) => {
                  const isHighlighted = highlightedIndices.has(i);
                  const baseClass = `rounded px-2 py-1.5 transition-colors ${
                    isHighlighted
                      ? 'bg-primary/15 border-l-2 border-primary'
                      : 'opacity-50'
                  }`;

                  if (block.type === 'heading') {
                    return (
                      <div key={i} className={baseClass}>
                        <p className="font-bold text-foreground text-sm">{block.content}</p>
                      </div>
                    );
                  }
                  if (block.type === 'text') {
                    return (
                      <div key={i} className={baseClass}>
                        <p className="text-foreground/80 leading-snug">{block.content}</p>
                      </div>
                    );
                  }
                  if (block.type === 'math') {
                    try {
                      return (
                        <div
                          key={i}
                          className={baseClass}
                          dangerouslySetInnerHTML={{
                            __html: katex.renderToString(block.content || '', {
                              displayMode: true,
                              throwOnError: false,
                            }),
                          }}
                        />
                      );
                    } catch {
                      return null;
                    }
                  }
                  if (block.type === 'image' && block.content) {
                    return (
                      <div key={i} className={baseClass}>
                        <img src={block.content} alt="" className="max-h-16 rounded object-contain" />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>

          {/* Toggle at bottom */}
          <div className="border-t border-border p-2">
            <div className="flex bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => setSidebarView('slides')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  sidebarView === 'slides'
                    ? 'bg-surface-elevated shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Slides
              </button>
              <button
                onClick={() => setSidebarView('page')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  sidebarView === 'page'
                    ? 'bg-surface-elevated shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Page
              </button>
            </div>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Main canvas */}
          <div className="flex-1 flex items-center justify-center bg-secondary/30 p-8">
            <div className="w-full max-w-3xl">
              <SlideCanvas slide={currentSlide} />
            </div>
          </div>

          {/* Speech editor */}
          <div className="border-t border-border p-4 bg-speech-bg">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Speech — Slide {currentIndex + 1}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex(Math.min(slides.length - 1, currentIndex + 1))}
                    disabled={currentIndex === slides.length - 1}
                    className="p-1 rounded hover:bg-accent disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <textarea
                value={currentSlide.speech}
                onChange={(e) => updateSpeech(e.target.value)}
                rows={3}
                className="w-full bg-surface-elevated border border-speech-border rounded-lg p-3 text-sm resize-none outline-none focus:ring-2 focus:ring-ring/20"
                placeholder="Speech narration for this slide..."
              />
            </div>
          </div>
        </div>
      </div>
  );
};
