import os
import time
import hashlib
import logging
import json
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import jwt
import requests
from flask import Flask, request, jsonify, send_from_directory, make_response, abort
from flask import send_file
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from flask_cors import CORS
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración
KEYAUTH_API = os.getenv("KEYAUTH_API", "https://keyauth.win/api/1.2/")
APP_NAME = os.getenv("KEYAUTH_NAME", "Mariov2")
OWNER_ID = os.getenv("KEYAUTH_OWNERID", "fTZ9CKbZoq")
SECRET = os.getenv("KEYAUTH_SECRET", "cf7782a1cf26f900721a8e6f6c128702f01637dede1d7164e150b2185b10f7e7")
VERSION = os.getenv("KEYAUTH_VERSION", "1.0")
JWT_SECRET = os.getenv("JWT_SECRET", os.urandom(32))
# Usar directorio persistente en Render o local para desarrollo
if os.getenv("RENDER"):
    # En Render, usar directorio persistente
    DOWNLOAD_DIR = "/opt/render/project/src/persistent_downloads"
else:
    # En desarrollo local
    DOWNLOAD_DIR = os.path.join(os.getcwd(), "downloads")

COOKIE_NAME = "session"
ENVIRONMENT = os.getenv("ENV", "development")
IS_PROD = ENVIRONMENT.lower() == "production"

# Logging básico
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
logger = logging.getLogger(__name__)

# Crear directorio downloads si no existe
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)
    logger.info(f"Created downloads directory: {DOWNLOAD_DIR}")

app = Flask(__name__)

# Configurar CORS para permitir peticiones desde Netlify
CORS(app, origins=[
    'http://localhost:5000',
    'http://localhost:3000', 
    'https://*.netlify.app',
    'https://joyful-gumdrop-2b0692.netlify.app',
    'https://*.onrender.com'
], supports_credentials=True, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Rate limiting con almacenamiento opcional Redis
redis_url = os.getenv("REDIS_URL")
try:
    if redis_url:
        limiter = Limiter(key_func=get_remote_address, app=app, storage_uri=redis_url, default_limits=["200/hour"])  # límite global
        logger.info("Flask-Limiter usando Redis")
    else:
        limiter = Limiter(key_func=get_remote_address, app=app, default_limits=["200/hour"])  # memoria por defecto
        logger.warning("Flask-Limiter usando memoria (no recomendado en producción)")
except Exception as e:
    limiter = Limiter(key_func=get_remote_address, app=app, default_limits=["200/hour"])  # fallback
    logger.warning("Flask-Limiter fallback memoria: %s", e)

# Seguridad de cabeceras
Talisman(app,
    content_security_policy={
        'default-src': ["'self'"],
        'script-src': ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],  # sin 'unsafe-inline'
        'style-src': ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com', "'unsafe-inline'"],  # mantener inline CSS por ahora
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'data:'],
        'img-src': ["'self'", 'data:'],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
    },
    frame_options='DENY',
    strict_transport_security=IS_PROD,
    force_https=IS_PROD,
    referrer_policy='no-referrer'
)


def keyauth_request(req_type: str, **params):
    data = {
        'type': req_type,
        'name': APP_NAME,
        'ownerid': OWNER_ID,
        'secret': SECRET,
        'version': VERSION,
        **params,
    }
    r = requests.post(KEYAUTH_API, data=data, timeout=15)
    r.raise_for_status()
    payload = r.json()
    return payload


def set_jwt(response, username: str, subs: list):
    exp = datetime.now(timezone.utc) + timedelta(hours=6)
    token = jwt.encode({
        'sub': username,
        'roles': subs,
        'exp': exp
    }, JWT_SECRET, algorithm='HS256')
    response.set_cookie(
        COOKIE_NAME, token,
        httponly=True, secure=IS_PROD, samesite=('Strict' if IS_PROD else 'Lax'), max_age=6*3600, path='/'
    )


def get_jwt():
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except jwt.PyJWTError:
        return None


