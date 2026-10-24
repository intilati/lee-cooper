import { getUser } from '@netlify/identity';
import { eq, asc } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { products } from '../../db/schema.js';

export default async (req: Request) => {
  try {
    if (req.method === 'GET') return Response.json(await database().select().from(products).orderBy(asc(products.position), asc(products.id)), { headers: { 'Cache-Control': 'no-store' } });
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) return new Response('Method not allowed', { status: 405 });
    if (req.headers.get('origin') !== new URL(req.url).origin) return Response.json({error:'Request not allowed.'}, {status:403});
    const user = await getUser();
    if (!user?.roles?.includes('admin')) return Response.json({ error: 'An administrator account is required.' }, { status: 403 });
    const db = database();
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return Response.json({error:'Invalid product.'},{status:400});
    if (req.method === 'DELETE') {
      if (typeof body.id !== 'string') return Response.json({error:'Invalid product.'}, {status:400});
      const [deleted] = await db.delete(products).where(eq(products.id, body.id)).returning({id: products.id});
      return deleted ? Response.json({ok:true}) : Response.json({error:'Product not found.'},{status:404});
    }
    const validImage = (s: unknown) => typeof s === 'string' && /^\/(?:assets\/|api\/images\/)[a-zA-Z0-9/_.-]+$/.test(s);
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 150 || typeof body.color !== 'string' || !body.color.trim() || body.color.length > 80 || !/^#[a-fA-F0-9]{6}$/.test(body.swatch) || !Array.isArray(body.images) || body.images.length > 8 || !body.images.every(validImage) || (!body.images.length && !body.sprite) || (body.sprite && !['0% 0%', '50% 0%', '50% 100%'].includes(body.sprite)) || (body.price != null && (!Number.isInteger(body.price) || body.price < 0 || body.price > 100000000)) || (body.description && (typeof body.description !== 'string' || body.description.length > 5000))) return Response.json({ error: 'Check product name, color, images, and price.' }, { status: 400 });
    const value = { name: body.name.trim(), color: body.color.trim(), swatch: body.swatch, images: body.images, description: body.description || '', price: body.price ?? null, sprite: body.sprite || null, sample: !!body.sample };
    if (req.method === 'PUT') {
      if (typeof body.id !== 'string') return Response.json({error:'Invalid product.'},{status:400});
      const [updated] = await db.update(products).set(value).where(eq(products.id, body.id)).returning();
      return updated ? Response.json(updated) : Response.json({error:'Product not found.'},{status:404});
    }
    const rows = await db.select({position: products.position}).from(products);
    const [created] = await db.insert(products).values({ ...value, id: crypto.randomUUID(), position: Math.max(-1,...rows.map(x=>x.position))+1 }).returning();
    return Response.json(created, { status: 201 });
  } catch { return Response.json({ error: 'The catalog is temporarily unavailable. Please try again.' }, { status: 503 }); }
};
export const config = { path: '/api/products' };
