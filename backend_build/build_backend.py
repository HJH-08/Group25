import os
import sys
import platform
import subprocess
import shutil
from pathlib import Path

# Define constants
APP_NAME = "Companio-Backend"
ENTRY_POINT = "../templates/app.py"
TEMPLATES_DIR = "../templates"
BIN_DIR = os.path.join(TEMPLATES_DIR, "bin")
ENV_FILE = os.path.join(TEMPLATES_DIR, ".env")

# Determine platform-specific settings
IS_MAC = platform.system() == "Darwin"
IS_WINDOWS = platform.system() == "Windows"
IS_LINUX = platform.system() == "Linux"

# Determine qdrant binary name based on platform
if IS_WINDOWS:
    QDRANT_BINARY = "qdrant.exe"
elif IS_MAC:
    QDRANT_BINARY = "qdrant-macos"
else:  # Linux
    QDRANT_BINARY = "qdrant-linux"

QDRANT_PATH = os.path.join(BIN_DIR, QDRANT_BINARY)

def prepare_tts_model():
    """Download and prepare the TTS model if needed"""
    try:
        from TTS.api import TTS
        
        # Check if model is already downloaded, if not download it
        model_name = "tts_models/en/vctk/vits"
        
        # Try to load the model - this will download it if it doesn't exist
        print(f"Checking TTS model ({model_name})...")
        TTS(model_name, progress_bar=True)
        print("TTS model is ready.")
        
        # Get the model path for reference in the spec file
        import huggingface_hub
        
        # Model cache path will be used in the spec file
        model_cache = huggingface_hub.constants.HUGGINGFACE_HUB_CACHE
        print(f"Model cache location: {model_cache}")
        return model_cache
        
    except ImportError:
        print("Warning: Unable to prepare TTS models. Please install the required packages first.")
        print("Run: pip install -r templates/templates_requirements.txt")
        return None
    except Exception as e:
        print(f"Error preparing TTS model: {e}")
        return None

def check_dependencies():
    """Check if all dependencies are installed"""
    requirements_file = os.path.join(TEMPLATES_DIR, "templates_requirements.txt")
    
    # Map package names to their import names when they differ
    import_map = {
        "python-dotenv": "dotenv",
        "Requests": "requests",
        "tts": "TTS",
        "azure-cognitiveservices-speech": "azure.cognitiveservices.speech",
        "azure.search": "azure.search.documents",
        "fastembed": "fastembed"
    }
    
    try:
        with open(requirements_file, 'r') as f:
            requirements = [
                line.split('//')[0].strip()  # Remove comments
                for line in f.readlines() 
                if line.strip() and not line.strip().startswith('//')
            ]
        
        print("Checking dependencies...")
        missing_deps = []
        
        for req in requirements:
            if req and not req.startswith('#'):
                try:
                    package_name = req.split('==')[0].strip()
                    # Use the import map if available, otherwise use the package name
                    import_name = import_map.get(package_name, package_name.replace('-', '_'))
                    
                    # Handle dotted imports (like azure.cognitiveservices.speech)
                    if '.' in import_name:
                        base_module = import_name.split('.')[0]
                        __import__(base_module)
                    else:
                        __import__(import_name)
                        
                except ImportError:
                    missing_deps.append(req)
        
        if missing_deps:
            print("Missing dependencies:")
            for dep in missing_deps:
                print(f"  - {dep}")
            print("\nPlease install them with:")
            print(f"pip install -r {requirements_file}")
            return False
            
        return True
        
    except Exception as e:
        print(f"Error checking dependencies: {e}")
        return False

def create_tts_hook():
    """Create a hook file for TTS package"""
    hook_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "hook-TTS.py")
    
    with open(hook_path, 'w') as f:
        f.write("""# hook-TTS.py
from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs
import os
import TTS

# Find the TTS package directory
tts_package_dir = os.path.dirname(TTS.__file__)

# Collect VERSION file
datas = [(os.path.join(tts_package_dir, 'VERSION'), 'TTS')]

# Collect all TTS data files
tts_data_files = collect_data_files('TTS')
datas.extend(tts_data_files)

# Collect any dynamic libraries used by TTS
binaries = collect_dynamic_libs('TTS')
""")
    
    print(f"Created TTS hook file: {hook_path}")
    
    # Create hooks directory
    hooks_dir = os.path.join(os.path.abspath(os.path.dirname(__file__)), "hooks")
    os.makedirs(hooks_dir, exist_ok=True)
    
    # Copy the hook to the hooks directory
    hook_copy_path = os.path.join(hooks_dir, "hook-TTS.py")
    shutil.copy(hook_path, hook_copy_path)
    
    return hooks_dir

