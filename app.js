const state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    config: {},
    currentPage: 'login',
    activeTab: 'home',
    modelsLoaded: false
};

const app = document.getElementById('app');

// Initialization
async function init() {
    if (state.user) {
        // Fetch Fresh User Data from DB (especially face_descriptor)
        if (state.user.role === 'guru') {
            await syncUser();
        }

        if (state.user.role === 'admin') {
            state.currentPage = 'admin_dashboard';
        } else if (!state.user.isFaceRegistered) {
            state.currentPage = 'face_registration';
        } else {
            state.currentPage = 'guru_dashboard';
        }
    } else {
        state.currentPage = 'login';
    }
    await fetchConfig();
    render();
    if (state.user && !state.modelsLoaded) {
        loadFaceModels();
    }
}

async function syncUser() {
    try {
        const res = await fetch(`/api/guru?id=${state.user.id}`);
        if (res.ok) {
            const fresh = await res.json();
            state.user = {
                ...state.user,
                nama: fresh.nama,
                face_descriptor: fresh.face_descriptor ? JSON.parse(fresh.face_descriptor) : null,
                isFaceRegistered: !!fresh.face_descriptor
            };
            // Do NOT store descriptor in localStorage, only profile info
            localStorage.setItem('user', JSON.stringify({
                id: state.user.id,
                nama: state.user.nama,
                role: state.user.role,
                isFaceRegistered: state.user.isFaceRegistered
            }));
        }
    } catch (e) { console.error("Sync User Gagal", e); }
}

async function loadFaceModels() {
    const loader = document.getElementById('aiLoader');
    const bar = document.getElementById('aiProgressBar');
    const text = document.getElementById('aiProgressText');

    // List file model dan ukurannya (estimasi untuk progres)
    const models = [
        'tiny_face_detector_model-weights_manifest.json',
        'tiny_face_detector_model-shard1',
        'face_landmark_68_model-weights_manifest.json',
        'face_landmark_68_model-shard1',
        'face_recognition_model-weights_manifest.json',
        'face_recognition_model-shard1',
        'face_recognition_model-shard2'
    ];

    if (state.modelsLoaded) return;

    loader.style.display = 'flex';
    let loaded = 0;

    try {
        for (const model of models) {
            await fetch(`/models/${model}`);
            loaded++;
            const percent = Math.round((loaded / models.length) * 100);
            bar.style.width = percent + '%';
            text.innerText = percent + '% SELESAI';
        }

        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

        state.modelsLoaded = true;
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    } catch (e) {
        console.error("Gagal memuat model AI", e);
        Swal.fire({ icon: 'error', title: 'Gagal Memuat AI', text: 'Koneksi internet lambat atau terputus. Mohon refresh halaman.' });
    }
}

async function fetchConfig() {
    try {
        const res = await fetch('/api/pengaturan');
        state.config = await res.json();
    } catch (e) {
        console.error("Gagal mengambil konfigurasi", e);
    }
}

function renderFaceRegistration() {
    app.innerHTML = `
        <div class="px-6 pt-10 flex flex-col items-center justify-center min-h-screen text-center">
            <div class="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-[#1a1c1e] mb-2">Daftarkan Wajah</h1>
            <p class="text-gray-500 mb-8 font-medium">Hai ${state.user.nama}, mohon daftarkan wajah Anda untuk mulai menggunakan aplikasi.</p>

            <div class="m3-card overflow-hidden relative w-full aspect-square max-w-[300px] mb-8 bg-black">
                <video id="faceVideo" autoplay muted playsinline class="w-full h-full object-cover"></video>
                <canvas id="faceCanvas" class="absolute inset-0 w-full h-full pointer-events-none" style="transform: scaleX(-1);"></canvas>
            </div>

            <button id="btnRegisterFace" class="w-full m3-btn-filled py-4 text-lg">MULAI PINDAI</button>
            <p id="regStatus" class="mt-4 text-sm font-bold text-blue-600 uppercase tracking-widest"></p>
        </div>
    `;

    const video = document.getElementById('faceVideo');
    const btn = document.getElementById('btnRegisterFace');
    const status = document.getElementById('regStatus');

    btn.onclick = async () => {
        btn.disabled = true;
        btn.innerText = 'MENYIAPKAN KAMERA...';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            video.srcObject = stream;

            status.innerText = 'Mendeteksi Wajah...';
            btn.innerText = 'PINDAI BERJALAN';

            const interval = setInterval(async () => {
                if (!state.modelsLoaded) return;

                const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    clearInterval(interval);
                    status.innerText = 'Wajah Terdeteksi! Menyimpan...';

                    // Simpan ke DB
                    const res = await fetch('/api/guru', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: state.user.id,
                            action: 'register_face',
                            face_descriptor: JSON.stringify(Array.from(detection.descriptor))
                        })
                    });

                    const saveResult = await res.json();

                    if (res.ok) {
                        stream.getTracks().forEach(track => track.stop());
                        await syncUser(); // Refresh data from DB
                        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Wajah Anda telah terdaftar.', timer: 2000, showConfirmButton: false });
                        setTimeout(() => init(), 2000);
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Gagal Simpan',
                            text: 'Pesan Server: ' + (saveResult.error || 'Terjadi kesalahan pada database.')
                        });
                        status.innerText = 'Gagal menyimpan data wajah.';
                        btn.disabled = false;
                        btn.innerText = 'COBA LAGI';
                    }
                }
            }, 1000);

        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Kamera Gagal', text: 'Mohon berikan izin akses kamera.' });
            btn.disabled = false;
            btn.innerText = 'COBA LAGI';
        }
    };
}

