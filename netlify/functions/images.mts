import { getStore } from '@netlify/blobs';
import { getUser } from '@netlify/identity';
export default async (req: Request) => {
  try {
    if (req.method === 'GET') {
      const key = new URL(req.url).pathname.split('/').pop() || '';
      if (!/^[a-f0-9-]+\.(png|jpg|webp)$/.test(key)) return new Response('Not found',{status:404});
      const data = await getStore('cargo-images').get(key, {type:'arrayBuffer'});
      if (!data) return new Response('Not found',{status:404});
      const type = key.endsWith('.png') ? 'image/png' : key.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      return new Response(data, {headers:{'Content-Type':type,'Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});
    }
    if (req.method !== 'POST') return new Response('Method not allowed',{status:405});
    if (req.headers.get('origin') !== new URL(req.url).origin) return new Response('Forbidden',{status:403});
    const user = await getUser();
    if (!user?.roles?.includes('admin')) return new Response('Forbidden',{status:403});
    const form = await req.formData();
    const file = form.get('image');
    if (!(file instanceof File) || file.size > 4*1024*1024) return Response.json({error:'Choose a PNG, JPEG, or WebP image smaller than 4 MB.'},{status:400});
    const buffer = await file.arrayBuffer(), bytes = new Uint8Array(buffer);
    const ext = bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71 ? 'png' : bytes[0]===255 && bytes[1]===216 && bytes[2]===255 ? 'jpg' : new TextDecoder().decode(bytes.slice(0,4))==='RIFF' && new TextDecoder().decode(bytes.slice(8,12))==='WEBP' ? 'webp' : null;
    if (!ext) return Response.json({error:'Unsupported image format.'},{status:400});
    const key = `${crypto.randomUUID()}.${ext}`;
    await getStore('cargo-images').set(key,buffer);
    return Response.json({url:`/api/images/${key}`},{status:201});
  } catch { return Response.json({error:'Image upload failed. Please try again.'},{status:503}); }
};
export const config = { path: ['/api/images', '/api/images/*'] };
