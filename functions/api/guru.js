export async function onRequestGet(context) {
  const { env } = context;
  const data = await env.DB.prepare("SELECT id, nama, role, (face_descriptor IS NOT NULL) as hasFace FROM guru WHERE role = 'guru'").all();
  return new Response(JSON.stringify(data.results), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { id, pin, nama, action, face_descriptor } = body;

  try {
    if (action === 'delete') {
      await env.DB.prepare("DELETE FROM guru WHERE id = ?").bind(id).run();
    } else if (action === 'register_face') {
      if (!face_descriptor || !id) return new Response(JSON.stringify({ error: "Data wajah tidak lengkap" }), { status: 400 });
      await env.DB.prepare("UPDATE guru SET face_descriptor = ? WHERE id = ?")
        .bind(face_descriptor, id).run();
    } else if (action === 'reset_face') {
      await env.DB.prepare("UPDATE guru SET face_descriptor = NULL WHERE id = ?")
        .bind(id).run();
    } else {
      // Insert or Update Guru
      await env.DB.prepare("INSERT OR IGNORE INTO guru (id, pin, nama, role) VALUES (?, ?, ?, 'guru')")
        .bind(id, pin, nama).run();
      await env.DB.prepare("UPDATE guru SET pin = ?, nama = ? WHERE id = ?")
        .bind(pin, nama, id).run();
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
