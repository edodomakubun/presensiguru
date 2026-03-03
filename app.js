const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    config: {},
    currentPage: 'login'
};

const app = document.getElementById('app');

// Initialization
async function init() {
    if (state.user) {
        state.currentPage = state.user.role === 'admin' ? 'admin_dashboard' : 'guru_dashboard';
    } else {
        state.currentPage = 'login';
    }
    await fetchConfig();
    render();
}

async function fetchConfig() {
    try {
        const res = await fetch('/api/pengaturan');
        state.config = await res.json();
    } catch (e) {
        console.error("Gagal mengambil konfigurasi", e);
    }
}

// Router
function navigate(page) {
    state.currentPage = page;
    render();
}

// Render Logic
function render() {
    app.innerHTML = '';

    switch (state.currentPage) {
        case 'login':
            renderLogin();
            break;
        case 'guru_dashboard':
            renderGuruDashboard();
            break;
        case 'admin_dashboard':
            renderAdminDashboard();
            break;
        case 'izin_guru':
            renderIzinGuru();
            break;
        case 'riwayat_guru':
            renderRiwayatGuru();
            break;
        case 'admin_guru':
            renderAdminGuru();
            break;
        case 'admin_jadwal':
            renderAdminJadwal();
            break;
        case 'admin_izin':
            renderAdminIzin();
            break;
        case 'admin_riwayat':
            renderAdminRiwayat();
            break;
    }
}

