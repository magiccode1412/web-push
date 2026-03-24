// VAPID 公钥接口
export async function onRequest(context) {
  const publicKey = context.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return new Response(JSON.stringify({ success: false, message: 'VAPID 公钥未配置' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ publicKey }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
