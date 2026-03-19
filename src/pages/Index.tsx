import React, { useState, useCallback } from 'react';
import { Slide, EditorMode } from '@/types/editor';
import { generateSlidesFromContent } from '@/lib/slideGenerator';
import { PageEditor } from '@/components/editor/PageEditor';
import { PresentationEditor } from '@/components/slides/PresentationEditor';
import { PlaybackMode } from '@/components/playback/PlaybackMode';
import { FileText, Presentation, Play, Video, Sparkles } from 'lucide-react';

const Index: React.FC = () => {
  const [mode, setMode] = useState<EditorMode>('page');
  const [content, setContent] = useState<string>('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = useCallback(() => {
    const generated = generateSlidesFromContent(content);
    setSlides(generated);
    setHasGenerated(true);
    setMode('slides');
  }, [content]);

  const handlePlay = useCallback(() => {
    if (slides.length > 0) {
      setMode('playback');
    }
  }, [slides]);

  if (mode === 'playback') {
    return <PlaybackMode slides={slides} onExit={() => setMode('slides')} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border bg-editor-toolbar shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">SlideForge</span>
          </div>

          {/* Mode tabs */}
          <div className="flex ml-6 bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setMode('page')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'page'
                  ? 'bg-surface-elevated shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-4 w-4" />
              Page
            </button>
            <button
              onClick={() => setMode('slides')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                mode === 'slides'
                  ? 'bg-surface-elevated shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Presentation className="h-4 w-4" />
              Slides
            </button>
          </div>
        </div>

        {/* Generate / Play button */}
        <div>
          {!hasGenerated ? (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Generate Video
            </button>
          ) : (
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground text-sm font-medium hover:bg-success/90 transition-colors"
            >
              <Play className="h-4 w-4" />
              Play
            </button>
          )}
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-auto">
        {mode === 'page' ? (
          <div className="max-w-4xl mx-auto py-8">
            <PageEditor value={content} onChange={setContent} />
          </div>
        ) : (
          <PresentationEditor slides={slides} onSlidesChange={setSlides} />
        )}
      </main>
    </div>
  );
};

export default Index;