def create_runtime_hook():
    """Create a runtime hook to set up environment correctly at startup"""
    hook_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "hook-companio.py")
    
    with open(hook_path, 'w') as f:
        f.write("""import os
import sys
import tempfile
import appdirs
from pathlib import Path

def setup_runtime_environment():
    # Set up application constants
    app_name = "Companio"
    app_author = "Group25"
    
    # Get the application data directory in the user's documents/app data
    app_data_dir = appdirs.user_data_dir(app_name, app_author)
    
    # Create paths for Qdrant data
    qdrant_data_dir = os.path.join(app_data_dir, "qdrant")
    qdrant_storage_dir = os.path.join(qdrant_data_dir, "data")
    qdrant_snapshots_dir = os.path.join(qdrant_data_dir, "snapshots")
    
    # Create the directories if they don't exist
    os.makedirs(qdrant_storage_dir, exist_ok=True)
    os.makedirs(qdrant_snapshots_dir, exist_ok=True)
    
    # Find the root directory for the frozen application
    if getattr(sys, 'frozen', False):
        # Running as a bundled executable
        app_dir = os.path.dirname(sys.executable)
    else:
        # Running in development mode
        app_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Adjust environment variables to point to our data locations
    os.environ['QDRANT_STORAGE_PATH'] = qdrant_storage_dir
    os.environ['COMPANIO_APP_DIR'] = app_data_dir
    
    # Print diagnostic information
    print(f"Companio application directory: {app_data_dir}")
    print(f"Qdrant storage directory: {qdrant_storage_dir}")
    
    # Add the templates directory to the Python path
    if getattr(sys, 'frozen', False):
        templates_dir = os.path.join(app_dir, "templates")
        if templates_dir not in sys.path:
            sys.path.append(templates_dir)

# Run the setup
setup_runtime_environment()
""")
    
    print(f"Created runtime hook: {hook_path}")
    return hook_path

def copy_version_files():
    """Copy VERSION files to the PyInstaller working directory"""
    from importlib import import_module
    import tempfile
    import pkg_resources
    
    # Create temporary directory for VERSION files
    temp_dir = tempfile.mkdtemp()
    version_files = {}
    
    # List of packages that need VERSION files
    packages = ["TTS", "trainer", "gruut"]  # Added gruut
    
    for package in packages:
        try:
            # Try to import the package
            module = import_module(package)
            package_dir = os.path.dirname(module.__file__)
            version_file = os.path.join(package_dir, "VERSION")
            
            # If VERSION file exists, copy it
            if os.path.exists(version_file):
                target_dir = os.path.join(temp_dir, package)
                os.makedirs(target_dir, exist_ok=True)
                target_file = os.path.join(target_dir, "VERSION")
                shutil.copy(version_file, target_file)
                version_files[package] = (version_file, f"{package}")
                print(f"Found and copied VERSION file for {package}")
            else:
                # Create dummy VERSION file
                target_dir = os.path.join(temp_dir, package)
                os.makedirs(target_dir, exist_ok=True)
                dummy_file = os.path.join(target_dir, "VERSION")
                with open(dummy_file, "w") as f:
                    f.write("0.0.0")
                version_files[package] = (dummy_file, f"{package}")
                print(f"Created dummy VERSION file for {package}")
                
        except (ImportError, AttributeError) as e:
            print(f"Warning: Cannot find package {package} - {e}")
            # Create dummy VERSION file
            target_dir = os.path.join(temp_dir, package)
            os.makedirs(target_dir, exist_ok=True)
            dummy_file = os.path.join(target_dir, "VERSION")
            with open(dummy_file, "w") as f:
                f.write("0.0.0")
            version_files[package] = (dummy_file, f"{package}")
            print(f"Created dummy VERSION file for {package}")
    
    return version_files, temp_dir

def create_spec_file(tts_model_path, hook_file, hooks_dir, version_files, tts_patch_file, torch_libs=None, source_patch_file=None, qdrant_patch_file=None, espeak_dir=None):
    """Create a PyInstaller spec file for the application"""
    
    # Get application directory (to set paths correctly)
    app_dir = os.path.abspath(os.path.dirname(__file__))
    
    # Set executable name based on platform
    exe_extension = ".exe" if IS_WINDOWS else ""
    executable_name = f"{APP_NAME}{exe_extension}"
    
    # Prepare datas to include
    datas = [
        # Include the .env file
        (ENV_FILE, '.'),
        # Include the Qdrant binary with the correct path structure
        (QDRANT_PATH, 'templates/bin'),  # This preserves templates/bin/qdrant-macos structure
    ]
    
    # Add VERSION files
    for package, (file_path, target_dir) in version_files.items():
        datas.append((file_path, target_dir))
    
    # If TTS model path is provided, include it
    if tts_model_path:
        datas.append((tts_model_path, 'huggingface'))
    
    # Add espeak if provided
    if espeak_dir:
        datas.append((espeak_dir, 'espeak'))
    
    # Format the datas array for the spec file
    datas_str = ", ".join([f"('{item[0]}', '{item[1]}')" for item in datas])
    
    # Format the binaries array for PyTorch libraries
    binaries_str = ""
    if torch_libs:
        binaries_str = ", ".join([f"('{item[0]}', '{item[1]}')" for item in torch_libs])
    
    # Prepare runtime hooks list
    runtime_hooks = [f"'{hook_file}'", f"'{tts_patch_file}'"]
    if source_patch_file:
        runtime_hooks.append(f"'{source_patch_file}'")
    
    runtime_hooks_str = ", ".join(runtime_hooks)
    
    # Write the spec file
    spec_file_path = os.path.join(app_dir, f"{APP_NAME}.spec")
    
    with open(spec_file_path, 'w') as f:
        f.write(f"""# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from pathlib import Path

# Add the templates directory to the Python path
templates_dir = os.path.join(SPECPATH, '{TEMPLATES_DIR}')
if templates_dir not in sys.path:
    sys.path.append(templates_dir)

block_cipher = None

added_files = [{datas_str}]
""")

        # Add torch libraries if available
        if torch_libs:
            f.write(f"""
# Add PyTorch libraries
torch_libs = [{binaries_str}]
""")
        else:
            f.write("""
# No extra PyTorch libraries
torch_libs = []
""")

        f.write(f"""
a = Analysis(
    ['{ENTRY_POINT}'],
    pathex=[SPECPATH],
    binaries=torch_libs,
    datas=added_files,
    hiddenimports=[
        'semantic_kernel',
        'semantic_kernel.connectors',
        'semantic_kernel.contents',
        'semantic_kernel.functions',
        'semantic_kernel.data',
        'semantic_kernel.connectors.ai.open_ai',
        'qdrant_client',
        'fastapi',
        'uvicorn',
        'TTS',
        'TTS.api',
        'trainer',
        'sounddevice',
        'torchaudio',
        'torch',
        'torch.nn',
        'torch.backends',
        'torch.backends.cudnn',
        'torch.backends.mps',
        'torch.utils',
        'torch.distributions',
        'torch.optim',
        'torch.jit',
        'transformers',
        'azure.cognitiveservices.speech',
        'huggingface_hub',
        'fastembed',
        'pydantic',
        'appdirs',
        'inflect',  # Added inflect
        'typeguard',  # Added typeguard
        'typeguard._decorators',  # Added typeguard internals
        'gruut',  # Added gruut
        'jamo',
    ],
    hookspath=['{hooks_dir}'],  # Include the hooks directory
    hooksconfig={{}},
    runtime_hooks=[{runtime_hooks_str}],  # Include all runtime hooks
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='{executable_name}',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='{APP_NAME}',
)
""")
    
    print(f"Created spec file: {spec_file_path}")
    return spec_file_path

