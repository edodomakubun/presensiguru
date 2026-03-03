export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON Request" }), { status: 400 });
  }

  const { id, pin } = body;

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
    isFaceRegistered: !!user.face_descriptor,
    face_descriptor: user.face_descriptor ? JSON.parse(user.face_descriptor) : null
  }), {
    headers: { "Content-Type": "application/json" },
  });
}
