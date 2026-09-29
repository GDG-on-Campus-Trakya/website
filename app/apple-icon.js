import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const svg = await fetch(new URL('../public/logo.svg', import.meta.url)).then(
    (response) => response.text()
  );
  const src = `data:image/svg+xml;base64,${btoa(svg)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7f4ec'
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={132} height={132} alt="" />
      </div>
    ),
    size
  );
}
