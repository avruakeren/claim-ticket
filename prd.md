# 📝 Product Requirement Document (PRD)
## Project Name: Reva's Special Birthday Visual Novel Web

---

## 1. Overview & Objective
Proyek ini bertujuan untuk membuat sebuah website ucapan ulang tahun interaktif yang dipersonalisasi untuk **Reva**. Website ini mengadopsi estetika minimalis *retro game* / *visual novel* dengan mekanisme *typing effect* dan *Sound Effect* (SFX) teks bergaya game *Undertale*. 

Tujuan utamanya adalah memberikan kejutan berupa *prank* klaim tiket konser SEVENTEEN fiktif oleh member Mingyu, sebelum akhirnya diambil alih oleh kreator (**Avrua**) untuk menyampaikan ucapan ulang tahun yang *genuine* dan personal.

---

## 2. Target Audience & User Experience
*   **Target User:** Reva (Penggemar SEVENTEEN).
*   **Platform Utama:** *Mobile-first* (dioptimalkan untuk browser *smartphone* seperti Safari, Chrome mobile, atau WebView WhatsApp/LINE).
*   **Tone & Style:** Minimalis gelap (*pure black & white*), jenaka, kasual (`gw-lu`), misterius di awal, dan hangat di akhir.

---

## 3. Core Features & Functional Requirements

### FR-1: Multi-Phase Navigation & Logic
Sistem harus membagi alur website menjadi 3 fase utama dengan *state* layar yang berbeda:
1.  **Fase 0 (Landing Page):** Menampilkan ajakan klaim tiket utama.
2.  **Fase 1 (Mingyu Dialogue Page):** Dialog interaktif otomatis per klik (Langkah 1–7).
3.  **Fase 2 (Intermission Gate):** Tombol klaim kedua di tengah kotak dialog (Langkah 7b).
4.  **Fase 3 (Avrua Take Over Page):** Pengambilalihan sistem secara dramatis dan penyampaian pesan asli (Langkah 8–27).

### FR-2: Smart Typing Effect & Skip Mechanism
*   Teks di dalam kotak dialog harus muncul huruf demi huruf secara otomatis (kecepatan dasar sekitar 40–45 ms per karakter).
*   **Mekanik Skip:** Jika user mengetuk layar *saat animasi mengetik masih berjalan*, teks pada langkah tersebut harus langsung muncul penuh seketika, dan SFX berhenti. Ketukan berikutnya baru lanjut ke langkah selanjutnya.

### FR-3: Synthesized Retro SFX (Web Audio API)
*   Website **tidak boleh** bergantung pada file audio eksternal (`.mp3` atau `.wav`) untuk SFX ketikan guna menghindari *delay* pemuatan teks.
*   Suara bip harus di-generate secara digital via *Web Audio API* bawaan browser menggunakan tipe gelombang kotak (*square wave*).
*   **Pacing Suara:** Suara bip hanya boleh berbunyi jika karakter yang sedang diketik bukan spasi kosong (`" "`).
*   **Frekuensi & Kecepatan:** 
    *   *Normal Mode (Dialog Umum):* Frekuensi sekitar 110 Hz, tempo ketikan normal.
    *   *Alert Mode (Langkah 4 & 8):* Frekuensi bisa dibuat lebih variatif/cepat untuk memberikan efek panik/sistem.

---

## 4. UI/UX & Visual Specs (CSS Guideline)
*   **Color Palette:** Background `#000000` (Hitam pekat), Border & Text `#ffffff` (Putih bersih).
*   **Typography:** Wajib menggunakan font *monospaced* (`'Courier New', Courier, monospace`) untuk mempertahankan *vibe* retro.
*   **Layouting:**
    *   `game-frame`: Maksimal lebar 450 px, tinggi 85vh–90vh, terpusat di tengah layar (*flex/grid*).
    *   `emoji-circle`: Berbentuk lingkaran sempurna (border putih) di area atas untuk menampung visual/avatar.
    *   `dialog-box`: Kotak persegi panjang di area bawah dengan indikator panah segitiga terbalik (`▽`) di pojok kanan bawah yang hanya berkedip (*blinking animation*) ketika teks pada langkah tersebut telah selesai diketik seluruhnya.

---

## 5. Content Script Mapping (The Data Array)

Data dialog disimpan dalam struktur *array* JavaScript dua dimensi `[Visual/Emoji, Teks]` sebagai berikut:

```javascript
// Fase 1: Mingyu Dialogue
1.  ["🐶", "tes, tes... satu, dua. apakah gw sedang berbicara dengan si reva?"]
2.  ["🐶", "haloo ini gw mingyu"]
3.  ["🐶", "hmmmm....."]
4.  ["🚨", "selamat! kamu memenangkan 1x VIP Tiket SEVENTEEN World Tour 2028 di ICE BSD!"] // SFX Cepat
5.  ["🐶", "tapi karena ini tiket jalur gaib, pas lu dateng nanti ke konsernya tinggal bilang aja ke satpam..."]
6.  ["🐶", "lu bilang gini: 'pak, saya temennya mingyu' nanti lu bakal langsung disuruh masuk kok"]
7.  ["😜", "kayaknya..."]

// Fase 2: Intermission Gate (Tombol: [ AMBIL TIKET ASLI LO DI SINI ])

// Fase 3: Avrua Take Over
8.  ["💻", "tes tes...\n[ AVRUA TAKE OVER ALERT ] 🚨"] // Glitch Effect
9.  ["🤫", "sorry mingyu udah gua kick"]
10. ["✨", "gw mau bilang.."]
11. ["🎉", "selamat ulang tahun, dan.."]
12. ["🥂", "..thanks for letting me yap every day"]
13. ["🤍", "thanks for being such a pure person"]
14. ["😊", "it's so much fun talking to you"]
15. ["🥰", "i could literally talk to you for hours and never get bored, asal lu tau"]
16. ["🥺", "pleaseeeee, i hope you never change"]
17. ["😜", "sengaja inggris biar ga alay cok wkwk"]
18. ["🙄", "lu mah tetep bakal bilang alay sih"]
19. ["🤦‍♂️", "anjir lah"]
20. ["😢", "intinya gua sedih sih kalo dicuekin"]
21. ["❄️", "kemaren aja cuaca dingin bgt"]
22. ["🧣", "lu mah jangan sampe dingin ke gua cok"]
23. ["🤫", "gitu deehh"]
24. ["🎂", "once again, happy birthday! enjoy your special day to the fullest!"]
25. ["🎯", "i hope this year brings you closer to all your goals"]
26. ["💰", "gw doain semoga lu kaya raya"]
27. ["🙏", "aamiiinn"]
```

---

## 6. Technical Implementation Notes (JavaScript Logic Flow)
1.  **Initialization:** Saat dokumen dimuat, pasang `EventListener` pada tombol pertama. Pastikan *AudioContext* diinisialisasi setelah interaksi user (klik pertama) untuk mematuhi kebijakan keamanan browser terkait *autoplay audio*.
2.  **State Management:** Gunakan variabel *integer* (misal `currentStep`) untuk melacak posisi dialog. Saat `currentStep == 7`, ubah DOM secara dinamis untuk menyembunyikan kontainer visual novel dan memunculkan tombol fase jeda.
3.  **Clean Up:** Pastikan setiap perpindahan langkah dialog, fungsi `clearTimeout()` dipanggil agar animasi ketikan sebelumnya tidak bertumpukan (*race condition*).