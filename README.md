# PixelFX - Digital Signal Processing Application

PixelFX is a web-based application for processing and manipulating digital images using various signal processing techniques. It provides an intuitive interface for applying different filters and effects to images.

## Features

- **Image Processing**: Apply various filters and effects to your images
- **Real-time Visualization**: See results as you adjust parameters
- **Web-based Interface**: Access from any device with a web browser
- **Client-Server Architecture**: Separation of UI and processing logic
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Libraries**: 
  - NumPy for numerical computing
  - Pillow for image processing
  - Flask-CORS for cross-origin resource sharing

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Salah-Tamer/PixelFx.git
cd PixelFX
```

### 2. Create a Virtual Environment

```bash
# For Unix/Linux/macOS
python3 -m venv venv
source venv/bin/activate

# For Windows (Command Prompt)
python -m venv venv
venv\Scripts\activate

# For Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

```bash
pip install -r PixelFX/requirements.txt
```

### 4. Run the Application

```bash
cd PixelFX
python wsgi.py
```

The application will be available at `http://localhost:5002` (or the port specified in the configuration).

## Project Structure

```
PixelFX/
├── Client/               # Frontend code
│   ├── static/           # Static assets (CSS, JS, images)
│   └── templates/        # HTML templates
├── Server/               # Backend code
│   ├── effects.py        # Image processing effects
│   └── main.py           # Server entry point
├── requirements.txt      # Python dependencies
├── wsgi.py               # WSGI entry point
└── vercel.json           # Vercel deployment config
```

## Weekly Tasks

The project includes a series of weekly tasks in the WeeklyTasks directory that track the development progress and learning objectives throughout the course.