// Router
function navigate(page, tab = 'home') {
    state.currentPage = page;
    state.activeTab = tab;
    render();
}

// Render Logic
function render() {
    app.innerHTML = '';

    switch (state.currentPage) {
        case 'login': renderLogin(); break;
        case 'face_registration': renderFaceRegistration(); break;
        case 'guru_dashboard': renderGuruDashboard(); break;
        case 'admin_dashboard': renderAdminDashboard(); break;
        case 'izin_guru': renderIzinGuru(); break;
        case 'riwayat_guru': renderRiwayatGuru(); break;
        // Admin pages reuse standard layout for simplicity but with new style
        case 'admin_guru': renderAdminGuru(); break;
        case 'admin_jadwal': renderAdminJadwal(); break;
        case 'admin_izin': renderAdminIzin(); break;
        case 'admin_riwayat': renderAdminRiwayat(); break;
    }
}

// Android 15 Style Components
function renderLogin() {
    app.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-screen px-6 bg-[#f7f9fc]">
            <div class="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-[#3f5f91]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h1 class="text-3xl font-extrabold text-[#1a1c1e] mb-1">PresensiSaya</h1>
            <p class="text-gray-500 mb-10 font-medium">Masuk ke akun Anda</p>

            <form id="loginForm" class="w-full space-y-4">
                <div class="space-y-1">
                    <label class="text-sm font-bold text-gray-700 ml-1">ID Pengguna</label>
                    <input type="text" id="loginId" class="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-lg" placeholder="Masukkan ID" required>
                </div>
                <div class="space-y-1">
                    <label class="text-sm font-bold text-gray-700 ml-1">PIN Keamanan</label>
                    <input type="password" id="loginPin" class="w-full bg-white border border-gray-300 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-lg" placeholder="••••" required>
                </div>
                <button type="submit" class="w-full m3-btn-filled mt-6 py-5 text-lg">MASUK</button>
                <div id="loginError" class="text-red-600 text-sm font-bold text-center mt-4 hidden"></div>
            </form>
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
                headers: { 'Content-Type': 'application/json' },
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
            btn.innerText = 'MASUK';
        }
    };
}

