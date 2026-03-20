import React, { useState, useCallback } from 'react';
import { Slide, EditorMode } from '@/types/editor';
import { generateSlidesFromContent } from '@/lib/slideGenerator';
import { PageEditor } from '@/components/editor/PageEditor';
import { PresentationEditor } from '@/components/slides/PresentationEditor';
import { PlaybackMode } from '@/components/playback/PlaybackMode';
import { FileText, Presentation, Play, Video, Sparkles, BookOpen } from 'lucide-react';
import { newtonsLawsContent } from '@/lib/exampleContent';

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

  const handleLoadExample = useCallback(() => {
    setContent(JSON.stringify(newtonsLawsContent));
  }, []);

  const isEditorEmpty = !content || content === '' || content === '{"type":"doc","content":[{"type":"paragraph"}]}';

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

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {hasGenerated && mode === 'slides' && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Regenerate
            </button>
          )}
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
          <div className="max-w-4xl mx-auto py-8 relative">
            {/* Example bubble - shown when editor is empty */}
            {isEditorEmpty && (
              <div className="flex justify-center mb-6">
                <button
                  onClick={handleLoadExample}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card text-sm font-medium text-foreground shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-accent transition-all duration-200"
                >
                  <BookOpen className="h-4 w-4 text-primary" />
                  Newton's III Laws of Motion
                </button>
              </div>
            )}
            <PageEditor value={content} onChange={setContent} />
          </div>
        ) : (
          <PresentationEditor slides={slides} onSlidesChange={setSlides} pageContent={content} />
        )}
      </main>
    </div>
  );
};

export default Index;
