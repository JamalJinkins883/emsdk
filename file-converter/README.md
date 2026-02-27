# 🔄 File Converter - Emscripten Powered

A web-based file converter that runs entirely in the browser using WebAssembly. Convert C++, images, audio, and other files into web-compatible formats with manifest generation.

## Features

- 📁 **Multi-file upload** with drag-and-drop support
- 🚀 **WebAssembly-based** processing for fast performance
- 📊 **File analysis** and metadata extraction
- 📋 **Manifest generation** in JSON format
- 🌐 **Browser-based** - no server required
- 📦 **Supports multiple file types**:
  - C++ source files (.cpp, .cc, .c)
  - Header files (.h, .hpp)
  - Images (.png, .jpg, .jpeg)
  - Audio (.ogg, .wav, .mp3)
  - Other formats (.dll, .json, .txt, .vas)

## Project Structure

```
file-converter/
├── converter.cpp       - C++ module with file processing logic
├── index.html          - Main HTML interface
├── style.css           - Styling
├── app.js              - JavaScript application logic
├── build.sh            - Build script (bash)
├── Makefile            - Build configuration
├── README.md           - This file
└── build/              - Generated output (after build)
    ├── converter.js    - JavaScript bindings
    └── converter.wasm  - WebAssembly binary
```

## Prerequisites

- Emscripten SDK (already available in workspace)
- Python 3 (for development server)
- Modern browser with WebAssembly support

## Building

### Option 1: Using Make (Recommended)

```bash
cd file-converter
make build
```

### Option 2: Using build.sh

```bash
cd file-converter
chmod +x build.sh
./build.sh
```

### Option 3: Manual compilation

```bash
source /workspaces/emsdk/emsdk_env.sh
emcc converter.cpp -o build/converter.js --bind -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -O3
```

## Running

After building, start a development server:

```bash
# Using Make
make server

# Or manually
python3 -m http.server 8000 --directory .
```

Then open `http://localhost:8000` in your browser.

## Usage

1. **Upload Files**: Click the upload area or drag and drop files
2. **View Files**: See all uploaded files with details
3. **Process**: Click "Process Files" to analyze and generate outputs
4. **Download**: Download the generated manifest.json or index.html
5. **Analyze**: View detailed analysis of each file

## Generated Outputs

### Manifest JSON
Contains metadata about all uploaded files:
```json
{
  "files": [
    {
      "name": "main.cpp",
      "type": "C++ Source",
      "size": 1024
    }
  ],
  "total_size": 2048
}
```

### HTML Index
An HTML file listing all uploaded files with their properties.

### File Analysis
Detailed analysis per file, including:
- Line count for source files
- Presence of main() function in C++ files
- File size and type

## Development

### Modifying the C++ Module

Edit `converter.cpp` and rebuild:

```bash
make clean
make build
```

### Extending File Types

Add new file type handling in:
1. `converter.cpp` - Add processing logic
2. `app.js` - Update `getFileType()` and `isBinaryFile()` methods
3. `index.html` - Update file input accept attribute

## Browser Support

- Chrome/Chromium 74+
- Firefox 79+
- Safari 14+
- Edge 79+

## Performance Notes

- File processing is fast due to WebAssembly compilation
- Large files (>100MB) may require more memory
- Binary files are converted to base64 for browser compatibility

## Troubleshooting

### Emscripten not found
```bash
source /workspaces/emsdk/emsdk_env.sh
```

### WASM not loading
- Check browser console for errors
- Ensure converter.wasm is in the same directory as converter.js
- Verify MIME types are correct (application/wasm)

### Build fails
```bash
# Clean and rebuild
make clean
make build
```

## License

Uses Emscripten SDK - See Emscripten License

## Resources

- [Emscripten Documentation](https://emscripten.org)
- [WebAssembly Reference](https://webassembly.org)
- [JavaScript Bindings](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html)

---

**Built with Emscripten and Love** ❤️