function renderGuruDashboard() {
    app.innerHTML = `
        <div class="px-6 pt-10">
            <header class="flex justify-between items-start mb-8">
                <div>
                    <h1 class="text-2xl font-bold text-[#1a1c1e]">Hai, ${state.user.nama.split(' ')[0]} 👋</h1>
                    <p class="text-gray-500 font-medium">Bagaimana harimu?</p>
                </div>
                <button onclick="logout()" class="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </header>

            <div class="m3-card p-6 mb-6">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <p id="date" class="text-sm font-bold text-[#3f5f91] uppercase tracking-wider mb-1">MEMUAT...</p>
                        <div id="clock" class="text-4xl font-black text-[#1a1c1e]">00:00:00</div>
                    </div>
                    <div class="m3-fab">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-2xl p-4 flex items-center justify-between mb-8 border border-gray-100">
                    <div class="flex items-center">
                         <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                              </svg>
                         </div>
                         <div class="text-xs font-bold text-gray-500 uppercase">Status Lokasi</div>
                    </div>
                    <div class="text-xs font-black text-green-600 uppercase">Aktif (20m)</div>
                </div>

                <button onclick="handleAbsen()" id="btnAbsen" class="w-full m3-btn-filled py-5 text-lg uppercase tracking-wider shadow-lg">KONFIRMASI PRESENSI</button>
            </div>

            <h2 class="font-bold text-lg mb-4 text-[#1a1c1e]">Presensi Saya</h2>
            <div id="recentStatus" class="mb-4 hidden animate-in fade-in slide-in-from-top-4 duration-300"></div>

            <div id="todayLog" class="m3-card p-5">
                <p class="text-center text-gray-400 text-sm font-medium py-4">Menunggu presensi hari ini...</p>
            </div>
        </div>

        <!-- Android Bottom Nav -->
        <nav class="m3-bottom-nav">
            <button onclick="navigate('guru_dashboard', 'home')" class="m3-nav-item ${state.activeTab === 'home' ? 'active' : ''}">
                <div class="icon-container">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="${state.activeTab === 'home' ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </div>
                <span>Home</span>
            </button>
            <button onclick="navigate('izin_guru', 'izin')" class="m3-nav-item ${state.activeTab === 'izin' ? 'active' : ''}">
                <div class="icon-container">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="${state.activeTab === 'izin' ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <span>Izin</span>
            </button>
            <button onclick="navigate('riwayat_guru', 'history')" class="m3-nav-item ${state.activeTab === 'history' ? 'active' : ''}">
                <div class="icon-container">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="${state.activeTab === 'history' ? 'currentColor' : 'none'}" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <span>Riwayat</span>
            </button>
        </nav>
    `;
    startClock();
    fetchTodayLog();
}

async function fetchTodayLog() {
    const res = await fetch(`/api/riwayat?guru_id=${state.user.id}`);
    const data = await res.json();
    const today = new Date().toLocaleDateString('id-ID');
    const logs = data.filter(r => r.timestamp.includes(today));

    if (logs.length > 0) {
        document.getElementById('todayLog').innerHTML = logs.map(l => `
            <div class="flex items-center justify-between border-b border-gray-100 last:border-0 py-3">
                <div class="flex items-center">
                    <div class="w-8 h-8 ${l.status === 'Hadir' ? 'bg-green-100 text-green-600' : l.status === 'Terlambat' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'} rounded-lg flex items-center justify-center mr-3">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                         </svg>
                    </div>
                    <div class="text-sm font-bold text-[#1a1c1e]">${l.status}</div>
                </div>
                <div class="text-xs font-bold text-gray-400">${l.timestamp.split(',')[1] || ''}</div>
            </div>
        `).join('');
    }
}

