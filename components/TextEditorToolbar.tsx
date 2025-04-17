'use client';

import React, { FC } from 'react';
import type { EditorView } from 'prosemirror-view';
import { toggleMark, wrapIn, setBlockType, lift } from 'prosemirror-commands';
import {
  wrapInList,
  liftListItem,
  sinkListItem,
} from 'prosemirror-schema-list';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  ListOrdered,
  List,
  Quote,
  Link2,
  Unlink,
} from 'lucide-react';
import {
  documentSchema,
  orderedListNode,
  bulletListNode,
  blockquoteNode,
  paragraphNode,
} from '@/lib/editor/config';

interface TextEditorToolbarProps {
  editorView: EditorView | null;
  isDisabled: boolean;
}

export const TextEditorToolbar: FC<TextEditorToolbarProps> = ({
  editorView,
  isDisabled,
}) => {
  function runCommand(
    command: (
      state: import('prosemirror-state').EditorState,
      dispatch?: (tr: import('prosemirror-state').Transaction) => void,
      view?: EditorView,
    ) => boolean,
  ) {
    if (!editorView) return;
    command(editorView.state, editorView.dispatch, editorView);
    editorView.focus();
  }

  return (
    <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-border/50 bg-muted/80 backdrop-blur px-2 py-1 rounded-md shadow-md mb-2">
      <Button
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        aria-label="Bold"
        onClick={() => runCommand(toggleMark(documentSchema.marks.strong))}
        className="size-7 p-1"
      >
        <Bold className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        aria-label="Italic"
        onClick={() => runCommand(toggleMark(documentSchema.marks.em))}
        className="size-7 p-1"
      >
        <Italic className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        aria-label="Strikethrough"
        onClick={() =>
          runCommand(toggleMark(documentSchema.marks.strikethrough))
        }
        className="size-7 p-1"
      >
        <Strikethrough className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        aria-label="Code"
        onClick={() => runCommand(toggleMark(documentSchema.marks.code))}
        className="size-7 p-1"
      >
        <Code className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        aria-label="Ordered List"
        onClick={() => runCommand(toggleOrderedList)}
        className="size-7 p-1"
      >
        <ListOrdered className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        aria-label="Bullet List"
        onClick={() => runCommand(toggleBulletList)}
        className="size-7 p-1"
      >
        <List className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        aria-label="Blockquote"
        onClick={() => runCommand(toggleBlockquote)}
        className="size-7 p-1"
      >
        <Quote className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        disabled={isDisabled}
        aria-label="Link"
        onClick={() => console.log('Link clicked')}
        className="size-7 p-1"
      >
        <Link2 className="size-4" />
      </Button>
    </div>
  );
};

function toggleBlockquote(
  state: import('prosemirror-state').EditorState,
  dispatch?: (tr: import('prosemirror-state').Transaction) => void,
  view?: EditorView,
) {
  const { $from, $to } = state.selection;
  const range = $from.blockRange($to);
  if (!range) return false;
  const parent = range.parent;
  if (parent.type === blockquoteNode) {
    return lift(state, dispatch);
  }
  return wrapIn(blockquoteNode)(state, dispatch);
}

function toggleOrderedList(
  state: import('prosemirror-state').EditorState,
  dispatch?: (tr: import('prosemirror-state').Transaction) => void,
  view?: EditorView,
) {
  const { $from, $to } = state.selection;
  const range = $from.blockRange($to);
  if (!range) return false;
  const parent = range.parent;
  if (
    parent.type === orderedListNode ||
    (range.depth >= 2 &&
      range.$from.node(range.depth - 1).type === orderedListNode)
  ) {
    return (
      liftListItem(documentSchema.nodes.list_item)(state, dispatch) ||
      setBlockType(paragraphNode)(state, dispatch)
    );
  }
  return wrapInList(orderedListNode)(state, dispatch);
}

function toggleBulletList(
  state: import('prosemirror-state').EditorState,
  dispatch?: (tr: import('prosemirror-state').Transaction) => void,
  view?: EditorView,
) {
  const { $from, $to } = state.selection;
  const range = $from.blockRange($to);
  if (!range) return false;
  const parent = range.parent;
  if (
    parent.type === bulletListNode ||
    (range.depth >= 2 &&
      range.$from.node(range.depth - 1).type === bulletListNode)
  ) {
    return (
      liftListItem(documentSchema.nodes.list_item)(state, dispatch) ||
      setBlockType(paragraphNode)(state, dispatch)
    );
  }
  return wrapInList(bulletListNode)(state, dispatch);
}