def build_application(spec_file):
    """Build the application using PyInstaller"""
    try:
        # Install appdirs if not already installed
        subprocess.run([sys.executable, "-m", "pip", "install", "appdirs"], check=True)
        
        # Create paths for workpath and distpath in parent directory
        parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
        workpath = os.path.join(parent_dir, "build")
        distpath = os.path.join(parent_dir, "dist")
        
        # Run PyInstaller with the spec file and custom paths
        cmd = [
            sys.executable, 
            "-m", "PyInstaller",
            "--clean",
            "--workpath", workpath,
            "--distpath", distpath,
            spec_file
        ]
        
        print("Building application with PyInstaller:")
        print(" ".join(cmd))
        
        subprocess.run(cmd, check=True)
        
        print(f"\nBuild successful! The executable is in the {distpath}/{APP_NAME} directory.")
        
    except subprocess.CalledProcessError as e:
        print(f"Error building application: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error during build: {e}")
        return False
    
    return True, distpath

def create_trainer_hook(hooks_dir):
    """Create a hook file for trainer package"""
    hook_path = os.path.join(hooks_dir, "hook-trainer.py")
    
    with open(hook_path, 'w') as f:
        f.write("""# hook-trainer.py
from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs
import os
import sys
from pathlib import Path
import site
import tempfile

# Try to find the trainer package
try:
    import trainer
    trainer_path = os.path.dirname(trainer.__file__)
    datas = [(os.path.join(trainer_path, 'VERSION'), 'trainer')]
except ImportError:
    # If trainer is not directly importable, try to find it in site-packages
    site_packages = site.getsitepackages()
    
    trainer_found = False
    for sp in site_packages:
        trainer_path = os.path.join(sp, 'trainer')
        version_file = os.path.join(trainer_path, 'VERSION')
        if os.path.exists(trainer_path) and os.path.isdir(trainer_path):
            if os.path.exists(version_file):
                datas = [(version_file, 'trainer')]
                trainer_found = True
                break
    
    if not trainer_found:
        # Create a dummy VERSION file
        print("Warning: trainer package VERSION file not found, creating a dummy file")
        temp_dir = tempfile.mkdtemp()
        dummy_version = os.path.join(temp_dir, "VERSION")
        with open(dummy_version, "w") as f:
            f.write("0.0.0")
        datas = [(dummy_version, 'trainer')]
""")
    
    print(f"Created trainer hook file: {hook_path}")
    return hook_path

def create_tts_patch():
    """Create a patch file for TTS to work around PyInstaller limitations"""
    patch_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "tts_patch.py")
    
    with open(patch_path, 'w') as f:
        f.write("""# TTS patch to disable TorchScript

def apply_patches():
    \"\"\"Apply patches to TTS library to work around PyInstaller issues\"\"\"
    import sys
    import os
    
    # Force disable PyTorch JIT
    os.environ['PYTORCH_JIT'] = '0'
    os.environ['TORCH_DISABLE_JIT_TRACING'] = '1'
    
    # Try to patch TTS wavenet module
    try:
        from TTS.tts.layers.generic import wavenet
        
        # Check if the module has already been patched
        if not hasattr(wavenet, '_original_fused_add_tanh_sigmoid_multiply'):
            # Save original function
            wavenet._original_fused_add_tanh_sigmoid_multiply = wavenet.fused_add_tanh_sigmoid_multiply
            
            # Replace with non-scripted version
            import torch
            def non_scripted_fused_add_tanh_sigmoid_multiply(input_a, input_b, n_channels):
                n_channels_int = n_channels
                in_act = input_a + input_b
                t_act = torch.tanh(in_act[:, :n_channels_int, :])
                s_act = torch.sigmoid(in_act[:, n_channels_int:, :])
                acts = t_act * s_act
                return acts
            
            # Replace the scripted function
            wavenet.fused_add_tanh_sigmoid_multiply = non_scripted_fused_add_tanh_sigmoid_multiply
            
            print("TTS wavenet module patched successfully")
            
    except Exception as e:
        print(f"Warning: Could not patch TTS wavenet module: {e}")

# Apply patches immediately
apply_patches()
""")
    
    print(f"Created TTS patch file: {patch_path}")
    return patch_path

