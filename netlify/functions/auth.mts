import { getUser, login, logout, acceptInvite, recoverPassword, requestPasswordRecovery, refreshSession } from '@netlify/identity';
export default async (req: Request) => {
  const headers = {'Cache-Control':'no-store'};
  try {
    if (req.method === 'GET') {
      await refreshSession();
      const user = await getUser();
      return Response.json({admin:!!user?.roles?.includes('admin'), loggedIn:!!user}, {headers});
    }
    if (req.method !== 'POST') return new Response('Method not allowed',{status:405});
    if (req.headers.get('origin') !== new URL(req.url).origin) return new Response('Forbidden',{status:403});
    const b = await req.json();
    if (b.action === 'login') await login(b.email,b.password);
    else if (b.action === 'logout') await logout();
    else if (b.action === 'invite') await acceptInvite(b.token,b.password);
    else if (b.action === 'recover') await recoverPassword(b.token,b.password);
    else if (b.action === 'forgot') await requestPasswordRecovery(b.email);
    else return Response.json({error:'Invalid action.'},{status:400, headers});
    return Response.json({ok:true},{headers});
  } catch { return Response.json({error:'Unable to complete sign-in. Check your details or request a new invitation or reset link.'},{status:400,headers}); }
};
export const config = {path:'/api/auth'};
