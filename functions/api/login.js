export async function onRequestPost(context) {
  const { request, env } = context;
  const { id, pin } = await request.json();

  if (!id || !pin) {
    return new Response(JSON.stringify({ error: "ID dan PIN wajib diisi" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await env.DB.prepare("SELECT * FROM guru WHERE id = ? AND pin = ?")
    .bind(id, pin)
    .first();

  if (!user) {
    return new Response(JSON.stringify({ error: "ID atau PIN salah" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    id: user.id,
    nama: user.nama,
    role: user.role,
    isFaceRegistered: !!user.face_descriptor
  }), {
    headers: { "Content-Type": "application/json" },
  });
}
