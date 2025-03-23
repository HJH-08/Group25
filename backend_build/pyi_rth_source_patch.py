# PyInstaller runtime hook to patch inspect module
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
                dummy_source = ["# Dummy source\n", "def dummy(): pass\n"]
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
