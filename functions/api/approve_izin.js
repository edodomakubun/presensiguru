export async function onRequestPost(context) {
  const { request, env } = context;
  const { id, status } = await request.json();

  await env.DB.prepare("UPDATE izin SET status = ? WHERE id = ?")
    .bind(status, id)
    .run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
