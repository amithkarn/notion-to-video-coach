import React from 'react';
import { ArrowUp, ArrowDown, FilePlus } from 'lucide-react';

interface BlockToolbarProps {
  canMoveToPrev: boolean;
  canMoveToNext: boolean;
  canMoveToNew: boolean;
  onMoveToPrev: () => void;
  onMoveToNext: () => void;
  onMoveToNew: () => void;
  selectedCount: number;
}

export const BlockToolbar: React.FC<BlockToolbarProps> = ({
  canMoveToPrev,
  canMoveToNext,
  canMoveToNew,
  onMoveToPrev,
  onMoveToNext,
  onMoveToNew,
  selectedCount,
}) => {
  const hasAnyAction = canMoveToPrev || canMoveToNext || canMoveToNew;
  if (!hasAnyAction) return null;

  return (
    <div className="flex items-center gap-1 bg-popover border border-border rounded-lg shadow-md px-1.5 py-1">
      <span className="text-xs text-muted-foreground px-1.5">
        {selectedCount} block{selectedCount > 1 ? 's' : ''}
      </span>
      {canMoveToPrev && (
        <button
          onClick={onMoveToPrev}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-accent transition-colors text-foreground"
          title="Move to previous slide"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          Prev slide
        </button>
      )}
      {canMoveToNext && (
        <button
          onClick={onMoveToNext}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-accent transition-colors text-foreground"
          title="Move to next slide"
        >
          <ArrowDown className="h-3.5 w-3.5" />
          Next slide
        </button>
      )}
      {canMoveToNew && (
        <button
          onClick={onMoveToNew}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium hover:bg-accent transition-colors text-foreground"
          title="Move to new slide"
        >
          <FilePlus className="h-3.5 w-3.5" />
          New slide
        </button>
      )}
    </div>
  );
};