def create_torch_hook(hooks_dir):
    """Create a hook file for PyTorch package"""
    hook_path = os.path.join(hooks_dir, "hook-torch.py")
    
    with open(hook_path, 'w') as f:
        f.write("""# hook-torch.py
from PyInstaller.utils.hooks import collect_all, collect_submodules, copy_metadata

# Collect everything related to torch
datas, binaries, hiddenimports = collect_all('torch')

# Add specific libs that might be missed
import torch
import os

torch_path = os.path.dirname(torch.__file__)
torch_lib_path = os.path.join(torch_path, 'lib')

if os.path.exists(torch_lib_path):
    for lib_file in os.listdir(torch_lib_path):
        if lib_file.endswith('.so') or lib_file.endswith('.dylib') or lib_file.endswith('.dll'):
            binaries.append((os.path.join(torch_lib_path, lib_file), 'torch/lib'))

# Include MPS backend for Mac
if os.path.exists(os.path.join(torch_path, 'backends', 'mps')):
    hiddenimports.extend(['torch.backends.mps'])
""")
    
    print(f"Created PyTorch hook file: {hook_path}")
    return hook_path

def prepare_torch_libs():
    """Copy PyTorch libraries to ensure they can be found by PyInstaller"""
    import torch
    import os
    import shutil
    
    torch_path = os.path.dirname(torch.__file__)
    torch_lib_path = os.path.join(torch_path, 'lib')
    
    if not os.path.exists(torch_lib_path):
        print(f"Warning: PyTorch library path not found at {torch_lib_path}")
        return
    
    # Create a directory for our temporary libs
    temp_lib_dir = os.path.join(os.path.dirname(__file__), "torch_libs")
    os.makedirs(temp_lib_dir, exist_ok=True)
    
    # Copy all libraries
    lib_files = []
    for lib_file in os.listdir(torch_lib_path):
        if lib_file.endswith('.so') or lib_file.endswith('.dylib') or lib_file.endswith('.dll'):
            src_path = os.path.join(torch_lib_path, lib_file)
            dst_path = os.path.join(temp_lib_dir, lib_file)
            shutil.copy2(src_path, dst_path)
            lib_files.append((dst_path, 'torch/lib'))
    
    print(f"Copied {len(lib_files)} PyTorch libraries to {temp_lib_dir}")
    return lib_files

def create_source_patch():
    """Create a patch for Python's inspect module to fix source code access issues"""
    patch_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "source_patch.py")
    
    with open(patch_path, 'w') as f:
        f.write("""\"\"\"Patch for Python's inspect module to handle missing source code access\"\"\"
import sys
import inspect
import types
import os

# Force disable typeguard's type checking at the environment level
os.environ['TYPEGUARD_TYPECHECK_ENABLED'] = '0'

# Save original functions
original_findsource = inspect.findsource
original_getsourcelines = inspect.getsourcelines
original_getsource = inspect.getsource

def patched_findsource(object):
    \"\"\"Patched version of inspect.findsource that handles missing source files\"\"\"
    try:
        return original_findsource(object)
    except (OSError, TypeError):
        # For functions and methods
        if isinstance(object, (types.FunctionType, types.MethodType)):
            dummy_source = [f"def {object.__name__}(*args, **kwargs):\\n", "    pass\\n"]
            return dummy_source, 0
        # For classes
        elif isinstance(object, type):
            dummy_source = [f"class {object.__name__}:\\n", "    pass\\n"]
            return dummy_source, 0
        # For modules
        elif isinstance(object, types.ModuleType):
            dummy_source = ["# Dummy module source\\n"]
            return dummy_source, 0
        # Re-raise for unknown types
        raise

def patched_getsourcelines(object):
    \"\"\"Patched version of inspect.getsourcelines that handles missing source files\"\"\"
    try:
        return original_getsourcelines(object)
    except (OSError, TypeError):
        source, lineno = patched_findsource(object)
        return source, lineno

def patched_getsource(object):
    \"\"\"Patched version of inspect.getsource that handles missing source files\"\"\"
    try:
        return original_getsource(object)
    except (OSError, TypeError):
        lines, _ = patched_getsourcelines(object)
        return ''.join(lines)

# Patch the inspect module functions
inspect.findsource = patched_findsource
inspect.getsourcelines = patched_getsourcelines
inspect.getsource = patched_getsource

# Attempt to directly patch typeguard if loaded
try:
    import typeguard
    
    # Create a no-op decorator
    def noop_typechecked(target=None, **kwargs):
        if target is None:
            return lambda x: x
        return target
    
    # Replace typeguard's typechecked
    typeguard.typechecked = noop_typechecked
    
    # Try to patch internal modules too
    try:
        from typeguard import _decorators
        _decorators.typechecked = noop_typechecked
        
        # Also patch the instrument function
        def noop_instrument(func, **kwargs):
            return func
            
        _decorators.instrument = noop_instrument
        
        print("Typeguard successfully patched")
    except ImportError:
        pass
    
except ImportError:
    pass

print("Source code inspection patch applied")
""")
    
    print(f"Created source patch file: {patch_path}")
    return patch_path

def create_typeguard_hook(hooks_dir):
    """Create a hook file for typeguard package"""
    hook_path = os.path.join(hooks_dir, "hook-typeguard.py")
    
    with open(hook_path, 'w') as f:
        f.write("""# hook-typeguard.py
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Make sure all typeguard submodules are included
hiddenimports = collect_submodules('typeguard')

# Include any data files
datas = collect_data_files('typeguard')
""")
    
    print(f"Created typeguard hook file: {hook_path}")
    return hook_path

