# espeak patch for bundled executable

def setup_espeak():
    """Set up espeak environment for bundled application"""
    import os
    import sys
    import platform
    
    # Determine if we're running in a bundled app
    if getattr(sys, 'frozen', False):
        # Running in a PyInstaller bundle
        bundle_dir = sys._MEIPASS
        
        # Path to bundled espeak
        espeak_dir = os.path.join(bundle_dir, 'espeak')
        
        if os.path.exists(espeak_dir):
            print(f"Found bundled espeak at: {espeak_dir}")
            
            # Determine the correct executable name based on platform
            if platform.system() == 'Windows':
                espeak_exe = 'espeak.exe'
            else:
                espeak_exe = 'espeak'
            
            # Full path to the espeak executable
            espeak_path = os.path.join(espeak_dir, espeak_exe)
            
            if os.path.exists(espeak_path):
                # Make sure it's executable
                if platform.system() != 'Windows':
                    try:
                        os.chmod(espeak_path, 0o755)
                    except Exception as e:
                        print(f"Warning: Could not set executable permissions: {e}")
                
                # Set environment variables for TTS to find espeak
                os.environ['ESPEAK_LIBRARY'] = espeak_path
                os.environ['PATH'] = f"{espeak_dir}:{os.environ.get('PATH', '')}"
                
                print(f"Set up espeak environment: {espeak_path}")
                return True
        
        print("Warning: Bundled espeak not found")
    else:
        print("Not running in bundled mode, using system espeak")
    
    return False

# Set up espeak immediately
setup_espeak()
