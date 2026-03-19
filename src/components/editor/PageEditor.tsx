import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Block, BlockType } from '@/types/editor';
import { generateId } from '@/lib/generateId';
import { SlashCommandMenu } from './SlashCommandMenu';
import { EditorBlock } from './EditorBlock';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

interface PageEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
}

export const PageEditor: React.FC<PageEditorProps> = ({ blocks, onBlocksChange }) => {
  const [slashMenu, setSlashMenu] = useState<{ blockId: string; position: { top: number; left: number } } | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const addBlock = useCallback((afterId: string, type: BlockType) => {
    const newBlock: Block = { id: generateId(), type, content: '' };
    const idx = blocks.findIndex(b => b.id === afterId);
    const updated = [...blocks];
    updated.splice(idx + 1, 0, newBlock);
    onBlocksChange(updated);
    setSlashMenu(null);
    setTimeout(() => setFocusedBlockId(newBlock.id), 50);
  }, [blocks, onBlocksChange]);

  const updateBlock = useCallback((id: string, content: string) => {
    onBlocksChange(blocks.map(b => b.id === id ? { ...b, content } : b));
  }, [blocks, onBlocksChange]);

  const deleteBlock = useCallback((id: string) => {
    if (blocks.length <= 1) return;
    const idx = blocks.findIndex(b => b.id === id);
    const updated = blocks.filter(b => b.id !== id);
    onBlocksChange(updated);
    const focusIdx = Math.max(0, idx - 1);
    setFocusedBlockId(updated[focusIdx]?.id || null);
  }, [blocks, onBlocksChange]);

  const handleKeyDown = useCallback((blockId: string, e: KeyboardEvent<HTMLElement>) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'math') {
      e.preventDefault();
      addBlock(blockId, 'text');
    }

    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(blockId);
    }

    if (e.key === 'ArrowUp') {
      const idx = blocks.findIndex(b => b.id === blockId);
      if (idx > 0) {
        e.preventDefault();
        setFocusedBlockId(blocks[idx - 1].id);
      }
    }

    if (e.key === 'ArrowDown') {
      const idx = blocks.findIndex(b => b.id === blockId);
      if (idx < blocks.length - 1) {
        e.preventDefault();
        setFocusedBlockId(blocks[idx + 1].id);
      }
    }
  }, [blocks, addBlock, deleteBlock]);

  const handleSlashCommand = useCallback((blockId: string, rect: DOMRect) => {
    setSlashMenu({
      blockId,
      position: { top: rect.bottom + 4, left: rect.left },
    });
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = blocks.findIndex(b => b.id === active.id);
      const newIdx = blocks.findIndex(b => b.id === over.id);
      onBlocksChange(arrayMove(blocks, oldIdx, newIdx));
    }
  }, [blocks, onBlocksChange]);

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto py-12 px-4 relative">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <EditorBlock
              key={block.id}
              block={block}
              isFocused={focusedBlockId === block.id}
              onUpdate={(content) => updateBlock(block.id, content)}
              onKeyDown={(e) => handleKeyDown(block.id, e)}
              onFocus={() => setFocusedBlockId(block.id)}
              onSlashCommand={(rect) => handleSlashCommand(block.id, rect)}
              onDelete={() => deleteBlock(block.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {slashMenu && (
        <SlashCommandMenu
          position={slashMenu.position}
          onSelect={(type) => addBlock(slashMenu.blockId, type)}
          onClose={() => setSlashMenu(null)}
        />
      )}
    </div>
  );
};
