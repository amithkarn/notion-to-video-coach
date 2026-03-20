import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Slide, SpeechHighlight } from '@/types/editor';
import { SlideCanvas } from '../slides/SlideCanvas';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, X } from 'lucide-react';

interface PlaybackModeProps {
  slides: Slide[];
  onExit: () => void;
}

export const PlaybackMode: React.FC<PlaybackModeProps> = ({ slides, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [activeHighlightWord, setActiveHighlightWord] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  const currentSlide = slides[currentIndex];

  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setActiveHighlightWord(null);
  }, []);

  const speakSlide = useCallback((index: number) => {
    stopSpeech();
    const slide = slides[index];
    if (!slide || !slide.speech) {
      setTimeout(() => {
        if (index < slides.length - 1) {
          setCurrentIndex(index + 1);
        } else {
          setIsPlaying(false);
        }
      }, 2000);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(slide.speech);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utteranceRef.current = utterance;

    const highlights = slide.speechHighlights || [];

    // Track word boundaries for highlight activation
    if (highlights.length > 0) {
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          const charIndex = event.charIndex;
          const charEnd = charIndex + event.charLength;

          // Check if the spoken word region overlaps any highlight
          const activeHighlight = highlights.find(
            h => charIndex <= h.startIndex && charEnd >= h.endIndex ||
                 charIndex >= h.startIndex && charIndex < h.endIndex ||
                 charEnd > h.startIndex && charEnd <= h.endIndex
          );

          if (activeHighlight) {
            setActiveHighlightWord(activeHighlight.word);
            // Clear after a short duration
            setTimeout(() => setActiveHighlightWord(null), 800);
          }
        }
      };
    }

    // Progress bar
    const wordCount = slide.speech.split(' ').length;
    const estimatedDuration = (wordCount / 2.5) * 1000;
    const startTime = Date.now();

    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(100, (elapsed / estimatedDuration) * 100));
    }, 50);

    utterance.onend = () => {
      setProgress(100);
      setActiveHighlightWord(null);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setTimeout(() => {
        if (index < slides.length - 1) {
          setCurrentIndex(index + 1);
          setProgress(0);
        } else {
          setIsPlaying(false);
        }
      }, 500);
    };

    window.speechSynthesis.speak(utterance);
  }, [slides, stopSpeech]);

  useEffect(() => {
    if (isPlaying) {
      speakSlide(currentIndex);
    }
    return () => stopSpeech();
  }, [currentIndex, isPlaying, speakSlide, stopSpeech]);

  const handlePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    stopSpeech();
    setProgress(0);
    if (currentIndex < slides.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    stopSpeech();
    setProgress(0);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleReplay = () => {
    stopSpeech();
    setProgress(0);
    speakSlide(currentIndex);
  };

  if (!currentSlide) return null;

  return (
    <div className="fixed inset-0 z-50 bg-playback-bg flex flex-col">
      <button
        onClick={() => { stopSpeech(); onExit(); }}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 text-playback-fg transition-colors"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          <SlideCanvas slide={currentSlide} activeHighlightWord={activeHighlightWord} playbackMode />
        </div>
      </div>

      <div className="pb-8 px-8">
        <div className="max-w-5xl mx-auto mb-4">
          <div className="h-1 bg-foreground/10 rounded-full overflow-hidden">
            <div
              className="playback-progress h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-playback-fg/50">
            <span>Slide {currentIndex + 1} of {slides.length}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-3 rounded-full text-playback-fg/70 hover:text-playback-fg hover:bg-foreground/10 disabled:opacity-30 transition-colors"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={handleReplay}
            className="p-3 rounded-full text-playback-fg/70 hover:text-playback-fg hover:bg-foreground/10 transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={handlePlayPause}
            className="p-4 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </button>
          <button
            onClick={handleNext}
            disabled={currentIndex === slides.length - 1}
            className="p-3 rounded-full text-playback-fg/70 hover:text-playback-fg hover:bg-foreground/10 disabled:opacity-30 transition-colors"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
