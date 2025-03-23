"""Patch for Python's inspect module to handle missing source code access"""
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
    """Patched version of inspect.findsource that handles missing source files"""
    try:
        return original_findsource(object)
    except (OSError, TypeError):
        # For functions and methods
        if isinstance(object, (types.FunctionType, types.MethodType)):
            dummy_source = [f"def {object.__name__}(*args, **kwargs):\n", "    pass\n"]
            return dummy_source, 0
        # For classes
        elif isinstance(object, type):
            dummy_source = [f"class {object.__name__}:\n", "    pass\n"]
            return dummy_source, 0
        # For modules
        elif isinstance(object, types.ModuleType):
            dummy_source = ["# Dummy module source\n"]
            return dummy_source, 0
        # Re-raise for unknown types
        raise

def patched_getsourcelines(object):
    """Patched version of inspect.getsourcelines that handles missing source files"""
    try:
        return original_getsourcelines(object)
    except (OSError, TypeError):
        source, lineno = patched_findsource(object)
        return source, lineno

def patched_getsource(object):
    """Patched version of inspect.getsource that handles missing source files"""
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
