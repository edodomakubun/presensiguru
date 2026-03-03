export async function onRequestGet(context) {
  const { env } = context;
  const data = await env.DB.prepare("SELECT * FROM pengaturan").all();
  const config = {};
  data.results.forEach(row => {
    config[row.key] = row.value;
  });
  return new Response(JSON.stringify(config), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json();

  // Update multiple settings
  const statements = Object.entries(body).map(([key, value]) => {
    return env.DB.prepare("UPDATE pengaturan SET value = ? WHERE key = ?").bind(String(value), key);
  });

  await env.DB.batch(statements);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}
