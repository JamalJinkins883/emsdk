# Quick Start Guide - File Converter

## 🚀 Getting Started in 5 Minutes

### Step 1: Access the Application
The file converter is running at: **http://localhost:8000**

*The server is already running in the terminal. If it stops, start the Flask service instead of just a static HTTP server:*
```bash
cd /workspaces/emsdk/file-converter
pip3 install -r requirements-dev.txt   # first time only
python3 server.py
```

### Step 2: Upload Files
1. Click the upload area or drag-and-drop files
2. Supported formats:
   - **Code Files**: .cpp, .cc, .c, .h, .hpp
   - **Images**: .png, .jpg, .jpeg
   - **Audio**: .ogg, .wav, .mp3
   - **Other**: .txt, .json, .dll, .vas

### Step 3: View and Process
1. See all uploaded files with details
2. Click "Process Files" to analyze
3. View results in different tabs

### Step 4: Download Results
- **Manifest**: JSON file with file metadata
- **HTML Index**: HTML listing of all files
- **Analysis**: Detailed per-file analysis

## 📁 Project Files

| File | Purpose |
|------|---------|
| **index.html** | Main web interface |
| **style.css** | UI styling (responsive design) |
| **app.js** | Application logic and file handling |
| **converter.cpp** | C++ processing module |
| **converter.js** | WebAssembly JavaScript bindings |
| **converter.wasm** | Compiled WebAssembly binary |
| **Makefile** | Build automation |
| **README.md** | Full documentation |

## 🛠️ Building & Development

### Build WebAssembly Module
```bash
make build
```

### Clean Build Artifacts
```bash
make clean
```

### Start Development Server
```bash
make server
```

### Manual Compilation
```bash
source /workspaces/emsdk/emsdk_env.sh
emcc converter.cpp -o build/converter.js --bind -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -O3
```

## 🔍 Testing

### Test File Included
A sample C++ file (`sample.cpp`) is included for testing:
- Upload it to test C++ analysis
- The analyzer detects main() function automatically
- Shows line count and file size

### Manual Testing Steps
1. Open http://localhost:8000 in browser
2. Drag sample.cpp onto the upload area
3. Click "Process Files"
4. Check the "Analysis" tab for results
5. Download manifest.json to verify output

## 📊 Features Explained

### Real-time File Display
- Shows file type and size
- Remove individual files with ✕ button
- Total file count and size displayed

### Processing
- Runs entirely in browser (no server-side processing)
- WebAssembly provides near-native performance
- Handles text and binary files

### Output Formats

**Manifest JSON**
```json
{
  "files": [
    {"name": "main.cpp", "type": "C++ Source", "size": 1024}
  ],
  "total_size": 1024
}
```

**HTML Index**
```html
<!DOCTYPE html>
<html>
<head><title>Converted Project</title></head>
<body>
  <h1>Project Files</h1>
  <ul>
    <li>main.cpp (C++ Source, 1024 bytes)</li>
  </ul>
</body>
</html>
```

## 🎯 Advanced Usage

### Add Custom File Types
Edit `app.js` and add to the `types` object:
```javascript
const types = {
    // ... existing types
    'myext': 'My Custom Type',
};
```

### Extend Processing Logic
Edit `converter.cpp` to add new processing functions:
```cpp
std::string processCustomFile(const std::string& filename) {
    // Your logic here
    return result;
}
```

Then rebuild:
```bash
make build
cp build/converter.* .
```

## 🐛 Troubleshooting

### "WebAssembly not loading" error
- Check browser console (F12)
- Ensure converter.wasm file exists
- Check file permissions: `ls -la converter.wasm`
- Try hard refresh: Ctrl+Shift+R

### "Module not found" error
- Verify files are in correct directory: `/workspaces/emsdk/file-converter`
- Copy built files: `cp build/converter.* .`
- Restart server

### Server won't start
```bash
# Kill existing server
pkill -f "http.server"

# Restart with explicit port
python3 -m http.server 8001
```

### Build fails with emcc not found
```bash
source /workspaces/emsdk/emsdk_env.sh
make clean
make build
```

## 📚 Resources

- [View Full Documentation](README.md)
- [Emscripten Guide](https://emscripten.org)
- [WebAssembly Info](https://webassembly.org)
- [JavaScript Bindings](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html)

## ✨ What's Next?

- Extend file type support
- Build a custom processor for specific formats
- Create export plugins
- Add drag-and-drop folder upload
- Implement cloud storage integration

---

**Version**: 1.0  
**Last Updated**: February 27, 2026  
**Status**: ✅ Ready for Use
