import { describe, expect, it } from 'vitest';

globalThis.window = globalThis;

const { StyleParser } = await import('../src/scroll-timeline-css-parser.js');

describe('StyleParser', () => {
  it('resolves relative and root-relative url() references', () => {
    const parser = new StyleParser();
    const css = [
      '.hero { background-image: url("./images/bg.png"); }',
      '.icon { background-image: url("/icons/icon.svg"); }',
      '.inline { background-image: url(data:image/svg+xml;base64,abc); }',
    ].join('\n');

    expect(parser.replaceUrlFunctions(css, 'https://example.com/assets/styles/site.css')).toBe([
      '.hero { background-image: url("https://example.com/assets/styles/images/bg.png"); }',
      '.icon { background-image: url("https://example.com/icons/icon.svg"); }',
      '.inline { background-image: url(data:image/svg+xml;base64,abc); }',
    ].join('\n'));
  });

  it('extracts anonymous scroll and view timeline names', () => {
    const parser = new StyleParser();

    expect(
      parser.extractScrollTimelineNames(
        'animation-timeline: scroll(root block), named-timeline, view(inline 10% 90%);',
      ),
    ).toEqual([':t0', 'named-timeline', ':t1']);

    expect(parser.anonymousScrollTimelineOptions.get(':t0')).toEqual({
      axis: 'block',
      source: 'root',
    });
    expect(parser.anonymousViewTimelineOptions.get(':t1')).toEqual({
      axis: 'inline',
      inset: '10% 90%',
    });
  });

  it('returns null for invalid anonymous scroll timelines', () => {
    const parser = new StyleParser();

    expect(parser.parseAnonymousScrollTimeline('named-timeline')).toBeNull();
  });
});
