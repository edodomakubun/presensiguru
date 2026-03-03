export async function onRequestPost(context) {
  const { request, env } = context;
  const formData = await request.formData();
  const guru_id = formData.get('guru_id');
  const jenis = formData.get('jenis');
  const alasan = formData.get('alasan');
  const file = formData.get('foto');
  const tanggal = formData.get('tanggal');

  let foto_key = null;
  if (file && file.size > 0) {
    foto_key = `izin/${Date.now()}-${file.name}`;
    await env.R2.put(foto_key, file);
  }

  await env.DB.prepare(
    "INSERT INTO izin (guru_id, tanggal, jenis, alasan, foto_key, status) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(guru_id, tanggal, jenis, alasan, foto_key, 'Pending').run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const guru_id = url.searchParams.get('guru_id');

  let query = "SELECT izin.*, guru.nama FROM izin JOIN guru ON izin.guru_id = guru.id";
  let params = [];

  if (guru_id) {
    query += " WHERE guru_id = ?";
    params.push(guru_id);
  }

  query += " ORDER BY id DESC";

  const data = await env.DB.prepare(query).bind(...params).all();
  return new Response(JSON.stringify(data.results), {
    headers: { "Content-Type": "application/json" },
  });
}