// Components
function renderLogin() {
    app.innerHTML = `
        <div class="flex items-center justify-center min-h-[80vh]">
            <div class="glass p-8 w-full max-w-md">
                <div class="text-center mb-8">
                    <div class="bg-white/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold">SDN Leling</h1>
                    <p class="text-white/70">Sistem Absensi Digital</p>
                </div>
                <form id="loginForm" class="space-y-4">
                    <div>
                        <label class="block text-sm mb-1">ID Pengguna</label>
                        <input type="text" id="loginId" class="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="Contoh: G001" required>
                    </div>
                    <div>
                        <label class="block text-sm mb-1">PIN</label>
                        <input type="password" id="loginPin" class="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="****" required>
                    </div>
                    <button type="submit" class="w-full bg-white text-indigo-600 font-bold py-2 rounded-lg hover:bg-opacity-90 transition">Masuk</button>
                    <div id="loginError" class="text-red-300 text-sm text-center hidden"></div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('loginForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('loginId').value;
        const pin = document.getElementById('loginPin').value;
        const btn = e.target.querySelector('button');
        const err = document.getElementById('loginError');

        btn.disabled = true;
        btn.innerText = 'Memproses...';
        err.classList.add('hidden');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                body: JSON.stringify({ id, pin })
            });
            const data = await res.json();
            if (res.ok) {
                state.user = data;
                localStorage.setItem('user', JSON.stringify(data));
                init();
            } else {
                err.innerText = data.error;
                err.classList.remove('hidden');
            }
        } catch (e) {
            err.innerText = "Koneksi gagal";
            err.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Masuk';
        }
    };
}

function renderGuruDashboard() {
    app.innerHTML = `
        <header class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-xl font-bold">Halo, ${state.user.nama}</h1>
                <p class="text-sm text-white/70">Selamat Datang di SDN Leling</p>
            </div>
            <button onclick="logout()" class="glass px-4 py-2 text-sm hover:bg-white/10">Keluar</button>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="glass p-6">
                <h2 class="text-lg font-semibold mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                    </svg>
                    Waktu Saat Ini (WIT)
                </h2>
                <div id="clock" class="text-4xl font-bold mb-2">00:00:00</div>
                <p id="date" class="text-white/70 mb-6">Memuat...</p>

                <div class="space-y-4">
                    <button onclick="handleAbsen()" id="btnAbsen" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95">
                        KLIK UNTUK ABSENSI
                    </button>
                    <p class="text-xs text-center text-white/60">Pastikan GPS aktif dan berada di area sekolah</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <button onclick="navigate('izin_guru')" class="glass p-6 flex flex-col items-center justify-center hover:bg-white/10 transition">
                    <div class="bg-blue-500/30 p-3 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span class="font-medium">Izin / Sakit</span>
                </button>
                <button onclick="navigate('riwayat_guru')" class="glass p-6 flex flex-col items-center justify-center hover:bg-white/10 transition">
                    <div class="bg-yellow-500/30 p-3 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span class="font-medium">Riwayat</span>
                </button>
            </div>
        </div>

        <div id="statusMessage" class="mt-6 hidden"></div>
    `;
    startClock();
}

function renderIzinGuru() {
    app.innerHTML = `
        <div class="mb-6 flex items-center">
            <button onclick="navigate('guru_dashboard')" class="mr-4 p-2 glass rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            <h1 class="text-xl font-bold">Pengajuan Izin</h1>
        </div>

        <div class="glass p-6 max-w-2xl mx-auto">
            <form id="izinForm" class="space-y-4">
                <div>
                    <label class="block text-sm mb-1">Tanggal</label>
                    <input type="date" id="izinTanggal" class="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-2 focus:outline-none" required>
                </div>
                <div>
                    <label class="block text-sm mb-1">Jenis Izin</label>
                    <select id="izinJenis" class="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-2 focus:outline-none" required>
                        <option value="Sakit" class="text-gray-800">Sakit</option>
                        <option value="Izin" class="text-gray-800">Izin Keperluan Lain</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm mb-1">Alasan</label>
                    <textarea id="izinAlasan" class="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-2 focus:outline-none" rows="3" placeholder="Jelaskan alasan Anda..." required></textarea>
                </div>
                <div>
                    <label class="block text-sm mb-1">Foto Surat (Dokter/Tulis Tangan)</label>
                    <input type="file" id="izinFoto" accept="image/*" class="w-full bg-white/20 border border-white/30 rounded-lg px-4 py-2 focus:outline-none" required>
                </div>
                <button type="submit" class="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition">Kirim Pengajuan</button>
            </form>
        </div>
    `;

    document.getElementById('izinForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.innerText = 'Mengirim...';

        const formData = new FormData();
        formData.append('guru_id', state.user.id);
        formData.append('tanggal', document.getElementById('izinTanggal').value);
        formData.append('jenis', document.getElementById('izinJenis').value);
        formData.append('alasan', document.getElementById('izinAlasan').value);
        formData.append('foto', document.getElementById('izinFoto').files[0]);

        try {
            const res = await fetch('/api/izin', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                alert("Pengajuan berhasil dikirim! Menunggu persetujuan Admin.");
                navigate('guru_dashboard');
            } else {
                alert("Gagal mengirim pengajuan.");
            }
        } catch (e) {
            alert("Terjadi kesalahan koneksi.");
        } finally {
            btn.disabled = false;
            btn.innerText = 'Kirim Pengajuan';
        }
    };
}

function renderRiwayatGuru() {
    app.innerHTML = `
        <div class="mb-6 flex items-center">
            <button onclick="navigate('guru_dashboard')" class="mr-4 p-2 glass rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            <h1 class="text-xl font-bold">Riwayat Absensi</h1>
        </div>
        <div class="glass overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-white/10">
                        <th class="p-4 text-sm font-semibold">Tanggal & Waktu</th>
                        <th class="p-4 text-sm font-semibold">Keterangan</th>
                        <th class="p-4 text-sm font-semibold">Status</th>
                    </tr>
                </thead>
                <tbody id="riwayatBody">
                    <tr><td colspan="3" class="p-4 text-center">Memuat riwayat...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    fetch(`/api/riwayat?guru_id=${state.user.id}`)
        .then(res => res.json())
        .then(data => {
            const body = document.getElementById('riwayatBody');
            if (data.length === 0) {
                body.innerHTML = '<tr><td colspan="3" class="p-4 text-center">Belum ada data</td></tr>';
                return;
            }
            body.innerHTML = data.map(row => `
                <tr class="border-t border-white/10">
                    <td class="p-4 text-sm">${row.timestamp}</td>
                    <td class="p-4 text-sm">${row.keterangan}</td>
                    <td class="p-4 text-sm">
                        <span class="px-2 py-1 rounded text-xs font-bold ${row.status === 'Hadir' ? 'bg-green-500' : row.status === 'Terlambat' ? 'bg-yellow-500' : 'bg-blue-500'}">
                            ${row.status}
                        </span>
                    </td>
                </tr>
            `).join('');
        });
}

