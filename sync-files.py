#!/usr/bin/env python3
"""
Script para sincronizar archivos del servidor con la carpeta local
"""

import os
import requests
import shutil

BACKEND_URL = "https://ffcheats-backend.onrender.com"
ADMIN_TOKEN = "Mario123"
LOCAL_DOWNLOADS = "downloads"

def download_file_from_server(filename):
    """Descargar archivo del servidor"""
    try:
        print(f"📥 Descargando {filename} del servidor...")
        
        # Obtener archivo del servidor
        response = requests.get(
            f"{BACKEND_URL}/download/{filename}",
            headers={'X-Admin-Token': ADMIN_TOKEN}
        )
        
        if response.status_code == 200:
            # Guardar en carpeta local
            file_path = os.path.join(LOCAL_DOWNLOADS, filename)
            with open(file_path, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ {filename} descargado exitosamente")
            return True
        else:
            print(f"❌ Error descargando {filename}: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error descargando {filename}: {e}")
        return False

def sync_files():
    """Sincronizar archivos del servidor con local"""
    print("🔄 Sincronizando archivos del servidor...")
    
    # Obtener lista de archivos del servidor
    response = requests.get(
        f"{BACKEND_URL}/api/admin/files",
        headers={'X-Admin-Token': ADMIN_TOKEN}
    )
    
    if response.status_code != 200:
        print(f"❌ Error obteniendo lista de archivos: {response.status_code}")
        return
    
    data = response.json()
    server_files = data.get('files', [])
    
    if not server_files:
        print("📁 No hay archivos en el servidor")
        return
    
    print(f"📁 Encontrados {len(server_files)} archivos en el servidor:")
    
    # Asegurar que existe la carpeta local
    if not os.path.exists(LOCAL_DOWNLOADS):
        os.makedirs(LOCAL_DOWNLOADS)
        print(f"📁 Creada carpeta {LOCAL_DOWNLOADS}")
    
    # Descargar cada archivo
    success_count = 0
    for file_info in server_files:
        filename = file_info['filename']
        print(f"   - {filename} ({file_info['size']})")
        
        if download_file_from_server(filename):
            success_count += 1
    
    print(f"\n📊 Sincronización completada: {success_count}/{len(server_files)} archivos descargados")
    
    if success_count == len(server_files):
        print("🎉 ¡Todos los archivos sincronizados correctamente!")
    else:
        print("⚠️  Algunos archivos no se pudieron descargar")

if __name__ == "__main__":
    sync_files()
