import { describe, expect, it } from 'vitest';

const { StyleParser } = await import('../src/scroll-timeline-css-parser.js');
const {
  ScrollTimeline,
  ViewTimeline,
} = await import('../src/scroll-timeline-base.js');
const { parseAnimationRange } = await import('../src/proxy-animation.js');

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

  it('parses current-spec animation-range shorthands for scroll and view timelines', () => {
    const scrollTimeline = Object.create(ScrollTimeline.prototype);
    const viewTimeline = Object.create(ViewTimeline.prototype);

    expect(parseAnimationRange(scrollTimeline, '10%')).toMatchObject({
      start: { value: 10, unit: 'percent' },
      end: { value: 100, unit: 'percent' },
    });

    expect(parseAnimationRange(viewTimeline, 'entry')).toMatchObject({
      start: { rangeName: 'entry', offset: { value: 0, unit: 'percent' } },
      end: { rangeName: 'entry', offset: { value: 100, unit: 'percent' } },
    });

    expect(parseAnimationRange(viewTimeline, 'entry 10% 90%')).toMatchObject({
      start: { rangeName: 'entry', offset: { value: 10, unit: 'percent' } },
      end: { rangeName: 'cover', offset: { value: 90, unit: 'percent' } },
    });

    expect(parseAnimationRange(viewTimeline, '10% exit 90%')).toMatchObject({
      start: { rangeName: 'cover', offset: { value: 10, unit: 'percent' } },
      end: { rangeName: 'exit', offset: { value: 90, unit: 'percent' } },
    });
  });

  it('treats zero-scroll-distance timelines as inactive', () => {
    class FakeResizeObserver {
      observe() {}
      disconnect() {}
    }
    class FakeMutationObserver {
      observe() {}
      disconnect() {}
    }

    globalThis.ResizeObserver = FakeResizeObserver;
    globalThis.MutationObserver = FakeMutationObserver;
    globalThis.document = {
      addEventListener() {},
      removeEventListener() {},
      scrollingElement: null,
    };
    globalThis.getComputedStyle = (element) => ({
      display: 'block',
      overflow: 'auto',
      overflowX: 'auto',
      overflowY: 'auto',
      writingMode: 'horizontal-tb',
      direction: 'ltr',
      scrollPaddingTop: '0px',
      scrollPaddingBottom: '0px',
      scrollPaddingLeft: '0px',
      scrollPaddingRight: '0px',
      position: element.position ?? 'static',
      transform: 'none',
      perspective: 'none',
      willChange: 'auto',
      filter: 'none',
      backdropFilter: 'none',
    });

    const source = {
      isConnected: true,
      scrollTop: 0,
      scrollLeft: 0,
      scrollWidth: 100,
      scrollHeight: 100,
      clientWidth: 100,
      clientHeight: 100,
      offsetLeft: 0,
      offsetTop: 0,
      clientLeft: 0,
      clientTop: 0,
      children: [],
      addEventListener() {},
      removeEventListener() {},
    };
    document.scrollingElement = source;

    const subject = {
      isConnected: true,
      parentElement: source,
      offsetParent: source,
      offsetLeft: 0,
      offsetTop: 0,
      offsetWidth: 20,
      offsetHeight: 20,
    };

    const scrollTimeline = new ScrollTimeline({ source });
    const viewTimeline = new ViewTimeline({ subject });

    expect(scrollTimeline.phase).toBe('inactive');
    expect(scrollTimeline.currentTime).toBeNull();
    expect(viewTimeline.phase).toBe('inactive');
    expect(viewTimeline.currentTime).toBeNull();
    expect(viewTimeline.startOffset).toBeNull();
    expect(viewTimeline.endOffset).toBeNull();
  });
});
