from waitress import serve
from app import app
import os

if __name__ == '__main__':
    host = '0.0.0.0'
    port = int(os.environ.get('PORT', 5002))
    
    if os.environ.get('FLASK_ENV') == 'development':
        print(f"Running in development mode at http://{host}:{port}")
        app.run(host=host, port=port, debug=True)
    else:
        print(f"Running in production mode at http://{host}:{port}")
        serve(app, host=host, port=port)