export async function onRequestGet(context) {
  const { env } = context;
  const data = await env.DB.prepare("SELECT * FROM guru WHERE role = 'guru'").all();
  return new Response(JSON.stringify(data.results), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const { id, pin, nama, action } = await request.json();

  if (action === 'delete') {
    await env.DB.prepare("DELETE FROM guru WHERE id = ?").bind(id).run();
  } else {
    await env.DB.prepare("INSERT OR REPLACE INTO guru (id, pin, nama, role) VALUES (?, ?, ?, 'guru')")
      .bind(id, pin, nama).run();
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
