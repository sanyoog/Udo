#!/usr/bin/env python3
"""
Udo Launcher
Checks for Node.js, builds frontend if available, and starts Flask backend
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.absolute()
FRONTEND_DIR = PROJECT_ROOT / "frontend"
BACKEND_DIR = PROJECT_ROOT / "backend"
DIST_DIR = FRONTEND_DIR / "dist"


def print_header():
    """Print application header"""
    print("\n" + "="*50)
    print("  Udo - Local Task Management")
    print("="*50 + "\n")


def check_node():
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(
            ["node", "--version"],
            capture_output=True,
            text=True,
            check=False
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✓ Node.js found: {version}")
            return True
    except FileNotFoundError:
        pass
    
    print("✗ Node.js not found")
    return False


def check_python_dependencies():
    """Check if Python dependencies are installed"""
    try:
        import flask
        import flask_cors
        print("✓ Python dependencies installed")
        return True
    except ImportError:
        print("✗ Python dependencies missing")
        return False


def install_python_dependencies():
    """Install Python dependencies"""
    print("\nInstalling Python dependencies...")
    requirements_file = BACKEND_DIR / "requirements.txt"
    
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", str(requirements_file)],
            check=True
        )
        print("✓ Python dependencies installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("✗ Failed to install Python dependencies")
        return False


def build_frontend():
    """Build the frontend application"""
    print("\nBuilding frontend...")
    
    # Check if node_modules exists
    node_modules = FRONTEND_DIR / "node_modules"
    if not node_modules.exists():
        print("Installing frontend dependencies...")
        try:
            subprocess.run(
                ["npm", "install"],
                cwd=FRONTEND_DIR,
                check=True
            )
            print("✓ Frontend dependencies installed")
        except subprocess.CalledProcessError:
            print("✗ Failed to install frontend dependencies")
            return False
    
    # Build frontend
    try:
        subprocess.run(
            ["npm", "run", "build"],
            cwd=FRONTEND_DIR,
            check=True
        )
        print("✓ Frontend built successfully")
        return True
    except subprocess.CalledProcessError:
        print("✗ Failed to build frontend")
        return False


def start_backend():
    """Start the Flask backend server"""
    print("\nStarting Flask backend...")
    print("Backend will be available at: http://localhost:5000")
    
    if DIST_DIR.exists():
        print("Frontend will be served at: http://localhost:5000")
    else:
        print("Note: Frontend not built. Only API endpoints will be available.")
    
    print("\nPress Ctrl+C to stop the server\n")
    print("-" * 50 + "\n")
    
    # Start the Flask app as a module from the project root so
    # package-style imports like `from backend.file_manager` work
    try:
        subprocess.run(
            [sys.executable, "-m", "backend.app"],
            cwd=str(PROJECT_ROOT),
            check=True,
        )
    except KeyboardInterrupt:
        print("\n\nShutting down Udo...")
        print("Goodbye!")
    except subprocess.CalledProcessError:
        print("\n✗ Flask server encountered an error")
        sys.exit(1)


def main():
    """Main launcher function"""
    print_header()
    
    # Check Python dependencies
    if not check_python_dependencies():
        print("\nInstalling missing Python dependencies...")
        if not install_python_dependencies():
            print("\nError: Could not install Python dependencies")
            print("Please run: pip install -r backend/requirements.txt")
            sys.exit(1)
    
    # Check for Node.js and build frontend if available
    has_node = check_node()
    
    if has_node:
        # Check if frontend is already built
        if DIST_DIR.exists():
            print("✓ Frontend already built")
            rebuild = input("\nRebuild frontend? (y/N): ").lower().strip()
            if rebuild == 'y':
                if not build_frontend():
                    print("\nWarning: Frontend build failed, continuing with existing build...")
        else:
            if not build_frontend():
                print("\nWarning: Frontend build failed, starting backend only...")
    else:
        print("\nSkipping frontend build (Node.js not available)")
        print("Backend API will still be accessible")
    
    # Start the backend server
    start_backend()


if __name__ == "__main__":
    main()
