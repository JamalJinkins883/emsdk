#!/bin/bash

# File Converter Build Script
# This script compiles the C++ converter module using Emscripten

echo "🔨 Building File Converter with Emscripten..."

# Check if emcc is available
if ! command -v emcc &> /dev/null; then
    echo "❌ emcc not found. Setting up Emscripten..."
    source /workspaces/emsdk/emsdk_env.sh
fi

# Create build directory
mkdir -p build

# Compile C++ to WebAssembly with bindings
echo "📦 Compiling converter.cpp..."
emcc converter.cpp \
    -o build/converter.js \
    --bind \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
    -O3

if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    echo "📂 Build files:"
    ls -lh build/
else
    echo "❌ Compilation failed!"
    exit 1
fi

echo ""
echo "🎉 Build complete! Generated files:"
echo "   - build/converter.js (bindings)"
echo "   - build/converter.wasm (WebAssembly binary)"
echo ""
echo "📁 To use in your project:"
echo "   cp build/converter.* ."
echo "   Then open index.html in your browser"