def create_preboot_patch():
    """Create a PyInstaller pre-boot patch to fix inspect module"""
    patch_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "pyi_rth_source_patch.py")
    
    with open(patch_path, 'w') as f:
        f.write("""# PyInstaller runtime hook to patch inspect module
import os
import sys

# Set environment variables
os.environ['TYPEGUARD_TYPECHECK_ENABLED'] = '0'
os.environ['PYTORCH_JIT'] = '0'
os.environ['TORCH_DISABLE_JIT_TRACING'] = '1'

# Patch inspect module when it's imported
original_import = __import__

def patched_import(name, *args, **kwargs):
    module = original_import(name, *args, **kwargs)
    
    # Patch the inspect module when it's imported
    if name == 'inspect' and hasattr(module, 'getsource'):
        # Original functions
        original_findsource = module.findsource
        original_getsourcelines = module.getsourcelines
        original_getsource = module.getsource
        
        # Patched functions
        def patched_findsource(object):
            try:
                return original_findsource(object)
            except (OSError, TypeError):
                # For any object, return dummy source
                dummy_source = ["# Dummy source\\n", "def dummy(): pass\\n"]
                return dummy_source, 0
                
        def patched_getsourcelines(object):
            try:
                return original_getsourcelines(object)
            except (OSError, TypeError):
                source, lineno = patched_findsource(object)
                return source, lineno
                
        def patched_getsource(object):
            try:
                return original_getsource(object)
            except (OSError, TypeError):
                lines, _ = patched_getsourcelines(object)
                return ''.join(lines)
        
        # Apply patches
        module.findsource = patched_findsource
        module.getsourcelines = patched_getsourcelines
        module.getsource = patched_getsource
        
        print("Inspect module patched to handle missing source")
    
    # Also patch typeguard when imported
    if name == 'typeguard' and hasattr(module, 'typechecked'):
        # Create a no-op decorator
        def noop_decorator(target=None, **kwargs):
            if target is None:
                return lambda x: x
            return target
            
        # Replace the typechecked function
        module.typechecked = noop_decorator
        print("Typeguard module patched")
        
    return module

# Replace the built-in __import__ function
sys.modules['builtins'].__import__ = patched_import
print("Import hook installed for inspect and typeguard modules")
""")
    
    print(f"Created PyInstaller pre-boot patch: {patch_path}")
    return patch_path

def create_gruut_hook(hooks_dir):
    """Create a hook file for gruut package"""
    hook_path = os.path.join(hooks_dir, "hook-gruut.py")
    
    with open(hook_path, 'w') as f:
        f.write("""# hook-gruut.py
from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import os
import site
import tempfile

# Try to find the gruut package
try:
    import gruut
    gruut_path = os.path.dirname(gruut.__file__)
    version_file = os.path.join(gruut_path, 'VERSION')
    
    if os.path.exists(version_file):
        datas = [(version_file, 'gruut')]
    else:
        # Create dummy VERSION file if not found
        print("Warning: gruut VERSION file not found, creating a dummy file")
        temp_dir = tempfile.mkdtemp()
        dummy_version = os.path.join(temp_dir, "VERSION")
        with open(dummy_version, "w") as f:
            f.write("0.0.0")
        datas = [(dummy_version, 'gruut')]
        
except ImportError:
    # If gruut is not directly importable, try to find it in site-packages
    site_packages = site.getsitepackages()
    
    gruut_found = False
    for sp in site_packages:
        gruut_path = os.path.join(sp, 'gruut')
        version_file = os.path.join(gruut_path, 'VERSION')
        if os.path.exists(gruut_path) and os.path.isdir(gruut_path):
            if os.path.exists(version_file):
                datas = [(version_file, 'gruut')]
                gruut_found = True
                break
    
    if not gruut_found:
        # Create dummy VERSION file
        print("Warning: gruut package VERSION file not found, creating a dummy file")
        temp_dir = tempfile.mkdtemp()
        dummy_version = os.path.join(temp_dir, "VERSION")
        with open(dummy_version, "w") as f:
            f.write("0.0.0")
        datas = [(dummy_version, 'gruut')]

# Collect all submodules
hiddenimports = collect_submodules('gruut')

# Collect additional data files
additional_datas = collect_data_files('gruut')
datas.extend(additional_datas)
""")
    
    print(f"Created gruut hook file: {hook_path}")
    return hook_path

def create_jamo_hook(hooks_dir):
    """Create a hook file for jamo package"""
    hook_path = os.path.join(hooks_dir, "hook-jamo.py")
    
    with open(hook_path, 'w') as f:
        f.write("""# hook-jamo.py
from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import os
import site

# Collect all data files from jamo package
datas = collect_data_files('jamo')

# If collect_data_files doesn't find the files, locate them manually
if not any(d[0].endswith('.json') for d in datas):
    # Try to find jamo package
    try:
        import jamo
        jamo_dir = os.path.dirname(jamo.__file__)
        
        # Path to the data directory
        data_dir = os.path.join(jamo_dir, 'data')
        
        if os.path.exists(data_dir) and os.path.isdir(data_dir):
            # Find all .json files in data directory
            json_files = []
            for file in os.listdir(data_dir):
                if file.endswith('.json'):
                    json_files.append((os.path.join(data_dir, file), os.path.join('jamo', 'data')))
            
            if json_files:
                datas.extend(json_files)
                print(f"Added {len(json_files)} JSON files from jamo/data directory")
    
    except ImportError:
        # If jamo can't be imported, try to find it in site-packages
        site_packages = site.getsitepackages()
        for sp in site_packages:
            jamo_dir = os.path.join(sp, 'jamo')
            data_dir = os.path.join(jamo_dir, 'data')
            
            if os.path.exists(data_dir) and os.path.isdir(data_dir):
                # Find all .json files in data directory
                json_files = []
                for file in os.listdir(data_dir):
                    if file.endswith('.json'):
                        json_files.append((os.path.join(data_dir, file), os.path.join('jamo', 'data')))
                
                if json_files:
                    datas.extend(json_files)
                    print(f"Added {len(json_files)} JSON files from jamo/data directory")
                    break

# Collect all submodules
hiddenimports = collect_submodules('jamo')
""")
    
    print(f"Created jamo hook file: {hook_path}")
    return hook_path

