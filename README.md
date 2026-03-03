# Panduan Pemasangan Aplikasi Absensi SDN Leling di Cloudflare

Ikuti langkah-langkah di bawah ini untuk memasang aplikasi ini secara gratis menggunakan Cloudflare Pages, D1 Database, dan R2 Object Storage.

## 1. Persiapan Database (Cloudflare D1)
1. Masuk ke Dashboard Cloudflare.
2. Buka menu **Workers & Pages** -> **D1**.
3. Klik **Create Database** -> **Dashboard**.
4. Beri nama database: `absensi-db` (atau nama lain).
5. Setelah dibuat, klik tab **Console**.
6. Salin dan tempel isi dari file `schema.sql` ke dalam konsol D1, lalu klik **Execute**. Ini akan membuat tabel-tabel yang diperlukan.

## 2. Persiapan Penyimpanan Foto (Cloudflare R2)
1. Buka menu **Workers & Pages** -> **R2**.
2. Klik **Create Bucket**.
3. Beri nama bucket: `absensi-storage`.
4. (Opsional) Anda tidak perlu mengaktifkan akses publik karena aplikasi menggunakan proxy API untuk mengambil foto.

## 3. Deployment ke Cloudflare Pages
1. Hubungkan repositori GitHub Anda ke Cloudflare Pages.
2. Buka menu **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Pilih repositori proyek ini.
4. Pada bagian **Build settings**:
   - Framework preset: `None`
   - Build command: (Kosongkan)
   - Build output directory: `.` (Titik, artinya root directory)
5. Klik **Save and Deploy**.

## 4. Menghubungkan D1 dan R2 ke Pages
Setelah deployment pertama selesai:
1. Masuk ke proyek Pages Anda di Dashboard.
2. Buka tab **Settings** -> **Functions**.
3. Cari bagian **D1 database bindings**:
   - Klik **Add binding**.
   - Variable name: `DB` (Harus huruf kapital).
   - D1 database: Pilih database `absensi-db` yang dibuat tadi.
4. Cari bagian **R2 bucket bindings**:
   - Klik **Add binding**.
   - Variable name: `R2` (Harus huruf kapital).
   - R2 bucket: Pilih bucket `absensi-storage` yang dibuat tadi.
5. Klik **Save**.
6. **Penting:** Anda harus melakukan **Redeploy** (Deploy ulang) agar binding tersebut aktif. Buka tab **Deployments**, klik titik tiga pada deploy terbaru, dan pilih **Retry deployment**.

## 5. Penggunaan Pertama Kali
- **URL Login:** Gunakan URL yang diberikan oleh Cloudflare Pages (misal: `https://absensi-xxx.pages.dev`).
- **Akun Admin:**
  - ID: `sdinleling@admin`
  - PIN: `Admin123`
- **Akun Guru (Contoh):**
  - ID: `G001`, PIN: `4821`
  - ID: `G002`, PIN: `1234`

## Catatan Lokasi & Waktu
- Lokasi sekolah saat ini diatur di: `-7.14872, 131.70819` dengan radius `20 meter`.
- Anda dapat mengubah lokasi dan jam absensi melalui menu **Jadwal & Lokasi** di Dashboard Admin.
- Pastikan HP Guru mengaktifkan **GPS** dan memberikan izin lokasi pada browser saat melakukan absensi.
