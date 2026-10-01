import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { articleSanitizeSchema } from '../lib/article-sanitize-schema.ts';
import { rehypeRestrictEmbeds } from '../lib/rehype-restrict-embeds.ts';

const render = content => renderToStaticMarkup(React.createElement(ReactMarkdown, {
  remarkPlugins: [remarkGfm], remarkRehypeOptions: { allowDangerousHtml: true },
  rehypePlugins: [rehypeRaw, [rehypeSanitize, articleSanitizeSchema], rehypeRestrictEmbeds, rehypeHighlight],
}, content));

test('adjacent forbidden embeds are all removed', () => {
  const output = render('<iframe src="https://evil.example/a"></iframe><iframe src="https://evil.example/b"></iframe><video src="https://evil.example/c"></video>');
  assert.doesNotMatch(output, /iframe|video|evil\.example/);
});

test('scripts, event handlers and unsafe URLs cannot survive Markdown', () => {
  const output = render('<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">click</a>\n\n[bad](javascript:alert%281%29)');
  assert.doesNotMatch(output, /<script|onerror=|javascript:/i);
});

test('allowed media and normal editorial markup still render', () => {
  const output = render('## Heading\n\n**Bold** and [link](https://example.com)\n\n<iframe src="https://www.youtube.com/embed/abcdefghijk"></iframe><iframe src="https://player.vimeo.com/video/123"></iframe><video controls src="https://project.supabase.co/storage/v1/object/public/media/movie.mp4"></video>');
  assert.match(output, /<h2>Heading<\/h2>/);
  assert.match(output, /<strong>Bold<\/strong>/);
  assert.match(output, /www\.youtube\.com/);
  assert.match(output, /player\.vimeo\.com/);
  assert.match(output, /<video controls=""/);
});

test('lookalike hosts and insecure embed schemes are removed', () => {
  for (const src of ['https://www.youtube.com.evil.example/embed/x', 'http://www.youtube.com/embed/x', 'https://www.youtube.com@evil.example/embed/x', 'javascript:alert(1)']) {
    assert.doesNotMatch(render(`<iframe src="${src}"></iframe>`), /<iframe/);
  }
});
