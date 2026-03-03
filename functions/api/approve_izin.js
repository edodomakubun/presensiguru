export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Data tidak valid" }), { status: 400 });
  }

  const { id, status } = body;

  await env.DB.prepare("UPDATE izin SET status = ? WHERE id = ?").bind(status, id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