@app.post('/api/login')
@limiter.limit("10/minute")
def api_login():
    try:
        # CSRF header enforcement (defensa adicional)
        if request.headers.get('X-Requested-With') != 'XMLHttpRequest':
            return jsonify({'ok': False, 'error': 'Bad Request'}), 400
        body = request.get_json(force=True)
        username = (body.get('username') or '').strip()
        password = body.get('password') or ''
        if not username or not password:
            return jsonify({'ok': False, 'error': 'Missing credentials'}), 400
        
        # Verificar IP bloqueada
        client_ip = request.remote_addr
        if client_ip in blocked_ips:
            logger.warning(f"Intento de login desde IP bloqueada: {client_ip}")
            return jsonify({'ok': False, 'error': 'IP bloqueada'}), 403
        
        # Registrar intento de login
        login_log = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'username': username,
            'ip': client_ip,
            'user_agent': request.headers.get('User-Agent', ''),
            'status': 'pending'
        }
        security_logs.append(login_log)
        
        # También registrar en activity_logs para el dashboard
        activity_logs.append({
            'username': username,
            'ip': client_ip,
            'status': 'pending',
            'timestamp': datetime.now(),
            'action': 'Intento de login'
        })

        # init
        init_res = keyauth_request('init', **{'user': username, 'pass': password})
        if not init_res.get('success'):
            logger.info("init fallo para usuario=%s: %s", username, init_res.get('message'))
            return jsonify({'ok': False, 'error': init_res.get('message', 'init failed')}), 401
        sessionid = init_res.get('sessionid')

        # login
        login_res = keyauth_request('login', **{'sessionid': sessionid, 'username': username, 'pass': password})
        if not login_res.get('success'):
            logger.info("login fallo para usuario=%s: %s", username, login_res.get('message'))
            # Actualizar log con fallo
            if security_logs:
                security_logs[-1]['status'] = 'failed'
                security_logs[-1]['error'] = login_res.get('message', 'login failed')
            
            # Actualizar activity_logs
            if activity_logs:
                activity_logs[-1]['status'] = 'failed'
                activity_logs[-1]['action'] = f'Login fallido: {login_res.get("message", "login failed")}'
            
            return jsonify({'ok': False, 'error': login_res.get('message', 'login failed')}), 401

        subscriptions = login_res.get('info', {}).get('subscriptions', [])
        
        # Crear token JWT
        exp = datetime.now(timezone.utc) + timedelta(hours=6)
        token = jwt.encode({
            'sub': username,
            'roles': subscriptions,
            'exp': exp
        }, JWT_SECRET, algorithm='HS256')
        
        # Actualizar activity_logs con éxito
        if activity_logs:
            activity_logs[-1]['status'] = 'success'
            activity_logs[-1]['action'] = 'Login exitoso'
        
        resp = make_response({
            'ok': True, 
            'user': {'username': username, 'subscriptions': subscriptions},
            'token': token
        })
        set_jwt(resp, username, subscriptions)
        logger.info("login ok usuario=%s", username)
        
        # Actualizar log con éxito
        if security_logs:
            security_logs[-1]['status'] = 'success'
            security_logs[-1]['subscriptions'] = subscriptions
        
        return resp
    except requests.RequestException:
        logger.exception("KeyAuth unreachable")
        return jsonify({'ok': False, 'error': 'KeyAuth unreachable'}), 502
    except Exception as e:
        logger.exception("Error en /api/login")
        return jsonify({'ok': False, 'error': str(e)}), 500


@limiter.limit("30/hour")
def api_logout():
    if request.headers.get('X-Requested-With') != 'XMLHttpRequest':
        return jsonify({'ok': False, 'error': 'Bad Request'}), 400
    resp = make_response({'ok': True})
    resp.delete_cookie(COOKIE_NAME, path='/')
    return resp


@app.get('/api/me')
@limiter.limit("60/hour")
def api_me():
    # Intentar obtener token de cookies primero
    payload = get_jwt()
    
    # Si no hay token en cookies, intentar del header Authorization
    if not payload:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            except jwt.PyJWTError:
                pass
    
    if not payload:
        return jsonify({'ok': False}), 401
    return jsonify({'ok': True, 'user': {'username': payload['sub'], 'subscriptions': payload['roles']}})


@app.get('/download/<path:filename>')
@limiter.limit("20/hour")
def protected_download(filename):
    # Intentar obtener token de cookies primero
    payload = get_jwt()
    
    # Si no hay token en cookies, intentar del header Authorization
    if not payload:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            except jwt.PyJWTError:
                pass
    
    if not payload:
        abort(401)

    # Denegar path traversal
    safe_name = os.path.basename(filename)

    # Búsqueda case-insensitive del archivo
    try:
        files = os.listdir(DOWNLOAD_DIR)
    except FileNotFoundError:
        abort(404)
    lookup = {f.lower(): f for f in files}
    actual_name = lookup.get(safe_name.lower())
    if not actual_name:
        abort(404)

    file_path = os.path.join(DOWNLOAD_DIR, actual_name)
    if not os.path.isfile(file_path):
        abort(404)

    logger.info("descarga usuario=%s archivo=%s", payload.get('sub'), actual_name)
    
    # Obtener información del archivo para headers
    stat_info = os.stat(file_path)
    file_size = stat_info.st_size
    mod_time = datetime.fromtimestamp(stat_info.st_mtime)
    
    # Crear respuesta con headers para evitar cache
    response = send_from_directory(DOWNLOAD_DIR, actual_name, as_attachment=True)
    
    # Headers para evitar cache y mostrar información correcta
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    response.headers['Content-Length'] = str(file_size)
    response.headers['Last-Modified'] = mod_time.strftime('%a, %d %b %Y %H:%M:%S GMT')
    
    return response