function renderIzinGuru() {
    renderGuruDashboard(); // Keep layout
    const content = document.querySelector('.px-6.pt-10');
    content.innerHTML = `
        <header class="mb-8">
            <h1 class="text-2xl font-bold text-[#1a1c1e]">Ajukan Izin</h1>
            <p class="text-gray-500 font-medium">Lengkapi dokumen presensi</p>
        </header>

        <form id="izinForm" class="space-y-6">
            <div class="m3-card p-6 space-y-4">
                <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-500 uppercase ml-1">Tanggal</label>
                    <input type="date" id="izinTanggal" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600/20" required>
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-500 uppercase ml-1">Jenis Izin</label>
                    <select id="izinJenis" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600/20" required>
                        <option value="Sakit">Sakit</option>
                        <option value="Izin">Izin Keperluan</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-500 uppercase ml-1">Alasan</label>
                    <textarea id="izinAlasan" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-600/20" rows="3" placeholder="Ketik alasan..." required></textarea>
                </div>
                <div class="space-y-1">
                    <label class="text-xs font-bold text-gray-500 uppercase ml-1">Unggah Surat (FOTO)</label>
                    <input type="file" id="izinFoto" accept="image/*" class="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-[#3f5f91]" required>
                </div>
            </div>
            <button type="submit" class="w-full m3-btn-filled py-4 text-lg">KIRIM PENGAJUAN</button>
        </form>
    `;

    document.getElementById('izinForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.disabled = true; btn.innerText = 'MENGIRIM...';
        const formData = new FormData();
        formData.append('guru_id', state.user.id);
        formData.append('tanggal', document.getElementById('izinTanggal').value);
        formData.append('jenis', document.getElementById('izinJenis').value);
        formData.append('alasan', document.getElementById('izinAlasan').value);
        formData.append('foto', document.getElementById('izinFoto').files[0]);
        try {
            const res = await fetch('/api/izin', { method: 'POST', body: formData });
            if (res.ok) {
                Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengajuan izin telah terkirim dan menunggu persetujuan admin.', confirmButtonColor: '#3f5f91' });
                navigate('guru_dashboard', 'home');
            }
            else {
                Swal.fire({ icon: 'error', title: 'Gagal', text: 'Terjadi kesalahan saat mengirim pengajuan.', confirmButtonColor: '#3f5f91' });
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Koneksi Terputus', text: 'Pastikan internet Anda stabil.', confirmButtonColor: '#3f5f91' });
        }
        finally { btn.disabled = false; btn.innerText = 'KIRIM PENGAJUAN'; }
    };
}

function renderRiwayatGuru() {
    renderGuruDashboard(); // Keep layout
    const content = document.querySelector('.px-6.pt-10');
    content.innerHTML = `
        <header class="mb-8">
            <h1 class="text-2xl font-bold text-[#1a1c1e]">Riwayat Presensi</h1>
            <p class="text-gray-500 font-medium">Log aktivitas kehadiran Anda</p>
        </header>

        <div id="riwayatList" class="space-y-4">
            <p class="text-center py-10 text-gray-400 font-medium">Memuat...</p>
        </div>
    `;

    fetch(`/api/riwayat?guru_id=${state.user.id}`)
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('riwayatList');
            if (data.length === 0) { list.innerHTML = '<p class="text-center text-gray-400 py-10">Belum ada data.</p>'; return; }
            list.innerHTML = data.map(r => `
                <div class="m3-card p-4 flex items-center justify-between">
                    <div class="flex items-center">
                        <div class="w-12 h-12 ${r.status === 'Hadir' ? 'bg-green-100 text-green-600' : r.status === 'Terlambat' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'} rounded-2xl flex items-center justify-center mr-4">
                             <span class="text-xs font-black uppercase">${r.status.substring(0, 1)}</span>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-[#1a1c1e]">${r.timestamp.split(',')[0]}</p>
                            <p class="text-[10px] text-gray-500 font-bold uppercase">${r.keterangan}</p>
                        </div>
                    </div>
                    <div class="text-right">
                         <p class="text-xs font-black text-[#1a1c1e]">${r.timestamp.split(',')[1] || ''}</p>
                         <p class="text-[9px] text-gray-400 font-bold uppercase">${r.status}</p>
                    </div>
                </div>
            `).join('');
        });
}

// ADMIN PAGES (Stay with Light Mode & Material Design)
function renderAdminDashboard() {
    app.innerHTML = `
        <div class="px-6 pt-10">
            <header class="flex justify-between items-end mb-8">
                <div>
                    <h1 class="text-2xl font-bold text-[#1a1c1e]">Panel Admin</h1>
                    <p class="text-gray-500 font-medium">Manajemen PresensiSaya</p>
                </div>
                <button onclick="logout()" class="p-2 bg-gray-100 rounded-full">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </header>

            <div class="grid grid-cols-2 gap-4 mb-8">
                <button onclick="navigate('admin_guru')" class="m3-card p-5 text-center flex flex-col items-center">
                    <div class="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">👨‍🏫</div>
                    <span class="text-xs font-bold text-gray-700">Data Guru</span>
                </button>
                <button onclick="navigate('admin_jadwal')" class="m3-card p-5 text-center flex flex-col items-center">
                    <div class="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-3">⚙️</div>
                    <span class="text-xs font-bold text-gray-700">Pengaturan</span>
                </button>
                <button onclick="navigate('admin_izin')" class="m3-card p-5 text-center flex flex-col items-center">
                    <div class="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-3">📩</div>
                    <span class="text-xs font-bold text-gray-700">Verifikasi</span>
                </button>
                <button onclick="navigate('admin_riwayat')" class="m3-card p-5 text-center flex flex-col items-center">
                    <div class="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3">📋</div>
                    <span class="text-xs font-bold text-gray-700">Laporan</span>
                </button>
            </div>

            <div class="m3-card p-6">
                 <h3 class="font-bold text-sm text-gray-500 uppercase tracking-widest mb-4">Ringkasan Hari Ini</h3>
                 <div id="adminSummary" class="flex gap-4">
                      <div class="flex-1 bg-green-50 rounded-2xl p-4 text-center">
                           <div class="text-2xl font-black text-green-600">-</div>
                           <div class="text-[10px] font-bold text-green-800 uppercase">Hadir</div>
                      </div>
                      <div class="flex-1 bg-amber-50 rounded-2xl p-4 text-center">
                           <div class="text-2xl font-black text-amber-600">-</div>
                           <div class="text-[10px] font-bold text-amber-800 uppercase">Telat</div>
                      </div>
                 </div>
            </div>
        </div>
    `;
    fetch('/api/riwayat').then(res => res.json()).then(data => {
        const today = new Date().toLocaleDateString('id-ID');
        const filtered = data.filter(r => r.timestamp.includes(today));
        document.getElementById('adminSummary').innerHTML = `
            <div class="flex-1 bg-green-50 rounded-2xl p-4 text-center border border-green-100">
                 <div class="text-3xl font-black text-green-600">${filtered.filter(r => r.status === 'Hadir').length}</div>
                 <div class="text-[10px] font-bold text-green-800 uppercase">Hadir</div>
            </div>
            <div class="flex-1 bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
                 <div class="text-3xl font-black text-amber-600">${filtered.filter(r => r.status === 'Terlambat').length}</div>
                 <div class="text-[10px] font-bold text-amber-800 uppercase">Telat</div>
            </div>
        `;
    });
}

