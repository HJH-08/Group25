# -*- mode: python ; coding: utf-8 -*-

import os
import sys
from pathlib import Path

# Add the templates directory to the Python path
templates_dir = os.path.join(SPECPATH, '../templates')
if templates_dir not in sys.path:
    sys.path.append(templates_dir)

block_cipher = None

added_files = [('../templates/.env', '.'), ('../templates/bin/qdrant-macos', 'templates/bin'), ('/Users/bukuo/Documents/Coding/Python/Group25/.venv/lib/python3.11/site-packages/TTS/VERSION', 'TTS'), ('/Users/bukuo/Documents/Coding/Python/Group25/.venv/lib/python3.11/site-packages/trainer/VERSION', 'trainer'), ('/Users/bukuo/Documents/Coding/Python/Group25/.venv/lib/python3.11/site-packages/gruut/VERSION', 'gruut'), ('/Users/bukuo/.cache/huggingface/hub', 'huggingface'), ('/var/folders/pm/49f7682s7qqd4frr0t1749y00000gp/T/tmpm65uwfbm/espeak', 'espeak')]

# Add PyTorch libraries
torch_libs = [('/Users/bukuo/Documents/Coding/Python/Group25/backend_build/torch_libs/libtorch_python.dylib', 'torch/lib'), ('/Users/bukuo/Documents/Coding/Python/Group25/backend_build/torch_libs/libtorch.dylib', 'torch/lib'), ('/Users/bukuo/Documents/Coding/Python/Group25/backend_build/torch_libs/libtorch_global_deps.dylib', 'torch/lib'), ('/Users/bukuo/Documents/Coding/Python/Group25/backend_build/torch_libs/libomp.dylib', 'torch/lib'), ('/Users/bukuo/Documents/Coding/Python/Group25/backend_build/torch_libs/libtorch_cpu.dylib', 'torch/lib'), ('/Users/bukuo/Documents/Coding/Python/Group25/backend_build/torch_libs/libc10.dylib', 'torch/lib'), ('/Users/bukuo/Documents/Coding/Python/Group25/backend_build/torch_libs/libshm.dylib', 'torch/lib')]

a = Analysis(
    ['../templates/app.py'],
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
    hookspath=['/Users/bukuo/Documents/Coding/Python/Group25/backend_build/hooks'],  # Include the hooks directory
    hooksconfig={},
    runtime_hooks=['/Users/bukuo/Documents/Coding/Python/Group25/backend_build/hook-companio.py', '/Users/bukuo/Documents/Coding/Python/Group25/backend_build/tts_patch.py', '/Users/bukuo/Documents/Coding/Python/Group25/backend_build/source_patch.py'],  # Include all runtime hooks
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
    name='Companio-Backend',
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
    name='Companio-Backend',
)