@app.get('/api/file-info/<path:filename>')
@limiter.limit("60/hour")
def get_file_info(filename):
    """Endpoint para obtener información del archivo (tamaño, fecha de modificación)"""
    # Intentar obtener token de cookies primero
    payload = get_jwt()
    
    # Si no hay token en cookies, intentar del header Authorization
    if not payload:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            except jwt.PyJWTError:
                pass
    
    if not payload:
        return jsonify({'error': 'Unauthorized'}), 401

    # Denegar path traversal
    safe_name = os.path.basename(filename)

    # Búsqueda case-insensitive del archivo
    try:
        files = os.listdir(DOWNLOAD_DIR)
    except FileNotFoundError:
        return jsonify({'error': 'Directory not found'}), 404
    
    lookup = {f.lower(): f for f in files}
    actual_name = lookup.get(safe_name.lower())
    if not actual_name:
        return jsonify({'error': 'File not found'}), 404

    file_path = os.path.join(DOWNLOAD_DIR, actual_name)
    if not os.path.isfile(file_path):
        return jsonify({'error': 'File not found'}), 404

    try:
        # Obtener información del archivo
        stat_info = os.stat(file_path)
        file_size = stat_info.st_size
        
        # Siempre usar la fecha actual del archivo (no depender de metadatos)
        mod_time = datetime.fromtimestamp(stat_info.st_mtime)
        utc_time = mod_time.replace(tzinfo=timezone.utc)
        local_time = utc_time.astimezone(timezone(timedelta(hours=-5)))
        formatted_date = local_time.strftime('%d/%m/%Y, %H:%M:%S')
        
        # Formatear tamaño
        if file_size < 1024:
            size_str = f"{file_size} B"
        elif file_size < 1024 * 1024:
            size_str = f"{file_size / 1024:.1f} KB"
        else:
            size_str = f"{file_size / (1024 * 1024):.1f} MB"
        
        return jsonify({
            'filename': actual_name,
            'size': size_str,
            'size_bytes': file_size,
            'modified_date': formatted_date,
            'modified_timestamp': stat_info.st_mtime
        })
        
    except Exception as e:
        logger.error(f"Error getting file info for {filename}: {e}")
        return jsonify({'error': 'Error getting file info'}), 500


@app.get('/')
def root():
    # Servir login como landing
    resp = make_response(send_from_directory('.', 'login-simple.html'))
    resp.headers['Cache-Control'] = 'no-store'
    return resp


@app.get('/panel.html')
def panel():
    # Servir panel.html como landing
    resp = make_response(send_from_directory('.', 'panel.html'))
    resp.headers['Cache-Control'] = 'no-store'
    return resp


# Variables para logging de seguridad
security_logs = []
blocked_ips = set()
login_attempts = {}

# Logs de actividad para el dashboard
activity_logs = []

@app.get('/admin')
def admin_access():
    return send_from_directory('.', 'admin.html')

@app.get('/admin-dashboard')
def admin_dashboard():
    # Verificar token de admin (en producción usar JWT)
    admin_token = request.args.get('token')
    if admin_token != 'Mario123':
        abort(403)
    return send_from_directory('.', 'admin-dashboard.html')

