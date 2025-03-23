# hook-azure.cognitiveservices.speech.py
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
