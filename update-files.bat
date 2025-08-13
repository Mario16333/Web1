@echo off
echo ========================================
echo    ACTUALIZADOR DE ARCHIVOS FFCheats
echo ========================================
echo.

echo 🔄 Actualizando metadatos de archivos...
python update_metadata.py

echo.
echo 📤 Subiendo cambios a GitHub...
git add downloads/
git add file_metadata.json
git commit -m "Update download files and metadata"
git push origin main

echo.
echo ✅ ¡Archivos actualizados exitosamente!
echo ⏱️  Render hará deploy automático en ~5-10 minutos
echo.
pause
