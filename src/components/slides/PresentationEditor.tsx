import React, { useState } from 'react';
import { Slide } from '@/types/editor';
import { SlideCanvas } from './SlideCanvas';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PresentationEditorProps {
  slides: Slide[];
  onSlidesChange: (slides: Slide[]) => void;
}

export const PresentationEditor: React.FC<PresentationEditorProps> = ({ slides, onSlidesChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (slides.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No slides yet. Write content in Page mode, then click "Generate Video".
      </div>
    );
  }

  const currentSlide = slides[currentIndex];

  const updateSpeech = (speech: string) => {
    const updated = slides.map((s, i) => (i === currentIndex ? { ...s, speech } : s));
    onSlidesChange(updated);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Slide thumbnails + canvas */}
      <div className="flex flex-1 min-h-0">
        {/* Thumbnail sidebar */}
        <div className="w-48 border-r border-border overflow-y-auto bg-surface-sunken p-2 space-y-2">
          {slides.map((slide, i) => (
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
          ))}
        </div>

        {/* Main canvas */}
        <div className="flex-1 flex items-center justify-center bg-secondary/30 p-8">
          <div className="w-full max-w-4xl">
            <SlideCanvas slide={currentSlide} />
          </div>
        </div>
      </div>

      {/* Speech editor */}
      <div className="border-t border-border p-4 bg-speech-bg">
        <div className="max-w-4xl mx-auto">
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
  );
};