@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    """Endpoint para estadísticas del dashboard de admin"""
    # Verificar token de admin
    admin_token = request.headers.get('X-Admin-Token')
    if admin_token != 'Mario123':
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Calcular estadísticas reales
    successful_logins = len([log for log in activity_logs if log.get('status') == 'success'])
    failed_logins = len([log for log in activity_logs if log.get('status') == 'failed'])
    blocked_ips = len(set([log.get('ip') for log in activity_logs if log.get('status') == 'blocked']))
    active_users = len(set([log.get('username') for log in activity_logs if log.get('status') == 'success' and (datetime.now() - log.get('timestamp', datetime.now())).seconds < 3600]))
    
    # Estadísticas de hoy
    today = datetime.now().date()
    logins_today = len([log for log in activity_logs if log.get('status') == 'success' and log.get('timestamp').date() == today])
    
    # Contador de descargas (simulado por ahora, se puede implementar real)
    total_downloads = 127  # Esto se puede hacer real
    
    # Tiempo promedio de sesión (simulado)
    avg_session_time = "15m"
    
    # Países activos (simulado, se puede implementar con geolocalización)
    active_countries = 3
    
    return jsonify({
        'successful_logins': successful_logins,
        'failed_logins': failed_logins,
        'blocked_ips': blocked_ips,
        'active_users': active_users,
        'logins_today': logins_today,
        'total_downloads': total_downloads,
        'avg_session_time': avg_session_time,
        'active_countries': active_countries,
        'recent_activity': activity_logs[-10:]  # Últimos 10 logs
    })

@app.route('/api/admin/logs', methods=['GET'])
def admin_logs():
    """Endpoint para obtener todos los logs"""
    admin_token = request.headers.get('X-Admin-Token')
    if admin_token != 'Mario123':
        return jsonify({'error': 'Unauthorized'}), 401
    
    return jsonify({'logs': activity_logs})

@app.route('/api/admin/logs', methods=['DELETE'])
def clear_admin_logs():
    """Endpoint para limpiar logs"""
    admin_token = request.headers.get('X-Admin-Token')
    if admin_token != 'Mario123':
        return jsonify({'error': 'Unauthorized'}), 401
    
    global activity_logs
    activity_logs.clear()
    return jsonify({'message': 'Logs cleared successfully'})

@app.route('/api/admin/files', methods=['GET'])
def get_files_info():
    """Endpoint para obtener información de archivos"""
    admin_token = request.headers.get('X-Admin-Token')
    if admin_token != 'Mario123':
        return jsonify({'error': 'Unauthorized'}), 401
    
    files_info = []
    try:
        for filename in os.listdir(DOWNLOAD_DIR):
            file_path = os.path.join(DOWNLOAD_DIR, filename)
            if os.path.isfile(file_path):
                stat_info = os.stat(file_path)
                file_size = stat_info.st_size
                
                # Formatear tamaño
                if file_size < 1024:
                    size_str = f"{file_size} B"
                elif file_size < 1024 * 1024:
                    size_str = f"{file_size / 1024:.1f} KB"
                else:
                    size_str = f"{file_size / (1024 * 1024):.1f} MB"
                
                # Obtener fecha de modificación (siempre actual)
                mod_time = datetime.fromtimestamp(stat_info.st_mtime)
                # Convertir a hora local (UTC-5 para Colombia)
                utc_time = mod_time.replace(tzinfo=timezone.utc)
                local_time = utc_time.astimezone(timezone(timedelta(hours=-5)))
                formatted_date = local_time.strftime('%d/%m/%Y, %H:%M:%S')
                
                files_info.append({
                    'filename': filename,
                    'size': size_str,
                    'size_bytes': file_size,
                    'modified_date': formatted_date,
                    'downloads': 0  # Esto se puede implementar real
                })
    except Exception as e:
        logger.error(f"Error getting files info: {e}")
        return jsonify({'error': 'Error getting files info'}), 500
    
    return jsonify({'files': files_info})

