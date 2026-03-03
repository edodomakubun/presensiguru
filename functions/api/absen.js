export async function onRequestPost(context) {
  const { request, env } = context;
  const { guru_id, lat, lng, accuracy, face_descriptor } = await request.json();

  // Get User for Face Verification
  const user = await env.DB.prepare("SELECT face_descriptor FROM guru WHERE id = ?").bind(guru_id).first();
  if (!user) return new Response(JSON.stringify({ error: "Guru tidak ditemukan" }), { status: 404 });

  if (!user.face_descriptor) {
    return new Response(JSON.stringify({ error: "Wajah belum didaftarkan. Silakan hubungi admin atau daftar ulang." }), { status: 400 });
  }

  // Face Verification (Euclidean Distance)
  const storedDescriptor = JSON.parse(user.face_descriptor);
  const currentDescriptor = face_descriptor; // Expected to be array

  if (!currentDescriptor || !Array.isArray(currentDescriptor)) {
    return new Response(JSON.stringify({ error: "Data verifikasi wajah tidak valid" }), { status: 400 });
  }

  const faceDistance = Math.sqrt(
    storedDescriptor.reduce((sum, val, i) => sum + Math.pow(val - currentDescriptor[i], 2), 0)
  );

  if (faceDistance > 0.6) { // Threshold 0.6 is standard for face-api.js
    return new Response(JSON.stringify({ error: "Verifikasi wajah gagal. Wajah tidak cocok!" }), { status: 403 });
  }

  // Get Settings
  const configRaw = await env.DB.prepare("SELECT * FROM pengaturan").all();
  const config = {};
  configRaw.results.forEach(row => config[row.key] = row.value);

  // Time Validation (WIT = GMT+9)
  const now = new Date();
  const witOffset = 9 * 60;
  const witTime = new Date(now.getTime() + (witOffset + now.getTimezoneOffset()) * 60000);

  const currentTimeStr = witTime.getHours().toString().padStart(2, '0') + ":" +
                         witTime.getMinutes().toString().padStart(2, '0');

  // Day Validation
  const dayStr = witTime.toISOString().split('T')[0];
  const hariLibur = JSON.parse(config.HARI_LIBUR || "[]");
  if (hariLibur.includes(dayStr) || witTime.getDay() === 0) { // Minggu libur
    return new Response(JSON.stringify({ error: "Hari ini adalah hari libur" }), { status: 400 });
  }

  // Location Validation
  // Anti Fake GPS Validation
  if (config.ANTI_FAKE_GPS === 'ON') {
    if (accuracy && accuracy < 1) {
      return new Response(JSON.stringify({ error: "Terdeteksi Fake GPS (Akurasi Terlalu Sempurna)" }), { status: 400 });
    }
  }

  const distance = calculateDistance(lat, lng, parseFloat(config.LOKASI_SEKOLAH_LAT), parseFloat(config.LOKASI_SEKOLAH_LNG));
  if (distance > parseFloat(config.RADIUS_METER)) {
    return new Response(JSON.stringify({ error: "Anda berada di luar radius sekolah (" + Math.round(distance) + "m)" }), { status: 400 });
  }

  let status = "";
  let keterangan = "";

  if (currentTimeStr >= config.JAM_MASUK_MULAI && currentTimeStr <= config.JAM_MASUK_SELESAI) {
    status = "Hadir";
    keterangan = "Absensi Masuk";
  } else if (currentTimeStr >= config.JAM_TERLAMBAT_MULAI && currentTimeStr <= config.JAM_TERLAMBAT_SELESAI) {
    status = "Terlambat";
    keterangan = "Terlambat";
  } else if (currentTimeStr >= config.JAM_PULANG_MULAI && currentTimeStr <= config.JAM_PULANG_SELESAI) {
    status = "Pulang";
    keterangan = "Absensi Pulang";
  } else {
    return new Response(JSON.stringify({ error: "Bukan waktu absensi (Jam sekarang: " + currentTimeStr + ")" }), { status: 400 });
  }

  // Save to DB
  const isoTimestamp = witTime.toISOString();
  const timestampStr = witTime.toLocaleString('id-ID', { timeZone: 'Asia/Jayapura' });

  await env.DB.prepare(
    "INSERT INTO absensi (guru_id, timestamp, iso_timestamp, keterangan, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(guru_id, timestampStr, isoTimestamp, keterangan, lat, lng, status).run();

  return new Response(JSON.stringify({ success: true, status, keterangan }), {
    headers: { "Content-Type": "application/json" },
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}
