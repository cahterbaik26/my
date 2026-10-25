# My Desktop Application

Generated automatically by **Web2App Builder** for website [https://my.uinponorogo.ac.id/](https://my.uinponorogo.ac.id/).

## Mesin Aplikasi & Otomasi GitHub Actions

Repositori ini telah dilengkapi dengan seluruh konfigurasi mesin:
- Template Electron (Chromium Sandbox & Context Isolation)
- electron-builder NSIS (.exe) dan macOS (.dmg, .app)
- GitHub Actions CI/CD Workflows

## Cara Menjalankan Secara Lokal

1. Pasang dependensi:
   ```bash
   npm install
   ```

2. Jalankan aplikasi Electron dalam mode pengembangan:
   ```bash
   npm start
   ```

## Cara Build Installer Lokal

- **Windows (.exe NSIS)**:
  ```bash
  npm run dist:win
  ```
- **macOS (.dmg & .app)**:
  ```bash
  npm run dist:mac
  ```

## Cara Build di GitHub Actions (Cloud Runner Gratis)

1. Buka tab **Actions** pada repositori GitHub ini.
2. Pilih alur kerja **Build Desktop Application (Windows)** atau **(macOS)**.
3. Klik tombol **Run workflow** -> **Run workflow**.
4. Setelah build selesai, unduh berkas installer pada bagian **Artifacts**!
