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
        case 'login': renderLogin(); break;
        case 'guru_dashboard': renderGuruDashboard(); break;
        case 'admin_dashboard': renderAdminDashboard(); break;
        case 'izin_guru': renderIzinGuru(); break;
        case 'riwayat_guru': renderRiwayatGuru(); break;
        case 'admin_guru': renderAdminGuru(); break;
        case 'admin_jadwal': renderAdminJadwal(); break;
        case 'admin_izin': renderAdminIzin(); break;
        case 'admin_riwayat': renderAdminRiwayat(); break;
    }
}

// UI Components
function renderLogin() {
    app.innerHTML = `
        <div class="flex items-center justify-center min-h-[80vh]">
            <div class="glass p-10 w-full max-w-md">
                <div class="text-center mb-10">
                    <div class="bg-indigo-500/10 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h1 class="text-3xl font-extrabold tracking-tight mb-2">SDN Leling</h1>
                    <p class="text-slate-400 text-sm font-medium">Digital Attendance Portal</p>
                </div>
                <form id="loginForm" class="space-y-6">
                    <div class="space-y-1.5">
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">ID PENGGUNA</label>
                        <input type="text" id="loginId" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 transition-all text-sm" placeholder="ID Anda" required>
                    </div>
                    <div class="space-y-1.5">
                        <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">PIN KEAMANAN</label>
                        <input type="password" id="loginPin" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 transition-all text-sm" placeholder="••••" required>
                    </div>
                    <button type="submit" class="w-full btn-rich text-white font-bold py-4 rounded-2xl transition shadow-lg mt-2">MASUK SISTEM</button>
                    <div id="loginError" class="text-red-400 text-xs font-medium text-center hidden"></div>
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
        btn.innerText = 'MEMVERIFIKASI...';
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
            err.innerText = "Gangguan Koneksi";
            err.classList.remove('hidden');
        } finally {
            btn.disabled = false;
            btn.innerText = 'MASUK SISTEM';
        }
    };
}

function renderGuruDashboard() {
    app.innerHTML = `
        <header class="flex justify-between items-end mb-12 px-2">
            <div>
                <p class="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">DASHBOARD GURU</p>
                <h1 class="text-2xl font-bold">${state.user.nama}</h1>
            </div>
            <button onclick="logout()" class="text-slate-400 text-xs font-bold hover:text-white transition uppercase tracking-widest bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">LOGOUT</button>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <!-- Clock Card -->
            <div class="glass p-8 md:col-span-2 relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                </div>
                <div class="relative z-10">
                    <p id="date" class="text-indigo-300 font-semibold mb-2 uppercase tracking-widest text-xs">Memuat...</p>
                    <div id="clock" class="text-6xl font-black mb-8 tracking-tighter">00:00:00</div>

                    <button onclick="handleAbsen()" id="btnAbsen" class="w-full btn-rich text-white font-extrabold py-5 rounded-2xl shadow-xl transition-all active:scale-[0.98] text-lg tracking-wide uppercase">
                        Konfirmasi Kehadiran
                    </button>
                    <p class="text-[10px] text-center text-slate-500 mt-4 uppercase font-bold tracking-widest">Sistem Geofencing Aktif - Radius 20m</p>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="flex flex-col gap-6">
                <button onclick="navigate('izin_guru')" class="glass p-8 flex flex-col items-start justify-center hover:bg-white/5 transition group">
                    <div class="bg-indigo-500/10 p-3 rounded-2xl mb-4 group-hover:bg-indigo-500/20 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <span class="font-bold text-sm mb-1">Izin / Sakit</span>
                    <span class="text-xs text-slate-400">Ajukan surat izin</span>
                </button>
                <button onclick="navigate('riwayat_guru')" class="glass p-8 flex flex-col items-start justify-center hover:bg-white/5 transition group">
                    <div class="bg-indigo-500/10 p-3 rounded-2xl mb-4 group-hover:bg-indigo-500/20 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span class="font-bold text-sm mb-1">Riwayat</span>
                    <span class="text-xs text-slate-400">Log kehadiran Anda</span>
                </button>
            </div>
        </div>

        <div id="statusMessage" class="mt-6 hidden animate-bounce"></div>
    `;
    startClock();
}

function renderIzinGuru() {
    app.innerHTML = `
        <div class="mb-10 flex items-center">
            <button onclick="navigate('guru_dashboard')" class="mr-6 p-3 glass rounded-2xl hover:bg-white/5 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            <h1 class="text-3xl font-bold tracking-tight">Pengajuan Izin</h1>
        </div>

        <div class="glass p-10 max-w-2xl mx-auto">
            <form id="izinForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest">TANGGAL</label>
                        <input type="date" id="izinTanggal" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500 transition text-sm" required>
                    </div>
                    <div class="space-y-1.5">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest">JENIS</label>
                        <select id="izinJenis" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500 transition text-sm" required>
                            <option value="Sakit">Sakit (Medis)</option>
                            <option value="Izin">Izin (Keperluan)</option>
                        </select>
                    </div>
                </div>
                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest">ALASAN / KETERANGAN</label>
                    <textarea id="izinAlasan" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500 transition text-sm" rows="4" placeholder="Tuliskan alasan singkat..." required></textarea>
                </div>
                <div class="space-y-1.5">
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest">DOKUMEN PENDUKUNG (FOTO)</label>
                    <div class="relative group">
                        <input type="file" id="izinFoto" accept="image/*" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500 transition text-sm file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20" required>
                    </div>
                </div>
                <button type="submit" class="w-full btn-rich text-white font-bold py-4 rounded-2xl transition shadow-lg mt-4">KIRIM DOKUMEN</button>
            </form>
        </div>
    `;

    document.getElementById('izinForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.innerText = 'MENGIRIM...';

        const formData = new FormData();
        formData.append('guru_id', state.user.id);
        formData.append('tanggal', document.getElementById('izinTanggal').value);
        formData.append('jenis', document.getElementById('izinJenis').value);
        formData.append('alasan', document.getElementById('izinAlasan').value);
        formData.append('foto', document.getElementById('izinFoto').files[0]);

        try {
            const res = await fetch('/api/izin', { method: 'POST', body: formData });
            if (res.ok) {
                alert("Pengajuan berhasil dikirim. Menunggu verifikasi admin.");
                navigate('guru_dashboard');
            } else alert("Gagal mengirim data.");
        } catch (e) { alert("Masalah jaringan."); }
        finally { btn.disabled = false; btn.innerText = 'KIRIM DOKUMEN'; }
    };
}

function renderRiwayatGuru() {
    app.innerHTML = `
        <div class="mb-10 flex items-center">
            <button onclick="navigate('guru_dashboard')" class="mr-6 p-3 glass rounded-2xl hover:bg-white/5 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            <h1 class="text-3xl font-bold tracking-tight">Log Kehadiran</h1>
        </div>
        <div class="glass overflow-hidden border border-slate-700/50 shadow-2xl">
            <table class="w-full text-left">
                <thead>
                    <tr class="bg-indigo-500/10">
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest">Waktu Presensi</th>
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest">Keterangan</th>
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest text-right">Status</th>
                    </tr>
                </thead>
                <tbody id="riwayatBody"></tbody>
            </table>
        </div>
    `;

    fetch(`/api/riwayat?guru_id=${state.user.id}`)
        .then(res => res.json())
        .then(data => {
            const body = document.getElementById('riwayatBody');
            if (data.length === 0) {
                body.innerHTML = '<tr><td colspan="3" class="p-10 text-center text-slate-500 font-medium">Belum ada riwayat tercatat.</td></tr>';
                return;
            }
            body.innerHTML = data.map(row => `
                <tr class="border-t border-slate-700/50 hover:bg-white/5 transition">
                    <td class="p-5">
                        <div class="text-sm font-bold text-slate-200">${row.timestamp.split(',')[0]}</div>
                        <div class="text-xs text-slate-400 font-medium">${row.timestamp.split(',')[1] || ''}</div>
                    </td>
                    <td class="p-5 text-sm text-slate-400 font-medium">${row.keterangan}</td>
                    <td class="p-5 text-right">
                        <span class="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${row.status === 'Hadir' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : row.status === 'Terlambat' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}">
                            ${row.status}
                        </span>
                    </td>
                </tr>
            `).join('');
        });
}

// ADMIN PAGES (Simplified Rich Style)
function renderAdminDashboard() {
    app.innerHTML = `
        <header class="flex justify-between items-end mb-12 px-2">
            <div>
                <p class="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">PANEL ADMINISTRATOR</p>
                <h1 class="text-2xl font-bold">Ringkasan Sistem</h1>
            </div>
            <button onclick="logout()" class="text-slate-400 text-xs font-bold hover:text-white transition uppercase tracking-widest bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700/50">LOGOUT</button>
        </header>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <button onclick="navigate('admin_guru')" class="glass p-8 text-left hover:bg-white/5 transition group">
                <div class="bg-indigo-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <span class="text-xl">👨‍🏫</span>
                </div>
                <div class="font-bold text-sm">Kelola Guru</div>
            </button>
            <button onclick="navigate('admin_jadwal')" class="glass p-8 text-left hover:bg-white/5 transition group">
                <div class="bg-indigo-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <span class="text-xl">⚙️</span>
                </div>
                <div class="font-bold text-sm">Konfigurasi</div>
            </button>
            <button onclick="navigate('admin_izin')" class="glass p-8 text-left hover:bg-white/5 transition group">
                <div class="bg-indigo-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <span class="text-xl">📩</span>
                </div>
                <div class="font-bold text-sm">Verifikasi Izin</div>
            </button>
            <button onclick="navigate('admin_riwayat')" class="glass p-8 text-left hover:bg-white/5 transition group">
                <div class="bg-indigo-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
                    <span class="text-xl">📋</span>
                </div>
                <div class="font-bold text-sm">Laporan</div>
            </button>
        </div>

        <div class="glass p-10 relative overflow-hidden">
            <h2 class="text-lg font-bold mb-8 flex items-center">
                <span class="w-2 h-2 bg-indigo-500 rounded-full mr-3 animate-pulse"></span>
                Status Kehadiran Hari Ini
            </h2>
            <div id="adminSummary" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="p-8 card-rich rounded-3xl text-center">
                     <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Tepat Waktu</p>
                     <p class="text-4xl font-black text-white">-</p>
                </div>
                <div class="p-8 card-rich rounded-3xl text-center">
                     <p class="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Terlambat</p>
                     <p class="text-4xl font-black text-white">-</p>
                </div>
            </div>
        </div>
    `;

    fetch('/api/riwayat')
        .then(res => res.json())
        .then(data => {
            const today = new Date().toLocaleDateString('id-ID');
            const filtered = data.filter(r => r.timestamp.includes(today));
            document.getElementById('adminSummary').innerHTML = `
                <div class="p-8 card-rich rounded-3xl text-center">
                     <p class="text-green-500 text-[10px] font-black uppercase tracking-widest mb-2">Hadir Tepat Waktu</p>
                     <p class="text-5xl font-black text-white">${filtered.filter(r => r.status === 'Hadir').length}</p>
                </div>
                <div class="p-8 card-rich rounded-3xl text-center">
                     <p class="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-2">Terlambat</p>
                     <p class="text-5xl font-black text-white">${filtered.filter(r => r.status === 'Terlambat').length}</p>
                </div>
            `;
        });
}

// OTHER ADMIN COMPONENTS UPDATED TO RICH STYLE
function renderAdminGuru() {
    app.innerHTML = `
        <div class="mb-10 flex items-center justify-between">
            <div class="flex items-center">
                <button onclick="navigate('admin_dashboard')" class="mr-6 p-3 glass rounded-2xl hover:bg-white/5 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                <h1 class="text-3xl font-bold tracking-tight">Data Guru</h1>
            </div>
            <button onclick="showGuruModal()" class="btn-rich text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest">+ Guru Baru</button>
        </div>

        <div class="glass overflow-hidden shadow-2xl">
            <table class="w-full text-left">
                <thead class="bg-indigo-500/10">
                    <tr>
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest">Username</th>
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest">Nama Lengkap</th>
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody id="guruTableBody"></tbody>
            </table>
        </div>

        <div id="guruModal" class="fixed inset-0 bg-slate-950/80 hidden flex items-center justify-center p-6 z-[100] backdrop-blur-sm">
            <div class="glass p-10 w-full max-w-md">
                <h3 class="text-2xl font-bold mb-8">Tambah Guru</h3>
                <form id="guruForm" class="space-y-6">
                    <input type="hidden" id="oldId">
                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black text-slate-500 tracking-widest">USERNAME / ID</label>
                        <input type="text" id="guruId" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 transition text-sm" required>
                    </div>
                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black text-slate-500 tracking-widest">NAMA LENGKAP</label>
                        <input type="text" id="guruNama" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 transition text-sm" required>
                    </div>
                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black text-slate-500 tracking-widest">PIN AKSES</label>
                        <input type="text" id="guruPin" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-indigo-500 transition text-sm" required>
                    </div>
                    <div class="flex gap-4 pt-4">
                        <button type="button" onclick="closeGuruModal()" class="flex-1 bg-slate-800 text-slate-400 font-bold py-4 rounded-2xl text-xs tracking-widest">BATAL</button>
                        <button type="submit" class="flex-1 btn-rich text-white font-bold py-4 rounded-2xl text-xs tracking-widest">SIMPAN</button>
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
        await fetch('/api/guru', { method: 'POST', body: JSON.stringify(payload) });
        closeGuruModal();
        loadGuruData();
    };
}

