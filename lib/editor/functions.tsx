'use client';

import { defaultMarkdownSerializer } from 'prosemirror-markdown';
import { DOMParser, type Node } from 'prosemirror-model';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { renderToString } from 'react-dom/server';

import { Markdown } from '@/components/markdown';

import { documentSchema } from './config';
import { createSuggestionWidget, type UISuggestion } from './suggestions';

export const buildDocumentFromContent = (content: string) => {
  const parser = DOMParser.fromSchema(documentSchema);
  // Sanitize the content to ensure it's valid markdown
  const sanitizedContent = content.replace(/[^\x20-\x7E\s]/g, '');
  const stringFromMarkdown = renderToString(
    <Markdown>{sanitizedContent}</Markdown>,
  );
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = stringFromMarkdown;

  try {
    return parser.parse(tempContainer);
  } catch (error) {
    console.error('Error parsing document:', error);
    // Return an empty document as fallback
    return documentSchema.node('doc', null, [
      documentSchema.node('paragraph', null, [documentSchema.text(content)]),
    ]);
  }
};

export const buildContentFromDocument = (document: Node) => {
  return defaultMarkdownSerializer.serialize(document);
};

export const createDecorations = (
  suggestions: Array<UISuggestion>,
  view: EditorView,
) => {
  const decorations: Array<Decoration> = [];

  for (const suggestion of suggestions) {
    decorations.push(
      Decoration.inline(
        suggestion.selectionStart,
        suggestion.selectionEnd,
        {
          class: 'suggestion-highlight',
        },
        {
          suggestionId: suggestion.id,
          type: 'highlight',
        },
      ),
    );

    decorations.push(
      Decoration.widget(
        suggestion.selectionStart,
        (view) => {
          const { dom } = createSuggestionWidget(suggestion, view);
          return dom;
        },
        {
          suggestionId: suggestion.id,
          type: 'widget',
        },
      ),
    );
  }

  return DecorationSet.create(view.state.doc, decorations);
};
