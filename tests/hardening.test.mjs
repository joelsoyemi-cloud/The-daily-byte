import assert from 'node:assert/strict';
import test from 'node:test';
import { safeRedirectPath } from '../lib/safe-redirect.ts';
import { safeHeadlineSource } from '../lib/source-url.ts';
import { escapeXml, renderRss } from '../lib/rss.ts';
import { validateMediaFile } from '../lib/media-validation.ts';
import { publicPageMetadata, DEFAULT_SOCIAL_IMAGE } from '../lib/site.ts';

test('login rejects external, executable, encoded and malformed redirects', () => {
  for(const path of ['https://evil.example','//evil.example','javascript:alert(1)','/\\\\evil.example','/%2fevil.example','/%5cevil.example','/\n/evil.example','/%zz',null]) {
    assert.equal(safeRedirectPath(path), '/dashboard', String(path));
  }
  assert.equal(safeRedirectPath('/editor/articles?page=2'), '/editor/articles?page=2');
  assert.equal(safeRedirectPath('/'), '/');
});

test('source fetches are restricted to the current trusted headline provider', () => {
  assert.equal(safeHeadlineSource('https://news.google.com/rss/articles/CBMi123?oc=5'), 'https://news.google.com/rss/articles/CBMi123?oc=5');
  for(const source of ['http://127.0.0.1','https://169.254.169.254','https://news.google.com.evil.example/rss/articles/a','https://news.google.com@evil.example/rss/articles/a','https://news.google.com:8443/rss/articles/a','https://news.google.com/url?url=http://localhost','file:///etc/passwd']) {
    assert.equal(safeHeadlineSource(source), null);
  }
});

test('RSS treats contributor fields as text and omits invalid dates', () => {
  const feed = renderRss([{slug:'odd/slug?x=1',title:'<script>& "story"',excerpt:'</description><script>alert(1)</script>',published_at:'invalid',scheduled_at:null,profiles:{display_name:'A & B'}}], 'https://example.com');
  assert.doesNotMatch(feed, /<script>|<pubDate>/);
  assert.match(feed, /&lt;script&gt;&amp;/);
  assert.match(feed, /odd%2Fslug%3Fx%3D1/);
  assert.match(feed, /<dc:creator>A &amp; B<\/dc:creator>/);
  assert.equal(escapeXml('a\u0000b'), 'ab');
});

test('media rejects active documents, empty files and oversized uploads', () => {
  for(const file of [{type:'image/svg+xml',size:10},{type:'text/html',size:10},{type:'image/jpeg',size:0},{type:'image/png',size:21*1024*1024},{type:'video/mp4',size:51*1024*1024}])assert.throws(()=>validateMediaFile(file));
  assert.doesNotThrow(()=>validateMediaFile({type:'image/jpeg',size:1024}));
  assert.doesNotThrow(()=>validateMediaFile({type:'video/mp4',size:1024}));
});

test('archive pagination has self-canonicals and coherent social fallback', () => {
  const meta=publicPageMetadata({title:'Tech',path:'/section/tech',page:2});
  assert.match(meta.alternates.canonical, /\/section\/tech\?page=2$/);
  assert.equal(meta.title, 'Tech — Page 2');
  assert.deepEqual(meta.openGraph.images,[DEFAULT_SOCIAL_IMAGE]);
  assert.deepEqual(meta.twitter.images,[DEFAULT_SOCIAL_IMAGE]);
});