async function loadGuruData() {
    const res = await fetch('/api/guru');
    const data = await res.json();
    document.getElementById('guruTableBody').innerHTML = data.map(g => `
        <tr class="border-t border-slate-700/50 hover:bg-white/5 transition">
            <td class="p-5 font-bold text-sm text-slate-300">${g.id}</td>
            <td class="p-5 text-sm text-slate-400">${g.nama}</td>
            <td class="p-5 text-right">
                <button onclick="deleteGuru('${g.id}')" class="text-red-500/50 hover:text-red-400 transition p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function showGuruModal() { document.getElementById('guruModal').classList.remove('hidden'); }
function closeGuruModal() { document.getElementById('guruModal').classList.add('hidden'); }

async function deleteGuru(id) {
    if (confirm('Permanen hapus data guru ini?')) {
        await fetch('/api/guru', { method: 'POST', body: JSON.stringify({ id, action: 'delete' }) });
        loadGuruData();
    }
}

// REMAINING ADMIN PAGES (Simplified)
function renderAdminJadwal() {
    app.innerHTML = `
        <div class="mb-10 flex items-center">
            <button onclick="navigate('admin_dashboard')" class="mr-6 p-3 glass rounded-2xl hover:bg-white/5 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            <h1 class="text-3xl font-bold tracking-tight">Konfigurasi Sistem</h1>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="glass p-10">
                <h3 class="font-bold text-lg mb-8 text-indigo-400">Jam Operasional</h3>
                <form id="jamForm" class="space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-slate-500 tracking-widest">MASUK MULAI</label>
                            <input type="time" name="JAM_MASUK_MULAI" value="${state.config.JAM_MASUK_MULAI}" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 transition">
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-slate-500 tracking-widest">MASUK AKHIR</label>
                            <input type="time" name="JAM_MASUK_SELESAI" value="${state.config.JAM_MASUK_SELESAI}" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 transition">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-amber-500/70 tracking-widest">TELAT MULAI</label>
                            <input type="time" name="JAM_TERLAMBAT_MULAI" value="${state.config.JAM_TERLAMBAT_MULAI}" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 transition">
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-amber-500/70 tracking-widest">TELAT AKHIR</label>
                            <input type="time" name="JAM_TERLAMBAT_SELESAI" value="${state.config.JAM_TERLAMBAT_SELESAI}" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 transition">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-blue-500/70 tracking-widest">PULANG MULAI</label>
                            <input type="time" name="JAM_PULANG_MULAI" value="${state.config.JAM_PULANG_MULAI}" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 transition">
                        </div>
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-blue-500/70 tracking-widest">PULANG AKHIR</label>
                            <input type="time" name="JAM_PULANG_SELESAI" value="${state.config.JAM_PULANG_SELESAI}" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 transition">
                        </div>
                    </div>
                    <button type="submit" class="w-full btn-rich text-white font-bold py-4 rounded-2xl text-xs tracking-widest mt-2">SIMPAN PERUBAHAN</button>
                </form>
            </div>

            <div class="glass p-10">
                <h3 class="font-bold text-lg mb-8 text-indigo-400">Koordinat Sekolah</h3>
                <form id="lokasiForm" class="space-y-6">
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-black text-slate-500 tracking-widest">LATITUDE</label>
                        <input type="text" name="LOKASI_SEKOLAH_LAT" value="${state.config.LOKASI_SEKOLAH_LAT}" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 transition">
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-black text-slate-500 tracking-widest">LONGITUDE</label>
                        <input type="text" name="LOKASI_SEKOLAH_LNG" value="${state.config.LOKASI_SEKOLAH_LNG}" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 transition">
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-black text-slate-500 tracking-widest">RADIUS DETEKSI (METER)</label>
                        <input type="number" name="RADIUS_METER" value="${state.config.RADIUS_METER}" class="w-full bg-slate-900/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-sm focus:border-indigo-500 transition">
                    </div>
                    <button type="submit" class="w-full btn-rich text-white font-bold py-4 rounded-2xl text-xs tracking-widest mt-2">SIMPAN LOKASI</button>
                </form>
            </div>

            <div class="glass p-10 md:col-span-2">
                <h3 class="font-bold text-lg mb-8 text-indigo-400">Kalender Hari Libur</h3>
                <div class="flex gap-4 mb-8">
                    <input type="date" id="newLibur" class="flex-1 bg-slate-900/50 border border-slate-700/50 rounded-2xl px-5 py-3 text-sm focus:border-indigo-500 transition">
                    <button onclick="addLibur()" class="bg-indigo-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase">TAMBAH</button>
                </div>
                <div id="liburList" class="flex flex-wrap gap-3"></div>
            </div>
        </div>
    `;

    const handleSave = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());
        await fetch('/api/pengaturan', { method: 'POST', body: JSON.stringify(data) });
        alert('Data berhasil disimpan.');
        await fetchConfig(); renderAdminJadwal();
    };

    document.getElementById('jamForm').onsubmit = handleSave;
    document.getElementById('lokasiForm').onsubmit = handleSave;
    renderLibur();
}

function renderLibur() {
    const list = JSON.parse(state.config.HARI_LIBUR || "[]");
    document.getElementById('liburList').innerHTML = list.map(d => `
        <div class="bg-slate-800/50 border border-slate-700/50 px-5 py-2.5 rounded-2xl flex items-center text-xs font-bold text-slate-300">
            ${d}
            <button onclick="removeLibur('${d}')" class="ml-4 text-red-500/50 hover:text-red-400 transition">×</button>
        </div>
    `).join('');
}

async function addLibur() {
    const date = document.getElementById('newLibur').value;
    if (!date) return;
    const list = JSON.parse(state.config.HARI_LIBUR || "[]");
    if (!list.includes(date)) {
        list.push(date);
        await fetch('/api/pengaturan', { method: 'POST', body: JSON.stringify({ HARI_LIBUR: JSON.stringify(list) }) });
        await fetchConfig(); renderAdminJadwal();
    }
}

async function removeLibur(date) {
    let list = JSON.parse(state.config.HARI_LIBUR || "[]");
    list = list.filter(d => d !== date);
    await fetch('/api/pengaturan', { method: 'POST', body: JSON.stringify({ HARI_LIBUR: JSON.stringify(list) }) });
    await fetchConfig(); renderAdminJadwal();
}

function renderAdminIzin() {
    app.innerHTML = `
        <div class="mb-10 flex items-center">
            <button onclick="navigate('admin_dashboard')" class="mr-6 p-3 glass rounded-2xl hover:bg-white/5 transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
            </button>
            <h1 class="text-3xl font-bold tracking-tight">Verifikasi Pengajuan</h1>
        </div>
        <div class="glass overflow-hidden shadow-2xl">
            <table class="w-full text-left">
                <thead class="bg-indigo-500/10">
                    <tr>
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest">Pendaftar</th>
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest">Detail Izin</th>
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest">Berkas</th>
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest">Status</th>
                        <th class="p-5 text-xs font-bold text-slate-300 uppercase tracking-widest text-right">Aksi</th>
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
                <tr class="border-t border-slate-700/50 hover:bg-white/5 transition">
                    <td class="p-5">
                        <div class="font-bold text-sm text-slate-200">${i.nama}</div>
                        <div class="text-[10px] text-slate-500 font-black tracking-widest uppercase">${i.guru_id}</div>
                    </td>
                    <td class="p-5">
                        <div class="text-sm font-medium text-slate-300">${i.tanggal}</div>
                        <div class="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-0.5">${i.jenis}</div>
                    </td>
                    <td class="p-5">
                        ${i.foto_key ? `<a href="/api/file?key=${i.foto_key}" target="_blank" class="text-indigo-400 hover:text-indigo-300 underline text-xs font-bold">Buka Foto</a>` : '<span class="text-slate-600 text-xs">-</span>'}
                    </td>
                    <td class="p-5">
                        <span class="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${i.status === 'Pending' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : i.status === 'Disetujui' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}">
                            ${i.status}
                        </span>
                    </td>
                    <td class="p-5 text-right">
                        ${i.status === 'Pending' ? `
                            <div class="flex justify-end gap-2">
                                <button onclick="approveIzin(${i.id}, 'Disetujui')" class="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white p-2.5 rounded-xl transition border border-green-500/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                                <button onclick="approveIzin(${i.id}, 'Ditolak')" class="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-2.5 rounded-xl transition border border-red-500/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ` : '<span class="text-slate-600 text-xs font-bold tracking-widest">SELESAI</span>'}
                    </td>
                </tr>
            `).join('');
        });
}

async function approveIzin(id, status) {
    await fetch('/api/approve_izin', { method: 'POST', body: JSON.stringify({ id, status }) });
    renderAdminIzin();
}

function renderAdminRiwayat() {
    app.innerHTML = `
        <div class="mb-10 flex items-center justify-between">
            <div class="flex items-center">
                <button onclick="navigate('admin_dashboard')" class="mr-6 p-3 glass rounded-2xl hover:bg-white/5 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                <h1 class="text-3xl font-bold tracking-tight">Laporan Global</h1>
            </div>
            <button onclick="window.print()" class="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase hover:bg-slate-200 transition">Cetak PDF</button>
        </div>
        <div class="glass overflow-hidden shadow-2xl">
            <table class="w-full text-left">
                <thead class="bg-indigo-500/10">
                    <tr>
                        <th class="p-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Guru</th>
                        <th class="p-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Waktu Presensi</th>
                        <th class="p-5 text-[10px] font-black text-slate-300 uppercase tracking-widest">Lokasi</th>
                        <th class="p-5 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Status</th>
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
                <tr class="border-t border-slate-700/50 hover:bg-white/5 transition">
                    <td class="p-5">
                        <div class="font-bold text-sm text-slate-200">${r.nama}</div>
                        <div class="text-[10px] text-slate-500 font-bold tracking-widest uppercase">${r.guru_id}</div>
                    </td>
                    <td class="p-5">
                        <div class="text-sm font-medium text-slate-300">${r.timestamp}</div>
                        <div class="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">${r.keterangan}</div>
                    </td>
                    <td class="p-5">
                        <div class="text-[10px] text-slate-400 font-mono tracking-tighter">${r.latitude}, ${r.longitude}</div>
                    </td>
                    <td class="p-5 text-right">
                         <span class="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${r.status === 'Hadir' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : r.status === 'Terlambat' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}">
                            ${r.status}
                        </span>
                    </td>
                </tr>
            `).join('');
        });
}

// GLOBAL LOGIC
function logout() { localStorage.removeItem('user'); state.user = null; navigate('login'); }

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
    setInterval(update, 1000); update();
}

async function handleAbsen() {
    const btn = document.getElementById('btnAbsen');
    const statusMsg = document.getElementById('statusMessage');
    btn.disabled = true; btn.innerText = 'MEMINDAI LOKASI...';
    statusMsg.classList.add('hidden');

    if (!navigator.geolocation) { alert("Geolocation tidak didukung."); btn.disabled = false; btn.innerText = 'Konfirmasi Kehadiran'; return; }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        btn.innerText = 'MENGIRIM DATA...';
        try {
            const res = await fetch('/api/absen', {
                method: 'POST',
                body: JSON.stringify({ guru_id: state.user.id, lat: latitude, lng: longitude })
            });
            const data = await res.json();
            statusMsg.classList.remove('hidden');
            if (res.ok) {
                statusMsg.className = "mt-6 p-6 glass bg-green-500/10 border border-green-500/30 text-center rounded-3xl animate-in fade-in zoom-in duration-300";
                statusMsg.innerHTML = `<div class="text-green-400 font-black uppercase tracking-widest text-sm mb-1">Presensi Berhasil</div><div class="text-white font-bold">${data.keterangan} (${data.status})</div>`;
            } else {
                statusMsg.className = "mt-6 p-6 glass bg-red-500/10 border border-red-500/30 text-center rounded-3xl animate-in fade-in zoom-in duration-300";
                statusMsg.innerHTML = `<div class="text-red-400 font-black uppercase tracking-widest text-sm mb-1">Presensi Gagal</div><div class="text-white font-bold">${data.error}</div>`;
            }
        } catch (e) { alert("Kesalahan server."); }
        finally { btn.disabled = false; btn.innerText = 'Konfirmasi Kehadiran'; }
    }, (err) => { alert("Pastikan GPS aktif."); btn.disabled = false; btn.innerText = 'Konfirmasi Kehadiran'; }, { enableHighAccuracy: true });
}

init();
