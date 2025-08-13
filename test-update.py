import requests

print("📁 Archivos actuales en servidor:")
response = requests.get("https://ffcheats-backend.onrender.com/api/admin/files", 
                       headers={'X-Admin-Token': 'Mario123'})

if response.status_code == 200:
    data = response.json()
    for file in data.get('files', []):
        print(f"   - {file['filename']} - {file['size']} - {file['modified_date']}")
else:
    print(f"❌ Error: {response.status_code}")
