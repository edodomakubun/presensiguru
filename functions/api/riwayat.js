export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const guru_id = url.searchParams.get('guru_id');

  let query = "SELECT absensi.*, guru.nama FROM absensi JOIN guru ON absensi.guru_id = guru.id";
  let params = [];

  if (guru_id) {
    query += " WHERE guru_id = ?";
    params.push(guru_id);
  }

  query += " ORDER BY absensi.id DESC LIMIT 100";

  const data = await env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(data.results), {
    headers: { "Content-Type": "application/json" },
  });
}