// ADAPTING OTHER ADMIN PAGES TO LIGHT M3 STYLE
function renderAdminGuru() {
    app.innerHTML = `
        <div class="px-6 pt-10">
            <header class="flex items-center mb-8">
                <button onclick="navigate('admin_dashboard')" class="p-2 mr-3 bg-gray-100 rounded-full">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                <h1 class="text-2xl font-bold">Data Guru</h1>
            </header>

            <button onclick="showGuruModal()" class="w-full m3-btn-tonal mb-6">+ Tambah Guru Baru</button>

            <div id="guruList" class="space-y-3"></div>
        </div>

        <!-- Modal (Light) -->
        <div id="guruModal" class="fixed inset-0 bg-black/50 hidden flex items-center justify-center p-6 z-[100] backdrop-blur-sm">
            <div class="bg-white p-10 w-full max-w-sm rounded-[32px] shadow-2xl">
                <h3 class="text-xl font-black mb-6">Profil Guru</h3>
                <form id="guruForm" class="space-y-4">
                    <input type="text" id="guruId" class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:outline-none" placeholder="ID / Username" required>
                    <input type="text" id="guruNama" class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:outline-none" placeholder="Nama Lengkap" required>
                    <input type="text" id="guruPin" class="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:outline-none" placeholder="PIN" required>
                    <div class="flex gap-3 pt-2">
                        <button type="button" onclick="closeGuruModal()" class="flex-1 py-3 text-sm font-bold text-gray-500">Batal</button>
                        <button type="submit" class="flex-1 m3-btn-tonal">Simpan</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    loadGuruData();
    document.getElementById('guruForm').onsubmit = async (e) => {
        e.preventDefault();
        const payload = { id: document.getElementById('guruId').value, nama: document.getElementById('guruNama').value, pin: document.getElementById('guruPin').value };
        const res = await fetch('/api/guru', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeGuruModal(); loadGuruData();
            Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data guru disimpan.', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menyimpan data guru.' });
        }
    };
}

async function loadGuruData() {
    const res = await fetch('/api/guru');
    const data = await res.json();
    document.getElementById('guruList').innerHTML = data.map(g => `
        <div class="m3-card p-4 flex justify-between items-center">
            <div class="flex-1">
                <p class="font-bold text-[#1a1c1e]">${g.nama}</p>
                <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${g.id}</p>
                ${g.hasFace ? '<span class="text-[8px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">WAJAH TERDAFTAR</span>' : '<span class="text-[8px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">WAJAH BELUM ADA</span>'}
            </div>
            <div class="flex items-center gap-2">
                <button onclick="resetFace('${g.id}')" title="Reset Wajah" class="p-2 text-amber-600 bg-amber-50 rounded-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
                <button onclick="deleteGuru('${g.id}')" class="p-2 text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

async function resetFace(id) {
    const result = await Swal.fire({
        title: 'Reset Wajah?',
        text: "Guru ini harus mendaftarkan wajahnya kembali saat login berikutnya.",
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3f5f91',
        confirmButtonText: 'Ya, Reset'
    });
    if (result.isConfirmed) {
        await fetch('/api/guru', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action: 'reset_face' })
        });
        loadGuruData();
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data wajah guru telah direset.', timer: 1500, showConfirmButton: false });
    }
}

function showGuruModal() { document.getElementById('guruModal').classList.remove('hidden'); }
function closeGuruModal() { document.getElementById('guruModal').classList.add('hidden'); }

