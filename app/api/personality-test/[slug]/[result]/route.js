import { ImageResponse } from 'next/og';
import { baseUrl } from '@/lib/seo';

// Share images for a test result: `?format=story` is a 1080x1920 Instagram story, anything else
// the 1200x630 link preview. Edge runtime: the Node one fails to load the bundled default font
// on Windows dev machines, and the fonts here are fetched anyway.
export const runtime = 'edge';

// Hex values of the paper/ink tokens in tokens.css (satori does not read oklch()).
const PAPER = '#f7f4ec';
const INK = '#1c2130';
const INK_2 = '#4a5160';
const RULE = '#d8d3c4';
const WHITE = '#ffffff';
const GOOGLE = ['#4285f4', '#ea4335', '#fbbc04', '#34a853'];

const COPY = {
  tr: { mine: 'Sonucum', result: 'Sonuç', cta: 'Sen de çöz' },
  en: { mine: 'My result', result: 'Result', cta: 'Take it too' },
};

const SITE = new URL(baseUrl).host;

// Google Fonts serves TrueType to clients it does not recognise; `text` keeps the file to the
// glyphs actually drawn (Turkish ones included, which the default font lacks).
async function loadFont(family, weight, text) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(text)}`
  ).then((response) => response.text());
  const match = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error(`No font file for ${family}`);
  return fetch(match[1]).then((response) => response.arrayBuffer());
}

function toDataUrl(buffer, type) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:${type};base64,${btoa(binary)}`;
}

// Satori draws PNG and JPEG only. Next's image optimizer turns WebP into JPEG for a client that
// does not accept WebP, so every result picture goes through it.
async function loadImage(origin, src, width) {
  if (!src) return null;
  const attempts = [`${origin}/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=80`, src];
  for (const url of attempts) {
    try {
      const response = await fetch(url, { headers: { Accept: 'image/jpeg,image/png;q=0.9' } });
      const type = (response.headers.get('content-type') || '').split(';')[0];
      if (response.ok && (type === 'image/jpeg' || type === 'image/png')) {
        return toDataUrl(await response.arrayBuffer(), type);
      }
    } catch {
      // Try the next source; without a picture the card is type only.
    }
  }
  return null;
}

// Ink or white, whichever reads better on the result's own colour.
function textOn(hex) {
  const value = /^#?([0-9a-f]{6})$/i.exec(hex || '')?.[1];
  if (!value) return WHITE;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = parseInt(value.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.36 ? INK : WHITE;
}

function titleSize(title, sizes) {
  const length = title.length;
  if (length <= 12) return sizes[0];
  if (length <= 22) return sizes[1];
  if (length <= 36) return sizes[2];
  return sizes[3];
}

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

function Dots({ size }) {
  return (
    <div style={{ display: 'flex', gap: size / 2 }}>
      {GOOGLE.map((color) => (
        <div key={color} style={{ width: size, height: size, borderRadius: size, background: color }} />
      ))}
    </div>
  );
}

function Traits({ traits, size }) {
  if (!traits.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: size * 0.4 }}>
      {traits.slice(0, 4).map((trait) => (
        <div
          key={trait}
          style={{
            display: 'flex',
            border: `2px solid ${RULE}`,
            borderRadius: 999,
            padding: `${size * 0.3}px ${size * 0.8}px`,
            fontSize: size,
            color: INK,
          }}
        >
          {trait}
        </div>
      ))}
    </div>
  );
}

// Bricolage at weight 800 runs about half an em a character, Plex at 42px about 40 characters a
// line: enough to guess how many lines the titles take, so the picture can fill the rest.
function storyImageHeight(test, result, titleFontSize) {
  const lines = Math.max(1, Math.ceil((Math.min(result.title.length, 60) * 0.52 * titleFontSize) / 824));
  const text = 44 + 36 + 12 + lines * titleFontSize * 0.95 + (result.traits.length ? 36 + 64 : 0);
  const testLines = Math.max(1, Math.ceil(Math.min(test.title.length, 70) / 40));
  return Math.round(Math.min(1120, Math.max(520, 1390 - (testLines - 1) * 52 - text)));
}

