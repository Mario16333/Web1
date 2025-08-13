#!/usr/bin/env python3
"""
Script post-deploy para subir archivos automáticamente
Este script se puede ejecutar después de cada deploy
"""

import os
import sys
import requests
import time

def upload_files_after_deploy():
    """Subir archivos después del deploy"""
    
    BACKEND_URL = "https://ffcheats-backend.onrender.com"
    ADMIN_TOKEN = "Mario123"
    DOWNLOAD_DIR = "downloads"
    
    print("🚀 Post-deploy: Subiendo archivos al servidor...")
    
    # Verificar que existe la carpeta downloads
    if not os.path.exists(DOWNLOAD_DIR):
        print(f"❌ Carpeta {DOWNLOAD_DIR} no encontrada")
        return False
    
    # Obtener lista de archivos
    files = []
    for filename in os.listdir(DOWNLOAD_DIR):
        filepath = os.path.join(DOWNLOAD_DIR, filename)
        if os.path.isfile(filepath):
            files.append(filepath)
    
    if not files:
        print(f"❌ No hay archivos en {DOWNLOAD_DIR}")
        return False
    
    print(f"📁 Subiendo {len(files)} archivos...")
    
    # Subir archivos
    success_count = 0
    for filepath in files:
        try:
            filename = os.path.basename(filepath)
            print(f"📤 Subiendo {filename}...")
            
            with open(filepath, 'rb') as f:
                files_data = {'file': (filename, f, 'application/octet-stream')}
                headers = {'X-Admin-Token': ADMIN_TOKEN}
                
                response = requests.post(
                    f"{BACKEND_URL}/api/admin/files/upload",
                    files=files_data,
                    headers=headers
                )
                
            if response.status_code == 200:
                print(f"✅ {filename} subido exitosamente")
                success_count += 1
            else:
                print(f"❌ Error subiendo {filename}: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error subiendo {filename}: {e}")
        
        time.sleep(1)  # Pausa entre subidas
    
    print(f"📊 Post-deploy completado: {success_count}/{len(files)} archivos subidos")
    return success_count == len(files)

if __name__ == "__main__":
    success = upload_files_after_deploy()
    sys.exit(0 if success else 1)
