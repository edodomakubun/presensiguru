-- Tabel Guru
CREATE TABLE IF NOT EXISTS guru (
    id TEXT PRIMARY KEY,
    pin TEXT NOT NULL,
    nama TEXT NOT NULL,
    role TEXT DEFAULT 'guru' -- 'admin' atau 'guru'
);

-- Tabel Absensi
CREATE TABLE IF NOT EXISTS absensi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guru_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    iso_timestamp TEXT NOT NULL,
    keterangan TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    status TEXT NOT NULL, -- 'Hadir', 'Terlambat', 'Pulang'
    FOREIGN KEY (guru_id) REFERENCES guru(id)
);

-- Tabel Izin
CREATE TABLE IF NOT EXISTS izin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guru_id TEXT NOT NULL,
    tanggal TEXT NOT NULL,
    jenis TEXT NOT NULL, -- 'Sakit', 'Izin'
    alasan TEXT,
    foto_key TEXT, -- Nama file di R2
    status TEXT DEFAULT 'Pending', -- 'Pending', 'Disetujui', 'Ditolak'
    FOREIGN KEY (guru_id) REFERENCES guru(id)
);

-- Tabel Pengaturan
CREATE TABLE IF NOT EXISTS pengaturan (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Data Awal Pengaturan
INSERT OR IGNORE INTO pengaturan (key, value) VALUES
('LOKASI_SEKOLAH_LAT', '-7.14872'),
('LOKASI_SEKOLAH_LNG', '131.70819'),
('RADIUS_METER', '20'),
('JAM_MASUK_MULAI', '06:00'),
('JAM_MASUK_SELESAI', '07:59'),
('JAM_TERLAMBAT_MULAI', '08:00'),
('JAM_TERLAMBAT_SELESAI', '08:49'), -- Sesuai instruksi: 08:50 sudah ditolak
('JAM_PULANG_MULAI', '11:00'),
('JAM_PULANG_SELESAI', '14:50'),
('HARI_LIBUR', '[]'); -- JSON Array [ "2024-08-17", "2024-12-25" ]

-- Data Awal Guru
INSERT OR IGNORE INTO guru (id, pin, nama, role) VALUES
('sdinleling@admin', 'Admin123', 'Administrator', 'admin'),
('G001', '4821', 'Miryam Yuliana Lololuan.S.PdK'),
('G002', '1234', 'Wanti Slarmanat.S.Pd'),
('G003', '5678', 'Adelheid Renjaan.S.Pd');
