import requests
import json

# URL del servidor Render
BACKEND_URL = "https://ffcheats-backend.onrender.com"

def test_file_info():
    print("🔍 Probando endpoint /api/file-info/...")
    
    # Primero hacer login para obtener token
    login_data = {
        "username": "mELL",  # Usar el usuario que aparece en la imagen
        "password": "test123"  # Contraseña de prueba
    }
    
    try:
        # Login
        print("🔐 Intentando login...")
        login_response = requests.post(f"{BACKEND_URL}/api/login", 
                                     json=login_data,
                                     headers={'X-Requested-With': 'XMLHttpRequest'})
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            if login_result.get('ok'):
                token = login_result.get('token')
                print(f"✅ Login exitoso, token obtenido")
                
                # Probar endpoint de file-info
                print("\n📁 Probando /api/file-info/Loader.exe...")
                file_info_response = requests.get(f"{BACKEND_URL}/api/file-info/Loader.exe",
                                                headers={
                                                    'X-Requested-With': 'XMLHttpRequest',
                                                    'Authorization': f'Bearer {token}'
                                                })
                
                print(f"Status: {file_info_response.status_code}")
                if file_info_response.status_code == 200:
                    file_data = file_info_response.json()
                    print("✅ Datos del archivo:")
                    print(f"   Nombre: {file_data.get('filename')}")
                    print(f"   Tamaño: {file_data.get('size')}")
                    print(f"   Fecha: {file_data.get('modified_date')}")
                else:
                    print(f"❌ Error: {file_info_response.text}")
            else:
                print(f"❌ Login falló: {login_result.get('error')}")
        else:
            print(f"❌ Error en login: {login_response.status_code}")
            print(login_response.text)
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_file_info()
