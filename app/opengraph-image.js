import { ImageResponse } from 'next/og';

// Edge runtime: the Node one fails to load the bundled default font on Windows dev machines
export const runtime = 'edge';
export const alt = 'GDG on Campus Trakya Üniversitesi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Hex values of the paper/ink tokens in tokens.css (satori does not read oklch()).
const PAPER = '#f7f4ec';
const INK = '#1c2130';
const INK_2 = '#4a5160';
const RULE = '#d8d3c4';
const GOOGLE = ['#4285f4', '#ea4335', '#fbbc04', '#34a853'];

// Only characters from the default (Noto Sans Latin) font are used: Ü is covered, and no
// ğ ş ı İ appear in this text. Add a font here before putting those in the image.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: PAPER,
          color: INK,
          padding: '64px 80px',
          fontFamily: 'sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            borderTop: `6px solid ${INK}`,
            paddingTop: 28
          }}
        >
          {GOOGLE.map((color) => (
            <div
              key={color}
              style={{
                width: 28,
                height: 28,
                borderRadius: 28,
                background: color
              }}
            />
          ))}
          <div style={{ fontSize: 30, color: INK_2, marginLeft: 12 }}>
            Google Developer Groups
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 116,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -3
            }}
          >
            GDG on Campus
          </div>
          <div
            style={{
              fontSize: 116,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: -3
            }}
          >
            Trakya Üniversitesi
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: `2px solid ${RULE}`,
            paddingTop: 24,
            fontSize: 30,
            color: INK_2
          }}
        >
          <div>Etkinlikler · Workshoplar · Hackathonlar</div>
          <div>gdgoncampustu.com</div>
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}
