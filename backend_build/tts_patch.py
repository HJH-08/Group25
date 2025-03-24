# TTS patch to disable TorchScript

def apply_patches():
    """Apply patches to TTS library to work around PyInstaller issues"""
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
