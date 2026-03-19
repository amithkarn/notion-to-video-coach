import React, { useEffect, useRef } from 'react';
import { BlockType } from '@/types/editor';
import { Heading, Type, Image, Sigma } from 'lucide-react';

interface SlashCommandMenuProps {
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

const commands: { type: BlockType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'heading', label: 'Heading', icon: <Heading className="h-4 w-4" />, description: 'Section heading' },
  { type: 'text', label: 'Text', icon: <Type className="h-4 w-4" />, description: 'Plain text block' },
  { type: 'image', label: 'Image', icon: <Image className="h-4 w-4" />, description: 'Upload or embed image' },
  { type: 'math', label: 'Math', icon: <Sigma className="h-4 w-4" />, description: 'LaTeX equation' },
];

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({ position, onSelect, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="slash-menu fixed z-50 bg-popover border border-border rounded-lg shadow-lg py-1 w-56"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Blocks
      </div>
      {commands.map((cmd) => (
        <button
          key={cmd.type}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
          onClick={() => onSelect(cmd.type)}
        >
          <span className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary text-secondary-foreground">
            {cmd.icon}
          </span>
          <div>
            <div className="font-medium">{cmd.label}</div>
            <div className="text-xs text-muted-foreground">{cmd.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