async function deleteGuru(id) {
    const result = await Swal.fire({
        title: 'Hapus Guru?',
        text: "Seluruh data terkait guru ini akan dihapus permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3f5f91',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
        await fetch('/api/guru', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action: 'delete' })
        });
        loadGuruData();
        Swal.fire({ icon: 'success', title: 'Terhapus!', text: 'Data guru telah dihapus.', timer: 1500, showConfirmButton: false });
    }
}

// SIMPLIFIED REST OF ADMIN FOR LIGHT STYLE
function renderAdminJadwal() {
    app.innerHTML = `
        <div class="px-6 pt-10">
            <header class="flex items-center mb-8">
                <button onclick="navigate('admin_dashboard')" class="p-2 mr-3 bg-gray-100 rounded-full">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                <h1 class="text-2xl font-bold">Pengaturan</h1>
            </header>

            <form id="jamForm" class="space-y-4 mb-6">
                <div class="m3-card p-5 space-y-4">
                    <h3 class="font-bold text-xs text-gray-400 uppercase">Jadwal Presensi</h3>
                    <div class="grid grid-cols-2 gap-3">
                        <input type="time" name="JAM_MASUK_MULAI" value="${state.config.JAM_MASUK_MULAI}" class="bg-gray-50 p-3 rounded-xl text-xs border border-gray-200">
                        <input type="time" name="JAM_MASUK_SELESAI" value="${state.config.JAM_MASUK_SELESAI}" class="bg-gray-50 p-3 rounded-xl text-xs border border-gray-200">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <input type="time" name="JAM_PULANG_MULAI" value="${state.config.JAM_PULANG_MULAI}" class="bg-gray-50 p-3 rounded-xl text-xs border border-gray-200">
                        <input type="time" name="JAM_PULANG_SELESAI" value="${state.config.JAM_PULANG_SELESAI}" class="bg-gray-50 p-3 rounded-xl text-xs border border-gray-200">
                    </div>
                </div>
                <button type="submit" class="w-full m3-btn-tonal">Simpan Jadwal</button>
            </form>

            <form id="lokasiForm" class="space-y-4">
                <div class="m3-card p-5 space-y-3">
                    <h3 class="font-bold text-xs text-gray-400 uppercase">Geofencing</h3>
                    <input type="text" name="LOKASI_SEKOLAH_LAT" value="${state.config.LOKASI_SEKOLAH_LAT}" class="w-full bg-gray-50 p-3 rounded-xl text-xs border border-gray-200">
                    <input type="text" name="LOKASI_SEKOLAH_LNG" value="${state.config.LOKASI_SEKOLAH_LNG}" class="w-full bg-gray-50 p-3 rounded-xl text-xs border border-gray-200">
                    <div class="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100 mt-2">
                        <div>
                            <p class="text-[10px] font-black text-blue-900 uppercase">Anti Fake GPS</p>
                            <p class="text-[8px] text-blue-700 font-bold uppercase">Cegah Lokasi Palsu</p>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="ANTI_FAKE_GPS" class="sr-only peer" ${state.config.ANTI_FAKE_GPS === 'ON' ? 'checked' : ''}>
                            <div class="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>
                <button type="submit" class="w-full m3-btn-tonal">Simpan Lokasi</button>
            </form>
        </div>
    `;
    const handleSave = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.fromEntries(fd.entries());

        // Handle Checkbox
        if (e.target.id === 'lokasiForm') {
            data.ANTI_FAKE_GPS = e.target.querySelector('[name="ANTI_FAKE_GPS"]').checked ? 'ON' : 'OFF';
        }

        await fetch('/api/pengaturan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengaturan telah diperbarui.', timer: 1500, showConfirmButton: false });
        await fetchConfig(); renderAdminJadwal();
    };
    document.getElementById('jamForm').onsubmit = handleSave;
    document.getElementById('lokasiForm').onsubmit = handleSave;
}