@app.route('/api/admin/files/upload', methods=['POST'])
def upload_file():
    """Endpoint para subir archivos"""
    admin_token = request.headers.get('X-Admin-Token')
    if admin_token != 'Mario123':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        logger.info("Upload request received")
        
        if 'file' not in request.files:
            logger.error("No file in request.files")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            logger.error("Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        logger.info(f"Processing file: {file.filename}")
        
        # Validar extensión
        allowed_extensions = {'.exe', '.zip', '.rar', '.7z', '.txt', '.pdf'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            logger.error(f"Invalid file extension: {file_ext}")
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Verificar que el directorio existe
        if not os.path.exists(DOWNLOAD_DIR):
            logger.info(f"Creating directory: {DOWNLOAD_DIR}")
            os.makedirs(DOWNLOAD_DIR)
        
        # Guardar archivo
        filename = file.filename
        file_path = os.path.join(DOWNLOAD_DIR, filename)
        logger.info(f"Saving file to: {file_path}")
        file.save(file_path)
        
        # Verificar que el archivo se guardó
        if not os.path.exists(file_path):
            logger.error(f"File was not saved: {file_path}")
            return jsonify({'error': 'File save failed'}), 500
        
        logger.info(f"File saved successfully: {filename}")
        
        # Actualizar metadatos (con manejo de errores)
        try:
            update_file_metadata()
            logger.info("Metadata updated successfully")
        except Exception as metadata_error:
            logger.error(f"Error updating metadata: {metadata_error}")
            # No fallar el upload por error en metadatos
        
        # Forzar actualización de metadatos del archivo específico
        try:
            metadata_file = os.path.join(os.getcwd(), 'file_metadata.json')
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
            else:
                metadata = {}
            
            # Actualizar metadatos del archivo subido
            stat_info = os.stat(file_path)
            mod_time = datetime.fromtimestamp(stat_info.st_mtime)
            utc_time = mod_time.replace(tzinfo=timezone.utc)
            local_time = utc_time.astimezone(timezone(timedelta(hours=-5)))
            formatted_date = local_time.strftime('%d/%m/%Y, %H:%M:%S')
            
            metadata[filename] = {
                "original_modified": local_time.isoformat(),
                "original_modified_formatted": formatted_date,
                "last_upload": datetime.now().isoformat(),
                "size": stat_info.st_size
            }
            
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            logger.info(f"File metadata updated for {filename}")
        except Exception as e:
            logger.error(f"Error updating file metadata: {e}")
        
        logger.info(f"File uploaded successfully: {filename}")
        return jsonify({'message': f'File {filename} uploaded successfully'})
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Error uploading file'}), 500

@app.route('/api/admin/files/<filename>', methods=['DELETE'])
def delete_file(filename):
    """Endpoint para eliminar archivos"""
    admin_token = request.headers.get('X-Admin-Token')
    if admin_token != 'Mario123':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        file_path = os.path.join(DOWNLOAD_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"File deleted: {filename}")
            return jsonify({'message': f'File {filename} deleted successfully'})
        else:
            return jsonify({'error': 'File not found'}), 404
            
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        return jsonify({'error': 'Error deleting file'}), 500

def update_file_metadata():
    """Función para actualizar metadatos de archivos"""
    metadata_file = os.path.join(os.getcwd(), 'file_metadata.json')
    
    # Cargar metadatos existentes
    if os.path.exists(metadata_file):
        with open(metadata_file, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
    else:
        metadata = {}
    
    # Verificar archivos en downloads/
    if os.path.exists(DOWNLOAD_DIR):
        for filename in os.listdir(DOWNLOAD_DIR):
            file_path = os.path.join(DOWNLOAD_DIR, filename)
            if os.path.isfile(file_path):
                stat_info = os.stat(file_path)
                file_size = stat_info.st_size
                mod_time = datetime.fromtimestamp(stat_info.st_mtime)
                
                # Convertir a hora local (UTC-5 para Colombia)
                utc_time = mod_time.replace(tzinfo=timezone.utc)
                local_time = utc_time.astimezone(timezone(timedelta(hours=-5)))
                formatted_date = local_time.strftime('%d/%m/%Y, %H:%M:%S')
                
                # Si el archivo no existe en metadatos o ha cambiado
                if filename not in metadata or metadata[filename].get('size') != file_size:
                    metadata[filename] = {
                        "original_modified": local_time.isoformat(),
                        "original_modified_formatted": formatted_date,
                        "last_upload": datetime.now().isoformat(),
                        "size": file_size
                    }
    
    # Guardar metadatos actualizados
    with open(metadata_file, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

@app.get('/<path:asset>')
def assets(asset):
    # Bloquear acceso directo a la carpeta de descargas (excepto a través del endpoint /download/)
    norm = os.path.normpath('/' + asset).lstrip('/')
    if norm.lower().startswith('downloads') and not asset.lower().startswith('download/'):
        abort(404)
    if os.path.isfile(asset):
        # Forzar MIME correcto para JS/CSS en Windows
        if asset.lower().endswith('.js'):
            return send_file(asset, mimetype='application/javascript')
        if asset.lower().endswith('.css'):
            return send_file(asset, mimetype='text/css')
        return send_from_directory('.', asset)
    abort(404)


@app.after_request
def set_security_headers(response):
    # Endurecer respuestas por defecto
    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('Permissions-Policy', "geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()")
    response.headers.setdefault('Cross-Origin-Opener-Policy', 'same-origin')
    return response


if __name__ == '__main__':
    # Usar puerto dinámico en hosting (Render/Railway/Fly.io)
    port = int(os.getenv('PORT', '5000'))
    app.run(host='0.0.0.0', port=port, debug=False)