def create_azure_speech_hook(hooks_dir):
    """Create a hook file for Azure Cognitive Services Speech SDK"""
    hook_path = os.path.join(hooks_dir, "hook-azure.cognitiveservices.speech.py")
    
    with open(hook_path, 'w') as f:
        f.write("""# hook-azure.cognitiveservices.speech.py
from PyInstaller.utils.hooks import collect_data_files, collect_submodules, collect_dynamic_libs
import os
import site
import glob

# Collect all submodules
hiddenimports = collect_submodules('azure.cognitiveservices.speech')

# Collect data files
datas = collect_data_files('azure.cognitiveservices.speech')

# Collect dynamic libraries
binaries = collect_dynamic_libs('azure.cognitiveservices.speech')

# If the automatic collection doesn't find the libraries, locate them manually
if not any('libMicrosoft.CognitiveServices.Speech.core' in binary[0] for binary in binaries):
    print("Manually searching for Azure Speech SDK native libraries...")
    
    # Try to locate the Azure Speech SDK binary files
    try:
        import azure.cognitiveservices.speech as speechsdk
        
        # Get the package directory
        sdk_dir = os.path.dirname(speechsdk.__file__)
        
        # Look for the dylib in various locations
        dylib_patterns = [
            os.path.join(sdk_dir, '*.dylib'),
            os.path.join(sdk_dir, 'libMicrosoft.CognitiveServices.Speech.core.dylib'),
            os.path.join(sdk_dir, '*', '*.dylib')
        ]
        
        for pattern in dylib_patterns:
            for lib_path in glob.glob(pattern):
                if os.path.isfile(lib_path):
                    # Add as binary
                    target_dir = os.path.relpath(os.path.dirname(lib_path), sdk_dir)
                    if target_dir == '.':
                        target_dir = 'azure/cognitiveservices/speech'
                    else:
                        target_dir = os.path.join('azure/cognitiveservices/speech', target_dir)
                    
                    binaries.append((lib_path, target_dir))
                    print(f"Found Azure Speech SDK library: {lib_path} -> {target_dir}")
        
    except ImportError:
        print("Could not import azure.cognitiveservices.speech to locate libraries")
        
        # Try to find in site-packages
        site_packages = site.getsitepackages()
        
        for sp in site_packages:
            sdk_dir = os.path.join(sp, 'azure', 'cognitiveservices', 'speech')
            
            if os.path.exists(sdk_dir):
                # Look for the dylib
                dylib_patterns = [
                    os.path.join(sdk_dir, '*.dylib'),
                    os.path.join(sdk_dir, 'libMicrosoft.CognitiveServices.Speech.core.dylib'),
                    os.path.join(sdk_dir, '*', '*.dylib')
                ]
                
                for pattern in dylib_patterns:
                    for lib_path in glob.glob(pattern):
                        if os.path.isfile(lib_path):
                            # Add as binary
                            target_dir = os.path.relpath(os.path.dirname(lib_path), sdk_dir)
                            if target_dir == '.':
                                target_dir = 'azure/cognitiveservices/speech'
                            else:
                                target_dir = os.path.join('azure/cognitiveservices/speech', target_dir)
                            
                            binaries.append((lib_path, target_dir))
                            print(f"Found Azure Speech SDK library: {lib_path} -> {target_dir}")
""")
    
    print(f"Created Azure Speech hook file: {hook_path}")
    return hook_path

def create_qdrant_hook(hooks_dir):
    """Create a hook file for Qdrant"""
    hook_path = os.path.join(hooks_dir, "hook-qdrant.py")
    
    with open(hook_path, 'w') as f:
        f.write("""# hook-qdrant.py
from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import os
import shutil
import tempfile

# Collect all submodules
hiddenimports = collect_submodules('qdrant_client')

# Collect data files
datas = collect_data_files('qdrant_client')

# Add the Qdrant binary with correct path structure
qdrant_binary_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'templates', 'bin', 'qdrant-macos')
if os.path.exists(qdrant_binary_path):
    # Copy to a temporary directory to ensure it's readable and executable
    temp_dir = tempfile.mkdtemp()
    temp_templates_dir = os.path.join(temp_dir, 'templates')
    temp_bin_dir = os.path.join(temp_templates_dir, 'bin')
    os.makedirs(temp_bin_dir, exist_ok=True)
    
    # Copy the binary
    temp_qdrant_path = os.path.join(temp_bin_dir, 'qdrant-macos')
    shutil.copy2(qdrant_binary_path, temp_qdrant_path)
    
    # Make sure it's executable
    os.chmod(temp_qdrant_path, 0o755)
    
    # Add to datas - preserving the templates/bin path structure
    datas.append((temp_qdrant_path, 'templates/bin'))
    print(f"Added Qdrant binary: {qdrant_binary_path} -> templates/bin/qdrant-macos")
else:
    print(f"Warning: Could not find Qdrant binary at {qdrant_binary_path}")
""")
    
    print(f"Created Qdrant hook file: {hook_path}")
    return hook_path

