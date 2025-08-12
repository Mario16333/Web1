import os
import time
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

import jwt
import requests
from flask import Flask, request, jsonify, send_from_directory, make_response, abort
from flask import send_file
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
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
DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", os.path.join(os.getcwd(), "downloads"))
COOKIE_NAME = "session"
ENVIRONMENT = os.getenv("ENV", "development")
IS_PROD = ENVIRONMENT.lower() == "production"

# Logging básico
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

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
            return jsonify({'ok': False, 'error': login_res.get('message', 'login failed')}), 401

        subscriptions = login_res.get('info', {}).get('subscriptions', [])
        resp = make_response({'ok': True, 'user': {'username': username, 'subscriptions': subscriptions}})
        set_jwt(resp, username, subscriptions)
        logger.info("login ok usuario=%s", username)
        return resp
    except requests.RequestException:
        logger.exception("KeyAuth unreachable")
        return jsonify({'ok': False, 'error': 'KeyAuth unreachable'}), 502
    except Exception as e:
        logger.exception("Error en /api/login")
        return jsonify({'ok': False, 'error': str(e)}), 500


@app.post('/api/logout')
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
    payload = get_jwt()
    if not payload:
        return jsonify({'ok': False}), 401
    return jsonify({'ok': True, 'user': {'username': payload['sub'], 'subscriptions': payload['roles']}})


@app.get('/download/<path:filename>')
@limiter.limit("20/hour")
def protected_download(filename):
    payload = get_jwt()
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
    return send_from_directory(DOWNLOAD_DIR, actual_name, as_attachment=True)


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


@app.get('/<path:asset>')
def assets(asset):
    # Bloquear acceso directo a la carpeta de descargas
    norm = os.path.normpath('/' + asset).lstrip('/')
    if norm.lower().startswith('downloads'):
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