function renderAdminIzin() {
    app.innerHTML = `
        <div class="px-6 pt-10">
            <header class="flex items-center mb-8">
                <button onclick="navigate('admin_dashboard')" class="p-2 mr-3 bg-gray-100 rounded-full">
                     <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
                <h1 class="text-2xl font-bold">Verifikasi</h1>
            </header>
            <div id="izinList" class="space-y-4"></div>
        </div>
    `;
    fetch('/api/izin').then(res => res.json()).then(data => {
        document.getElementById('izinList').innerHTML = data.map(i => `
            <div class="m3-card p-5">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <p class="font-bold text-[#1a1c1e]">${i.nama}</p>
                        <p class="text-[10px] font-bold text-gray-400 uppercase">${i.jenis} | ${i.tanggal}</p>
                    </div>
                    <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-gray-100 rounded-full">${i.status}</span>
                </div>
                <p class="text-xs text-gray-600 mb-4">${i.alasan}</p>
                ${i.status === 'Pending' ? `
                    <div class="flex gap-2">
                        <button onclick="approveIzin(${i.id}, 'Disetujui')" class="flex-1 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-bold">Setuju</button>
                        <button onclick="approveIzin(${i.id}, 'Ditolak')" class="flex-1 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold">Tolak</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    });
}

function renderAdminRiwayat() {
    app.innerHTML = `
        <div class="px-6 pt-10">
            <header class="flex items-center justify-between mb-8">
                <div class="flex items-center">
                    <button onclick="navigate('admin_dashboard')" class="p-2 mr-3 bg-gray-100 rounded-full">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                    <h1 class="text-2xl font-bold">Laporan</h1>
                </div>
                <button onclick="window.print()" class="text-xs font-bold text-blue-600">CETAK</button>
            </header>
            <div id="logList" class="space-y-3"></div>
        </div>
    `;
    fetch('/api/riwayat').then(res => res.json()).then(data => {
        document.getElementById('logList').innerHTML = data.map(r => `
            <div class="m3-card p-4 flex justify-between items-center text-xs">
                <div>
                    <p class="font-bold">${r.nama}</p>
                    <p class="text-gray-400 font-bold uppercase" style="font-size: 8px;">${r.timestamp}</p>
                </div>
                <div class="font-black text-blue-600 uppercase" style="font-size: 9px;">${r.status}</div>
            </div>
        `).join('');
    });
}

async function approveIzin(id, status) {
    await fetch('/api/approve_izin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
    });
    renderAdminIzin();
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
        dateEl.innerText = wit.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    };
    setInterval(update, 1000); update();
}