function Story({ test, result, image, copy }) {
  const color = result.color || GOOGLE[0];
  const onColor = textOn(color);
  const titleFontSize = titleSize(result.title, image ? [132, 108, 84, 68] : [168, 136, 108, 84]);
  const imageHeight = storyImageHeight(test, result, titleFontSize);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: color, padding: 72, fontFamily: 'Plex' }}>
      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: PAPER, color: INK, borderRadius: 999, padding: '16px 32px', fontSize: 32 }}>
          <Dots size={22} />
          <div style={{ display: 'flex' }}>GDG on Campus Trakya</div>
        </div>
      </div>
      <div style={{ display: 'flex', marginTop: 36, fontSize: 42, color: onColor, lineHeight: 1.2 }}>{clip(test.title, 70)}</div>

      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, marginTop: 40, background: PAPER, borderRadius: 48, padding: 56 }}>
        {image && (
          <img src={image} width={824} height={imageHeight} style={{ width: 824, height: imageHeight, borderRadius: 32, objectFit: 'cover', objectPosition: 'top' }} />
        )}
        <div style={{ display: 'flex', marginTop: image ? 44 : 0, fontSize: 30, letterSpacing: 4, color: INK_2, textTransform: 'uppercase' }}>
          {copy.mine}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 12,
            fontFamily: 'Display',
            fontSize: titleFontSize,
            lineHeight: 0.95,
            letterSpacing: -2,
            color: INK,
          }}
        >
          {clip(result.title, 60)}
        </div>
        {!image && result.description && (
          <div style={{ display: 'flex', marginTop: 32, fontSize: 40, lineHeight: 1.35, color: INK_2 }}>{clip(result.description, 220)}</div>
        )}
        <div style={{ display: 'flex', marginTop: 36 }}>
          <Traits traits={result.traits} size={30} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 40, color: onColor, fontSize: 36 }}>
        <div style={{ display: 'flex' }}>{copy.cta}</div>
        <div style={{ display: 'flex' }}>{SITE}</div>
      </div>
    </div>
  );
}

function Preview({ test, result, image, copy }) {
  const color = result.color || GOOGLE[0];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: PAPER, fontFamily: 'Plex', borderTop: `16px solid ${color}` }}>
      {image && <img src={image} width={614} height={614} style={{ width: 614, height: 614, objectFit: 'cover', objectPosition: 'top' }} />}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexGrow: 1, width: image ? 586 : 1200, padding: '44px 52px' }}>
        <div style={{ display: 'flex', fontSize: 28, color: INK_2, lineHeight: 1.25 }}>{clip(test.title, 70)}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 3, color: INK_2, textTransform: 'uppercase' }}>{copy.result}</div>
          <div
            style={{
              display: 'flex',
              marginTop: 8,
              fontFamily: 'Display',
              fontSize: titleSize(result.title, image ? [96, 76, 60, 48] : [120, 96, 76, 60]),
              lineHeight: 0.98,
              letterSpacing: -2,
              color: INK,
            }}
          >
            {clip(result.title, 60)}
          </div>
          <div style={{ display: 'flex', marginTop: 24 }}>
            <Traits traits={result.traits.slice(0, 3)} size={22} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 24, color: INK_2 }}>
          <Dots size={18} />
          <div style={{ display: 'flex' }}>GDG on Campus Trakya</div>
        </div>
      </div>
    </div>
  );
}

export async function GET(request, { params }) {
  const { slug, result: resultSlug } = await params;
  const url = new URL(request.url);
  const story = url.searchParams.get('format') === 'story';
  const copy = COPY[url.searchParams.get('locale')] || COPY.tr;

  const response = await fetch(`${url.origin}/api/personality-test/${encodeURIComponent(slug)}`);
  if (!response.ok) return new Response('Not found', { status: 404 });
  const test = await response.json();
  const result = test.results.find((entry) => entry.slug === resultSlug);
  if (!result) return new Response('Not found', { status: 404 });

  const drawn = [test.title, result.title, result.description, ...result.traits, ...Object.values(copy), SITE, 'GDG on Campus Trakya ·…0123456789']
    .join(' ');
  const text = `${drawn} ${drawn.toUpperCase()} ${drawn.toLocaleUpperCase('tr')}`;
  const [image, display, plex] = await Promise.all([
    loadImage(url.origin, result.imageUrl, story ? 1080 : 640),
    loadFont('Bricolage Grotesque', 800, text).catch(() => null),
    loadFont('IBM Plex Sans', 600, text).catch(() => null),
  ]);
  const fonts = [
    display && { name: 'Display', data: display, weight: 800, style: 'normal' },
    plex && { name: 'Plex', data: plex, weight: 600, style: 'normal' },
  ].filter(Boolean);

  const Card = story ? Story : Preview;
  return new ImageResponse(<Card test={test} result={result} image={image} copy={copy} />, {
    width: story ? 1080 : 1200,
    height: story ? 1920 : 630,
    fonts,
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