// Admin Pages
function renderAdminDashboard() {
    app.innerHTML = `
        <header class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-xl font-bold">Panel Admin</h1>
                <p class="text-sm text-white/70">Manajemen Sistem Absensi SDN Leling</p>
            </div>
            <button onclick="logout()" class="glass px-4 py-2 text-sm hover:bg-white/10">Keluar</button>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button onclick="navigate('admin_guru')" class="glass p-6 text-center hover:bg-white/10 transition">
                <div class="text-3xl mb-2">👨‍🏫</div>
                <div class="font-bold">Kelola Guru</div>
            </button>
            <button onclick="navigate('admin_jadwal')" class="glass p-6 text-center hover:bg-white/10 transition">
                <div class="text-3xl mb-2">📅</div>
                <div class="font-bold">Jadwal & Libur</div>
            </button>
            <button onclick="navigate('admin_izin')" class="glass p-6 text-center hover:bg-white/10 transition">
                <div class="text-3xl mb-2">📝</div>
                <div class="font-bold">Verifikasi Izin</div>
            </button>
            <button onclick="navigate('admin_riwayat')" class="glass p-6 text-center hover:bg-white/10 transition">
                <div class="text-3xl mb-2">📊</div>
                <div class="font-bold">Laporan Absensi</div>
            </button>
        </div>

        <div class="glass p-6">
            <h2 class="text-lg font-bold mb-4">Ringkasan Hari Ini (WIT)</h2>
            <div id="adminSummary" class="text-center p-10 text-white/50">Memuat ringkasan...</div>
        </div>
    `;

    // Quick summary
    fetch('/api/riwayat')
        .then(res => res.json())
        .then(data => {
            const today = new Date().toLocaleDateString('id-ID');
            const filtered = data.filter(r => r.timestamp.includes(today));
            document.getElementById('adminSummary').innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-4 bg-white/10 rounded-lg">
                        <div class="text-2xl font-bold text-green-400">${filtered.filter(r => r.status === 'Hadir').length}</div>
                        <div class="text-sm">Hadir Tepat Waktu</div>
                    </div>
                    <div class="p-4 bg-white/10 rounded-lg">
                        <div class="text-2xl font-bold text-yellow-400">${filtered.filter(r => r.status === 'Terlambat').length}</div>
                        <div class="text-sm">Terlambat</div>
                    </div>
                </div>
            `;
        });
}

function renderAdminGuru() {
    app.innerHTML = `
        <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center">
                <button onclick="navigate('admin_dashboard')" class="mr-4 p-2 glass rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                <h1 class="text-xl font-bold">Kelola Guru</h1>
            </div>
            <button onclick="showGuruModal()" class="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm">+ Tambah Guru</button>
        </div>

        <div class="glass overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-white/10">
                    <tr>
                        <th class="p-4">ID / Username</th>
                        <th class="p-4">Nama Lengkap</th>
                        <th class="p-4">PIN</th>
                        <th class="p-4">Aksi</th>
                    </tr>
                </thead>
                <tbody id="guruTableBody"></tbody>
            </table>
        </div>

        <!-- Modal -->
        <div id="guruModal" class="fixed inset-0 bg-black/50 hidden flex items-center justify-center p-4">
            <div class="glass p-8 w-full max-w-md">
                <h3 class="text-lg font-bold mb-4" id="modalTitle">Tambah Guru</h3>
                <form id="guruForm" class="space-y-4">
                    <input type="hidden" id="oldId">
                    <div>
                        <label class="block text-sm">ID / Username</label>
                        <input type="text" id="guruId" class="w-full bg-white/20 border border-white/30 rounded px-4 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm">Nama Lengkap</label>
                        <input type="text" id="guruNama" class="w-full bg-white/20 border border-white/30 rounded px-4 py-2" required>
                    </div>
                    <div>
                        <label class="block text-sm">PIN (4-6 Digit)</label>
                        <input type="text" id="guruPin" class="w-full bg-white/20 border border-white/30 rounded px-4 py-2" required>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" onclick="closeGuruModal()" class="flex-1 glass py-2">Batal</button>
                        <button type="submit" class="flex-1 bg-white text-indigo-600 font-bold py-2 rounded">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    loadGuruData();

    document.getElementById('guruForm').onsubmit = async (e) => {
        e.preventDefault();
        const payload = {
            id: document.getElementById('guruId').value,
            nama: document.getElementById('guruNama').value,
            pin: document.getElementById('guruPin').value
        };
        await fetch('/api/guru', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        closeGuruModal();
        loadGuruData();
    };
}

async function loadGuruData() {
    const res = await fetch('/api/guru');
    const data = await res.json();
    document.getElementById('guruTableBody').innerHTML = data.map(g => `
        <tr class="border-t border-white/10">
            <td class="p-4">${g.id}</td>
            <td class="p-4">${g.nama}</td>
            <td class="p-4">****</td>
            <td class="p-4">
                <button onclick="deleteGuru('${g.id}')" class="text-red-300 hover:text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function showGuruModal() { document.getElementById('guruModal').classList.remove('hidden'); }
function closeGuruModal() { document.getElementById('guruModal').classList.add('hidden'); }

async function deleteGuru(id) {
    if (confirm('Hapus guru ini?')) {
        await fetch('/api/guru', {
            method: 'POST',
            body: JSON.stringify({ id, action: 'delete' })
        });
        loadGuruData();
    }
}

function renderAdminJadwal() {
    app.innerHTML = `
        <div class="mb-6 flex items-center">
            <button onclick="navigate('admin_dashboard')" class="mr-4 p-2 glass rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            <h1 class="text-xl font-bold">Jadwal & Lokasi</h1>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="glass p-6">
                <h3 class="font-bold mb-4">Jam Absensi</h3>
                <form id="jamForm" class="space-y-3">
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="text-xs">Masuk Mulai</label>
                            <input type="time" name="JAM_MASUK_MULAI" value="${state.config.JAM_MASUK_MULAI}" class="w-full bg-white/20 border border-white/30 rounded p-2">
                        </div>
                        <div>
                            <label class="text-xs">Masuk Selesai</label>
                            <input type="time" name="JAM_MASUK_SELESAI" value="${state.config.JAM_MASUK_SELESAI}" class="w-full bg-white/20 border border-white/30 rounded p-2">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
                        <div>
                            <label class="text-xs text-yellow-300">Terlambat Mulai</label>
                            <input type="time" name="JAM_TERLAMBAT_MULAI" value="${state.config.JAM_TERLAMBAT_MULAI}" class="w-full bg-white/20 border border-white/30 rounded p-2">
                        </div>
                        <div>
                            <label class="text-xs text-yellow-300">Terlambat Selesai</label>
                            <input type="time" name="JAM_TERLAMBAT_SELESAI" value="${state.config.JAM_TERLAMBAT_SELESAI}" class="w-full bg-white/20 border border-white/30 rounded p-2">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
                        <div>
                            <label class="text-xs text-blue-300">Pulang Mulai</label>
                            <input type="time" name="JAM_PULANG_MULAI" value="${state.config.JAM_PULANG_MULAI}" class="w-full bg-white/20 border border-white/30 rounded p-2">
                        </div>
                        <div>
                            <label class="text-xs text-blue-300">Pulang Selesai</label>
                            <input type="time" name="JAM_PULANG_SELESAI" value="${state.config.JAM_PULANG_SELESAI}" class="w-full bg-white/20 border border-white/30 rounded p-2">
                        </div>
                    </div>
                    <button type="submit" class="w-full bg-white text-indigo-600 font-bold py-2 rounded mt-2">Simpan Jam</button>
                </form>
            </div>

            <div class="glass p-6">
                <h3 class="font-bold mb-4">Lokasi Sekolah (Geofence)</h3>
                <form id="lokasiForm" class="space-y-3">
                    <div>
                        <label class="text-xs">Latitude</label>
                        <input type="text" name="LOKASI_SEKOLAH_LAT" value="${state.config.LOKASI_SEKOLAH_LAT}" class="w-full bg-white/20 border border-white/30 rounded p-2">
                    </div>
                    <div>
                        <label class="text-xs">Longitude</label>
                        <input type="text" name="LOKASI_SEKOLAH_LNG" value="${state.config.LOKASI_SEKOLAH_LNG}" class="w-full bg-white/20 border border-white/30 rounded p-2">
                    </div>
                    <div>
                        <label class="text-xs">Radius (Meter)</label>
                        <input type="number" name="RADIUS_METER" value="${state.config.RADIUS_METER}" class="w-full bg-white/20 border border-white/30 rounded p-2">
                    </div>
                    <button type="submit" class="w-full bg-white text-indigo-600 font-bold py-2 rounded">Simpan Lokasi</button>
                </form>
            </div>

            <div class="glass p-6 md:col-span-2">
                <h3 class="font-bold mb-4">Hari Libur</h3>
                <div class="flex gap-2 mb-4">
                    <input type="date" id="newLibur" class="flex-1 bg-white/20 border border-white/30 rounded p-2">
                    <button onclick="addLibur()" class="bg-white text-indigo-600 px-4 py-2 rounded font-bold">Tambah</button>
                </div>
                <div id="liburList" class="flex flex-wrap gap-2"></div>
            </div>
        </div>
    `;

    const handleSave = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        await fetch('/api/pengaturan', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        alert('Tersimpan!');
        await fetchConfig();
        renderAdminJadwal();
    };

    document.getElementById('jamForm').onsubmit = handleSave;
    document.getElementById('lokasiForm').onsubmit = handleSave;
    renderLibur();
}

function renderLibur() {
    const list = JSON.parse(state.config.HARI_LIBUR || "[]");
    document.getElementById('liburList').innerHTML = list.map(d => `
        <div class="bg-white/20 px-3 py-1 rounded-full flex items-center text-sm">
            ${d}
            <button onclick="removeLibur('${d}')" class="ml-2 text-red-300 font-bold">×</button>
        </div>
    `).join('');
}

async function addLibur() {
    const date = document.getElementById('newLibur').value;
    if (!date) return;
    const list = JSON.parse(state.config.HARI_LIBUR || "[]");
    if (!list.includes(date)) {
        list.push(date);
        await fetch('/api/pengaturan', {
            method: 'POST',
            body: JSON.stringify({ HARI_LIBUR: JSON.stringify(list) })
        });
        await fetchConfig();
        renderAdminJadwal();
    }
}

async function removeLibur(date) {
    let list = JSON.parse(state.config.HARI_LIBUR || "[]");
    list = list.filter(d => d !== date);
    await fetch('/api/pengaturan', {
        method: 'POST',
        body: JSON.stringify({ HARI_LIBUR: JSON.stringify(list) })
    });
    await fetchConfig();
    renderAdminJadwal();
}

function renderAdminIzin() {
    app.innerHTML = `
        <div class="mb-6 flex items-center">
            <button onclick="navigate('admin_dashboard')" class="mr-4 p-2 glass rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            <h1 class="text-xl font-bold">Verifikasi Izin</h1>
        </div>
        <div class="glass overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-white/10">
                    <tr>
                        <th class="p-4 text-xs md:text-sm">Guru</th>
                        <th class="p-4 text-xs md:text-sm">Tgl / Jenis</th>
                        <th class="p-4 text-xs md:text-sm">Bukti</th>
                        <th class="p-4 text-xs md:text-sm">Status</th>
                        <th class="p-4 text-xs md:text-sm">Aksi</th>
                    </tr>
                </thead>
                <tbody id="izinTableBody"></tbody>
            </table>
        </div>
    `;

    fetch('/api/izin')
        .then(res => res.json())
        .then(data => {
            document.getElementById('izinTableBody').innerHTML = data.map(i => `
                <tr class="border-t border-white/10">
                    <td class="p-4">
                        <div class="font-bold text-sm">${i.nama}</div>
                        <div class="text-xs text-white/60">${i.guru_id}</div>
                    </td>
                    <td class="p-4">
                        <div class="text-sm">${i.tanggal}</div>
                        <div class="text-xs italic">${i.jenis}</div>
                    </td>
                    <td class="p-4">
                        ${i.foto_key ? `<a href="/api/file?key=${i.foto_key}" target="_blank" class="text-blue-300 underline text-xs">Lihat Foto</a>` : '-'}
                    </td>
                    <td class="p-4">
                        <span class="text-xs px-2 py-1 rounded font-bold ${i.status === 'Pending' ? 'bg-gray-500' : i.status === 'Disetujui' ? 'bg-green-500' : 'bg-red-500'}">
                            ${i.status}
                        </span>
                    </td>
                    <td class="p-4">
                        ${i.status === 'Pending' ? `
                            <div class="flex gap-1">
                                <button onclick="approveIzin(${i.id}, 'Disetujui')" class="bg-green-500 p-1 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                                <button onclick="approveIzin(${i.id}, 'Ditolak')" class="bg-red-500 p-1 rounded">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ` : '-'}
                    </td>
                </tr>
            `).join('');
        });
}

async function approveIzin(id, status) {
    await fetch('/api/approve_izin', {
        method: 'POST',
        body: JSON.stringify({ id, status })
    });
    renderAdminIzin();
}

function renderAdminRiwayat() {
    app.innerHTML = `
        <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center">
                <button onclick="navigate('admin_dashboard')" class="mr-4 p-2 glass rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                <h1 class="text-xl font-bold">Laporan Absensi</h1>
            </div>
            <button onclick="window.print()" class="glass px-4 py-2 text-sm">Cetak PDF</button>
        </div>
        <div class="glass overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-white/10">
                    <tr>
                        <th class="p-4 text-xs">Guru</th>
                        <th class="p-4 text-xs">Waktu (WIT)</th>
                        <th class="p-4 text-xs">Keterangan</th>
                        <th class="p-4 text-xs">Lokasi</th>
                        <th class="p-4 text-xs">Status</th>
                    </tr>
                </thead>
                <tbody id="adminRiwayatBody"></tbody>
            </table>
        </div>
    `;

    fetch('/api/riwayat')
        .then(res => res.json())
        .then(data => {
            document.getElementById('adminRiwayatBody').innerHTML = data.map(r => `
                <tr class="border-t border-white/10">
                    <td class="p-4 text-xs">
                        <div class="font-bold">${r.nama}</div>
                        <div class="text-white/60">${r.guru_id}</div>
                    </td>
                    <td class="p-4 text-xs">${r.timestamp}</td>
                    <td class="p-4 text-xs">${r.keterangan}</td>
                    <td class="p-4 text-[10px] text-white/50">${r.latitude}, ${r.longitude}</td>
                    <td class="p-4 text-xs">
                         <span class="px-2 py-1 rounded font-bold ${r.status === 'Hadir' ? 'bg-green-500' : r.status === 'Terlambat' ? 'bg-yellow-500' : 'bg-blue-500'}">
                            ${r.status}
                        </span>
                    </td>
                </tr>
            `).join('');
        });
}

// Global Actions
function logout() {
    localStorage.removeItem('user');
    state.user = null;
    navigate('login');
}

function startClock() {
    const clock = document.getElementById('clock');
    const dateEl = document.getElementById('date');
    if (!clock) return;

    const update = () => {
        const now = new Date();
        const witOffset = 9 * 60;
        const wit = new Date(now.getTime() + (witOffset + now.getTimezoneOffset()) * 60000);

        clock.innerText = wit.toTimeString().split(' ')[0];
        dateEl.innerText = wit.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    setInterval(update, 1000);
    update();
}

async function handleAbsen() {
    const btn = document.getElementById('btnAbsen');
    const statusMsg = document.getElementById('statusMessage');

    btn.disabled = true;
    btn.innerText = 'Mencari Lokasi...';
    statusMsg.classList.add('hidden');

    if (!navigator.geolocation) {
        alert("Geolocation tidak didukung browser Anda");
        btn.disabled = false;
        btn.innerText = 'KLIK UNTUK ABSENSI';
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        btn.innerText = 'Mengirim Data...';

        try {
            const res = await fetch('/api/absen', {
                method: 'POST',
                body: JSON.stringify({
                    guru_id: state.user.id,
                    lat: latitude,
                    lng: longitude
                })
            });
            const data = await res.json();

            statusMsg.classList.remove('hidden');
            if (res.ok) {
                statusMsg.className = "mt-6 p-4 glass bg-green-500/30 text-center rounded-xl";
                statusMsg.innerHTML = `
                    <div class="text-xl font-bold">Berhasil!</div>
                    <div>${data.keterangan} (${data.status})</div>
                `;
            } else {
                statusMsg.className = "mt-6 p-4 glass bg-red-500/30 text-center rounded-xl";
                statusMsg.innerHTML = `
                    <div class="text-xl font-bold">Gagal</div>
                    <div>${data.error}</div>
                `;
            }
        } catch (e) {
            alert("Kesalahan koneksi ke server");
        } finally {
            btn.disabled = false;
            btn.innerText = 'KLIK UNTUK ABSENSI';
        }
    }, (err) => {
        alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
        btn.disabled = false;
        btn.innerText = 'KLIK UNTUK ABSENSI';
    }, { enableHighAccuracy: true });
}

// Start
init();