async function handleAbsen() {
    const btn = document.getElementById('btnAbsen');
    const recentStatus = document.getElementById('recentStatus');

    // Face Verification Step
    btn.disabled = true;
    btn.innerText = 'VERIFIKASI WAJAH...';

    const faceResult = await Swal.fire({
        title: 'Verifikasi Wajah Otomatis',
        html: `
            <div class="relative w-full aspect-square bg-black rounded-2xl overflow-hidden mb-4">
                <video id="verifyVideo" autoplay muted playsinline class="w-full h-full object-cover"></video>
                <div id="faceOverlay" class="absolute inset-0 border-4 border-blue-400 opacity-30 rounded-2xl pointer-events-none transition-all duration-300"></div>
            </div>
            <p id="verifyStatus" class="text-sm font-bold text-gray-500">Posisikan wajah Anda di depan kamera...</p>
        `,
        showCancelButton: true,
        cancelButtonText: 'Batal',
        showConfirmButton: false, // Hidden, automatic detection
        didOpen: async () => {
            const video = document.getElementById('verifyVideo');
            const status = document.getElementById('verifyStatus');
            const overlay = document.getElementById('faceOverlay');
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            video.srcObject = stream;
            window.verifyStream = stream;

            let storedDescriptor = state.user.face_descriptor;

            // Re-sync if memory is empty
            if (!storedDescriptor) {
                status.innerText = 'Mensinkronisasi data wajah...';
                await syncUser();
                storedDescriptor = state.user.face_descriptor;
            }

            if (typeof storedDescriptor === 'string') storedDescriptor = JSON.parse(storedDescriptor);

            if (!storedDescriptor) {
                Swal.fire({ icon: 'error', title: 'Data Wajah Hilang', text: 'Mohon hubungi admin untuk reset wajah atau coba login kembali.' });
                return;
            }

            let attempts = 0;
            const interval = setInterval(async () => {
                if (!state.modelsLoaded) return;
                attempts++;

                const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (detection) {
                    overlay.classList.add('border-green-400', 'opacity-100');
                    overlay.classList.remove('border-blue-400', 'opacity-30');

                    // Convert descriptor to Float32Array if it is not already
                    const compareDescriptor = (storedDescriptor instanceof Float32Array) ? storedDescriptor : new Float32Array(storedDescriptor);
                    const distance = faceapi.euclideanDistance(compareDescriptor, detection.descriptor);

                    if (distance < 0.6) {
                        clearInterval(interval);
                        status.innerText = 'Wajah Cocok! Mengambil Absen...';
                        status.classList.add('text-green-600');
                        setTimeout(() => Swal.clickConfirm(), 1000);
                        window.verifiedDescriptor = Array.from(detection.descriptor);
                    } else {
                        status.innerText = 'Wajah tidak cocok. Coba lagi...';
                        status.classList.add('text-red-600');
                    }
                } else {
                    overlay.classList.remove('border-green-400', 'opacity-100');
                    overlay.classList.add('border-blue-400', 'opacity-30');
                    status.innerText = 'Posisikan wajah Anda di depan kamera...';
                    status.classList.remove('text-red-600', 'text-green-600');
                }

                if (attempts > 30) { // Timeout 30 seconds
                    clearInterval(interval);
                    Swal.fire({ icon: 'error', title: 'Gagal Verifikasi', text: 'Wajah tidak terdeteksi atau tidak cocok dalam waktu lama. Harap coba lagi.' });
                }
            }, 1000);
            window.verifyInterval = interval;
        },
        willClose: () => {
            if (window.verifyStream) window.verifyStream.getTracks().forEach(t => t.stop());
            if (window.verifyInterval) clearInterval(window.verifyInterval);
        }
    });

    if (!faceResult.isConfirmed) {
        btn.disabled = false;
        btn.innerText = 'KONFIRMASI PRESENSI';
        return;
    }

    const faceDescriptor = window.verifiedDescriptor;

    btn.disabled = true; btn.innerText = 'MEMINDAI LOKASI...';
    recentStatus.classList.add('hidden');

    if (!navigator.geolocation) {
        Swal.fire({ icon: 'error', title: 'GPS Tidak Tersedia', text: 'Aplikasi membutuhkan akses lokasi.', confirmButtonColor: '#3f5f91' });
        btn.disabled = false; btn.innerText = 'KONFIRMASI PRESENSI';
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // Anti-Fake GPS Detection Logic (Standard Web API)
        let isMock = false;
        if (state.config.ANTI_FAKE_GPS === 'ON') {
            // Check for accuracy that is too perfect (e.g. 0 or exactly the same)
            // Note: Modern browsers don't expose 'mocked' flag easily,
            // but we can check for common patterns.
            if (accuracy < 1) isMock = true;

            // Check if coordinates have more than 10 decimal places (common in fake apps)
            const latStr = latitude.toString();
            const lngStr = longitude.toString();
            if (latStr.split('.')[1]?.length > 13 || lngStr.split('.')[1]?.length > 13) isMock = true;
        }

        if (isMock) {
            Swal.fire({
                icon: 'error',
                title: 'Fake GPS Terdeteksi',
                text: 'Aplikasi mendeteksi penggunaan lokasi palsu. Harap gunakan lokasi asli untuk melakukan presensi.',
                confirmButtonColor: '#3f5f91'
            });
            btn.disabled = false; btn.innerText = 'KONFIRMASI PRESENSI';
            return;
        }

        btn.innerText = 'MEMPROSES DATA...';
        try {
            const res = await fetch('/api/absen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guru_id: state.user.id,
                    lat: latitude,
                    lng: longitude,
                    accuracy,
                    face_descriptor: faceDescriptor
                })
            });
            const data = await res.json();
            recentStatus.classList.remove('hidden');
            if (res.ok) {
                recentStatus.innerHTML = `
                    <div class="bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center">
                        <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-green-700 uppercase">Presensi Berhasil</p>
                            <p class="text-sm font-bold text-[#1a1c1e]">${data.status}</p>
                        </div>
                    </div>
                `;
                fetchTodayLog();
            } else {
                recentStatus.innerHTML = `
                    <div class="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center">
                        <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3 text-red-600 font-black">!</div>
                        <div>
                            <p class="text-[10px] font-black text-red-700 uppercase">Gagal Presensi</p>
                            <p class="text-sm font-bold text-[#1a1c1e]">${data.error}</p>
                        </div>
                    </div>
                `;
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Kesalahan Server', text: 'Gagal menghubungi server presensi.', confirmButtonColor: '#3f5f91' });
        }
        finally { btn.disabled = false; btn.innerText = 'KONFIRMASI PRESENSI'; }
    }, (err) => {
        Swal.fire({ icon: 'warning', title: 'GPS Tidak Aktif', text: 'Mohon aktifkan GPS dan berikan izin lokasi pada browser Anda.', confirmButtonColor: '#3f5f91' });
        btn.disabled = false; btn.innerText = 'KONFIRMASI PRESENSI';
    }, { enableHighAccuracy: true });
}

init();