def post_build_fixups(app_dir):
    """Apply post-build fixups"""
    print("Applying post-build fixups...")
    
    # 1. Make sure the templates/bin directory exists in the packaged app
    bin_dir = os.path.join(app_dir, "templates", "bin")
    os.makedirs(bin_dir, exist_ok=True)
    
    # 2. Copy the Qdrant binary to the correct location using absolute path
    src_bin = os.path.abspath(os.path.join(TEMPLATES_DIR, "bin", QDRANT_BINARY))
    if os.path.exists(src_bin):
        dst_bin = os.path.join(bin_dir, QDRANT_BINARY)
        print(f"Copying Qdrant binary from {src_bin} to {dst_bin}")
        shutil.copy2(src_bin, dst_bin)
        
        # Make it executable
        if platform.system() != "Windows":
            try:
                os.chmod(dst_bin, 0o755)
                print(f"Made Qdrant binary executable: {dst_bin}")
            except Exception as e:
                print(f"Warning: Could not set executable permissions: {e}")
    else:
        print(f"Warning: Could not find Qdrant binary at {src_bin}")
        
        # Try to find Qdrant binary in alternate locations
        alt_src_bin = os.path.abspath(os.path.join("..", TEMPLATES_DIR, "bin", QDRANT_BINARY))
        if os.path.exists(alt_src_bin):
            dst_bin = os.path.join(bin_dir, QDRANT_BINARY)
            print(f"Copying Qdrant binary from alternate location: {alt_src_bin} to {dst_bin}")
            shutil.copy2(alt_src_bin, dst_bin)
            
            # Make it executable
            if platform.system() != "Windows":
                try:
                    os.chmod(dst_bin, 0o755)
                    print(f"Made Qdrant binary executable: {dst_bin}")
                except Exception as e:
                    print(f"Warning: Could not set executable permissions: {e}")
        else:
            print(f"Warning: Could not find Qdrant binary at alternate location: {alt_src_bin}")

    # Add explicit copy of .env file
    src_env = ENV_FILE
    dst_env = os.path.join(app_dir, ".env")
    
    if os.path.exists(src_env):
        print(f"Copying .env file from {src_env} to {dst_env}")
        shutil.copy2(src_env, dst_env)
        print(".env file successfully copied")
    else:
        print(f"Warning: Could not find .env file at {src_env}")
        
        # Create a default .env file if one doesn't exist
        print("Creating default .env file")
        with open(dst_env, 'w') as f:
            f.write("# Generated default .env file\n")
            f.write("LOG_LEVEL=INFO\n")
        print("Created default .env file")
    
    # 3. Check if the binary was successfully copied
    if os.path.exists(os.path.join(bin_dir, QDRANT_BINARY)):
        print("Qdrant binary successfully installed")
    else:
        print("Failed to install Qdrant binary")
    
    # Verify espeak installation
    espeak_dir = os.path.join(app_dir, "espeak")
    if os.path.exists(espeak_dir):
        print("Checking espeak installation...")
        espeak_exe = "espeak.exe" if IS_WINDOWS else "espeak"
        espeak_path = os.path.join(espeak_dir, espeak_exe)
        
        if os.path.exists(espeak_path):
            # Make sure it's executable
            if not IS_WINDOWS:
                try:
                    os.chmod(espeak_path, 0o755)
                    print(f"Made espeak executable: {espeak_path}")
                except Exception as e:
                    print(f"Warning: Could not set executable permissions: {e}")
            
            print("espeak successfully installed")
        else:
            print(f"Warning: espeak executable not found at {espeak_path}")
    else:
        print("Warning: espeak directory not found in packaged application")

def install_specific_dependencies():
    """Install specific versions of dependencies that need special handling"""
    print("Installing specific dependency versions...")
    
    try:
        # Install the exact Azure Speech SDK version
        subprocess.run([
            sys.executable, "-m", "pip", "install", 
            "azure-cognitiveservices-speech==1.42.0", "--force-reinstall"
        ], check=True)
        print("✓ Installed Azure Speech SDK 1.42.0")
        
        # You could add other specific dependency installations here as needed
    except Exception as e:
        print(f"⚠️ Failed to install specific dependencies: {e}")

