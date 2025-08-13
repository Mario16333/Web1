import requests
import json

# URL del servidor Render
BACKEND_URL = "https://ffcheats-backend.onrender.com"

def check_files():
    print("🔍 Verificando archivos en el servidor Render...")
    
    try:
        # Obtener lista de archivos
        response = requests.get(f"{BACKEND_URL}/api/admin/files", headers={
            'X-Admin-Token': 'Mario123'
        })
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Archivos encontrados:")
            for file in data.get('files', []):
                print(f"📁 {file['filename']}")
                print(f"   Tamaño: {file['size']}")
                print(f"   Fecha: {file['modified_date']}")
                print()
        else:
            print(f"❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error conectando al servidor: {e}")

if __name__ == "__main__":
    check_files()
