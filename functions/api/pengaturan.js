export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Data tidak valid" }), { status: 400 });
  }

  for (const [key, value] of Object.entries(body)) {
    await env.DB.prepare("INSERT OR REPLACE INTO pengaturan (key, value) VALUES (?, ?)")
      .bind(key, typeof value === 'string' ? value : JSON.stringify(value)).run();
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  const data = await env.DB.prepare("SELECT * FROM pengaturan").all();
  const config = {};
  data.results.forEach(row => config[row.key] = row.value);
  return new Response(JSON.stringify(config), {
    headers: { "Content-Type": "application/json" },
  });
}