def find_and_bundle_espeak():
    """Find espeak on the system and prepare it for bundling"""
    import subprocess
    import os
    import shutil
    import tempfile
    
    print("Searching for espeak installation...")
    
    # First, try to find where espeak is installed using 'which' command on macOS/Linux
    espeak_path = None
    espeak_lib_path = None
    
    try:
        if not IS_WINDOWS:
            # Try to find the espeak executable
            result = subprocess.run(['which', 'espeak'], stdout=subprocess.PIPE, text=True, check=False)
            if result.returncode == 0:
                espeak_path = result.stdout.strip()
                print(f"Found espeak executable at: {espeak_path}")
                
                # Check for possible library locations
                possible_lib_paths = [
                    "/opt/homebrew/lib/libespeak-ng.dylib",  # Homebrew on Apple Silicon
                    "/usr/local/lib/libespeak-ng.dylib",     # Homebrew on Intel Mac
                    "/usr/lib/libespeak-ng.so",              # Linux
                ]
                
                for lib_path in possible_lib_paths:
                    if os.path.exists(lib_path):
                        espeak_lib_path = lib_path
                        print(f"Found espeak library at: {espeak_lib_path}")
                        break
            
            # If not found with 'which', try common brew locations on macOS
            if not espeak_path and IS_MAC:
                brew_espeak_paths = [
                    "/opt/homebrew/bin/espeak",  # Apple Silicon
                    "/usr/local/bin/espeak"      # Intel Mac
                ]
                
                for path in brew_espeak_paths:
                    if os.path.exists(path):
                        espeak_path = path
                        print(f"Found espeak executable at: {espeak_path}")
                        break
        
        # For Windows, we'd use a different approach
        elif IS_WINDOWS:
            print("Windows support for espeak bundling not yet implemented")
            return None, None
    
    except Exception as e:
        print(f"Error searching for espeak: {e}")
    
    if not espeak_path:
        print("Could not find espeak executable. Please install it with 'brew install espeak'")
        return None, None
    
    # Create a temp directory to copy espeak files
    temp_dir = tempfile.mkdtemp()
    espeak_temp_dir = os.path.join(temp_dir, "espeak")
    os.makedirs(espeak_temp_dir, exist_ok=True)
    
    # Copy the espeak executable
    espeak_temp_path = os.path.join(espeak_temp_dir, os.path.basename(espeak_path))
    shutil.copy2(espeak_path, espeak_temp_path)
    print(f"Copied espeak executable to: {espeak_temp_path}")
    
    # Copy the library if found
    espeak_lib_temp_path = None
    if espeak_lib_path:
        espeak_lib_temp_path = os.path.join(espeak_temp_dir, os.path.basename(espeak_lib_path))
        shutil.copy2(espeak_lib_path, espeak_lib_temp_path)
        print(f"Copied espeak library to: {espeak_lib_temp_path}")
    
    # Set executable permissions
    if not IS_WINDOWS:
        os.chmod(espeak_temp_path, 0o755)
        if espeak_lib_temp_path:
            os.chmod(espeak_lib_temp_path, 0o755)
    
    return espeak_temp_dir, temp_dir

def create_espeak_patch():
    """Create a runtime hook to set up espeak paths"""
    patch_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "espeak_patch.py")
    
    with open(patch_path, 'w') as f:
        f.write("""# espeak patch for bundled executable

def setup_espeak():
    \"\"\"Set up espeak environment for bundled application\"\"\"
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
""")
    
    print(f"Created espeak patch file: {patch_path}")
    return patch_path

def main():
    """Main build script function"""
    print(f"Building {APP_NAME}...")
    
    # Check if PyInstaller is installed
    try:
        import PyInstaller
        print(f"PyInstaller {PyInstaller.__version__} found.")
    except ImportError:
        print("PyInstaller not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
    
    # Check dependencies
    if not check_dependencies():
        print("Please install missing dependencies and try again.")
        return
    
    # Install specific dependencies
    install_specific_dependencies()
    
    # Prepare TTS model
    tts_model_path = prepare_tts_model()
    
    # Prepare VERSION files
    version_files, temp_dir = copy_version_files()
    
    # Create runtime hook
    hook_file = create_runtime_hook()
    
    # Create TTS hook and hooks directory
    hooks_dir = create_tts_hook()
    
    # Create trainer hook
    create_trainer_hook(hooks_dir)
    
    # Create gruut hook
    create_gruut_hook(hooks_dir)

    # Create jamo hook
    create_jamo_hook(hooks_dir)
    
    # Create PyTorch hook
    create_torch_hook(hooks_dir)
    
    # Prepare PyTorch libraries
    torch_libs = prepare_torch_libs()
    
    # Create TTS patch
    tts_patch_file = create_tts_patch()
    
    # Create source patch
    source_patch_file = create_source_patch()
    
    # Create typeguard hook
    create_typeguard_hook(hooks_dir)
    
    # Create preboot patch
    preboot_patch_file = create_preboot_patch()
    
    # Create gruut hook
    create_gruut_hook(hooks_dir)
    
    # Create jamo hook
    create_jamo_hook(hooks_dir)
    
    # Create Azure Speech hook
    create_azure_speech_hook(hooks_dir)
    
    # Create Qdrant hook
    create_qdrant_hook(hooks_dir)
    
    # Find and bundle espeak
    espeak_dir, espeak_temp_dir = find_and_bundle_espeak()
    
    # Create espeak patch
    espeak_patch_file = create_espeak_patch()
    
    # Update runtime_hooks to include the espeak patch
    runtime_hooks = [hook_file, tts_patch_file, espeak_patch_file]
    if source_patch_file:
        runtime_hooks.append(source_patch_file)
    
    # Create spec file (now including espeak)
    spec_file = create_spec_file(tts_model_path, hook_file, hooks_dir, version_files, 
                               tts_patch_file, torch_libs, source_patch_file, 
                               None, espeak_dir)
    
    # Build the application
    success, distpath = build_application(spec_file)
    
    if success:
        # Apply post-build fixups with correct path
        app_dir = os.path.join(distpath, APP_NAME)
        post_build_fixups(app_dir)
    
    # Clean up temporary directories
    try:
        shutil.rmtree(temp_dir)
        if espeak_temp_dir and os.path.exists(espeak_temp_dir):
            shutil.rmtree(espeak_temp_dir)
    except Exception as e:
        print(f"Warning: Could not clean up temporary directories: {e}")
    
    if success:
        print(f"\n{APP_NAME} build completed successfully!")
        print(f"Run the application from dist/{APP_NAME}/{APP_NAME}{'.exe' if IS_WINDOWS else ''}")
    else:
        print("\nBuild failed. Please check the errors above.")

if __name__ == "__main__":
    main()