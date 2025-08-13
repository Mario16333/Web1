#!/usr/bin/env python3
"""
Script para probar el sistema de upload de archivos
"""

import requests
import os
import json

# Configuración
BACKEND_URL = "https://ffcheats-backend.onrender.com"
ADMIN_TOKEN = "Mario123"
TEST_FILE = "test-upload.txt"

def test_backend_connection():
    """Probar conexión al backend"""
    print("🔍 Probando conexión al backend...")
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/admin/stats",
            headers={
                "X-Admin-Token": ADMIN_TOKEN,
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend conectado correctamente")
            print(f"📊 Estadísticas: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Error de conexión: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error de red: {e}")
        return False

def test_file_listing():
    """Probar listado de archivos"""
    print("\n📁 Obteniendo lista de archivos...")
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/admin/files",
            headers={
                "X-Admin-Token": ADMIN_TOKEN,
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Lista de archivos obtenida")
            print(f"📋 Archivos: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Error obteniendo archivos: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error de red: {e}")
        return False

def test_file_upload():
    """Probar upload de archivo"""
    print(f"\n📤 Subiendo archivo: {TEST_FILE}")
    
    if not os.path.exists(TEST_FILE):
        print(f"❌ Archivo de prueba no encontrado: {TEST_FILE}")
        return False
    
    try:
        with open(TEST_FILE, 'rb') as f:
            files = {'file': (TEST_FILE, f, 'text/plain')}
            response = requests.post(
                f"{BACKEND_URL}/api/admin/files/upload",
                headers={"X-Admin-Token": ADMIN_TOKEN},
                files=files
            )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Archivo subido exitosamente")
            print(f"📄 Respuesta: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Error subiendo archivo: {response.status_code}")
            try:
                data = response.json()
                print(f"📄 Respuesta: {json.dumps(data, indent=2)}")
            except:
                print(f"📄 Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de red: {e}")
        return False

def test_file_delete(filename):
    """Probar eliminación de archivo"""
    print(f"\n🗑️ Eliminando archivo: {filename}")
    try:
        response = requests.delete(
            f"{BACKEND_URL}/api/admin/files/{filename}",
            headers={
                "X-Admin-Token": ADMIN_TOKEN,
                "Content-Type": "application/json"
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Archivo eliminado exitosamente")
            print(f"📄 Respuesta: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"❌ Error eliminando archivo: {response.status_code}")
            try:
                data = response.json()
                print(f"📄 Respuesta: {json.dumps(data, indent=2)}")
            except:
                print(f"📄 Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de red: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando tests del sistema de upload...")
    print("=" * 50)
    
    # Test 1: Conexión al backend
    if not test_backend_connection():
        print("❌ Falló la conexión al backend. Abortando tests.")
        return
    
    # Test 2: Listado de archivos
    test_file_listing()
    
    # Test 3: Upload de archivo
    if test_file_upload():
        # Test 4: Verificar que el archivo se subió
        print("\n🔄 Verificando que el archivo se subió...")
        test_file_listing()
        
        # Test 5: Eliminar archivo de prueba
        test_file_delete(TEST_FILE)
        
        # Test 6: Verificar que se eliminó
        print("\n🔄 Verificando que el archivo se eliminó...")
        test_file_listing()
    
    print("\n" + "=" * 50)
    print("🏁 Tests completados")

if __name__ == "__main__":
    main()
