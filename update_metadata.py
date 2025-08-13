#!/usr/bin/env python3
"""
Script para actualizar metadatos de archivos cuando se suben nuevos archivos
"""

import os
import json
import time
from datetime import datetime, timezone, timedelta

def update_file_metadata():
    """Actualiza los metadatos de los archivos en downloads/"""
    
    downloads_dir = "downloads"
    metadata_file = "file_metadata.json"
    
    # Cargar metadatos existentes
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    else:
        metadata = {}
    
    # Verificar archivos en downloads/
    if os.path.exists(downloads_dir):
        for filename in os.listdir(downloads_dir):
            file_path = os.path.join(downloads_dir, filename)
            if os.path.isfile(file_path):
                # Obtener información del archivo
                stat_info = os.stat(file_path)
                file_size = stat_info.st_size
                mod_time = datetime.fromtimestamp(stat_info.st_mtime)
                
                # Convertir a hora local (UTC-5 para Colombia)
                utc_time = mod_time.replace(tzinfo=timezone.utc)
                local_time = utc_time.astimezone(timezone(timedelta(hours=-5)))
                formatted_date = local_time.strftime('%d/%m/%Y, %H:%M:%S')
                
                # Si el archivo no existe en metadatos o ha cambiado
                if filename not in metadata or metadata[filename].get('size') != file_size:
                    print(f"📁 Actualizando metadatos para: {filename}")
                    
                    metadata[filename] = {
                        "original_modified": local_time.isoformat(),
                        "original_modified_formatted": formatted_date,
                        "last_upload": datetime.now().isoformat(),
                        "size": file_size
                    }
                else:
                    print(f"✅ {filename} - Sin cambios")
    
    # Guardar metadatos actualizados
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Metadatos guardados en: {metadata_file}")

if __name__ == "__main__":
    update_file_metadata()
