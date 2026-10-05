import { getTestBySlug } from '@/lib/personality-test';
import { publicTest } from '@/lib/personality-result';

// A test's title and results, for the share images (which run on the edge, where the Admin SDK
// does not). Only what the images draw; tests are public anyway.
export const revalidate = 600;

export async function GET(_request, { params }) {
  const { slug } = await params;
  const test = await getTestBySlug(slug);
  if (!test) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json(publicTest({ ...test, slug }), {
    headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=86400' },
  });
}
