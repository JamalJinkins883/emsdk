# File Converter - Advanced Features Guide

## Overview

The File Converter is a web-based application powered by Emscripten and WebAssembly that converts C++ projects and file assets into portable web applications. It provides both file metadata analysis and C++ to WebAssembly compilation preparation.

## Key Features

### 1. **Dual Upload Methods**

#### Folder Upload
- Click the **📁 Upload Folder** button to select an entire directory
- Useful for uploading complete C++ projects
- Preserves folder structure information
- Automatic detection of C++ files for compilation

**Usage:**
```bash
# Upload a C++ project containing:
# project/
# ├── main.cpp
# ├── utils.h
# ├── utils.cpp
# └── assets/
#     ├── shader.glsl
#     └── texture.png
```

#### File Upload
- Click the **📄 Upload Files** button for individual files
- Multiple file selection supported
- Drag and drop support
- File type auto-detection

**Supported File Types:**
- C++ Source: `.cpp`, `.cc`, `.cxx`
- Header Files: `.h`, `.hpp`
- C Source: `.c`
- Assets: `.png`, `.jpg`, `.jpeg`, `.ogg`, `.wav`, `.mp3`
- Configuration: `.txt`, `.json`, `.vas`
- Libraries: `.dll`

### 2. **Automatic Project Detection**

The system automatically detects the type of project based on uploaded files (relative folder structure is preserved when using the "Upload Folder" button):

#### C++ Projects
When C++ source files are detected:
- Displays file count breakdown
- Shows header file analysis
- Lists asset files
- Generates **compilation instructions**
- Provides project structure information

#### Standard File Collections
For mixed file types:
- Analyzes each file individually
- Calculates line counts for source files
- Detects `main()` function presence
- Generates file manifests in JSON format

### 3. **C++ Project Compilation Preparation**

#### Automatic Compilation Service
Uploads are sent to a lightweight backend which runs `emcc` on your behalf. The
compiled `output.js` and `output.wasm` are returned automatically and embedded
in the preview. No local toolchain or manual commands are required – just
click **Process Files**.

#### Generated Compilation Guide
For transparency the app still displays the equivalent Emscripten commands:
- Step-by-step compiler invocation
- Optimization flags explanation
- Tips for JavaScript interoperability

#### Example Generation
```html
<!DOCTYPE html>
<html>
<head>
    <title>CompiledProject - WebAssembly App</title>
    <!-- Generated HTML with beautiful styling -->
</head>
<body>
    <!-- Project information, compilation guide, asset list -->
    <!-- Ready to be enhanced with compiled WASM module -->
</body>
</html>
```

### 4. **File Analysis & Reporting**

#### For C++ Source Files
- **Line Count**: Automatic line counting
- **Main Function Detection**: Identifies entry points
- **File Type Classification**: C++, Header, C source
- **Size Information**: File size in optimal units (B, KB, MB)

**Compiled Output Tab**
- After the backend compiles your C++ project the new "Compiled" tab appears
- Preview the generated HTML with embedded WASM
- Download `output.js` and `output.wasm` with a single click

#### Generated Reports
- **JSON Manifest**: Complete file metadata in JSON format
- **HTML Index**: Formatted HTML file listing
- **Analysis Dashboard**: Visual file breakdown

### 5. **Download Capabilities**

#### Individual Downloads
- **JSON Manifest**: Project structure in JSON format
- **HTML Index**: Generated HTML page

#### Example JSON Manifest:
```json
{
  "name": "CompiledProject",
  "files": [
    {"name": "main.cpp", "type": "C++ Source"},
    {"name": "utils.h", "type": "Header"}
  ],
  "assets": [
    {"name": "shader.glsl", "type": "Asset"}
  ]
}
```

#### Generated HTML Structure:
```html
<h3>C++ Project Ready for Compilation</h3>
<p>C++ Files: 3</p>
<p>Header Files: 2</p>
<p>Assets: 5</p>
```

### 6. **WebAssembly Compilation Workflow**

#### Complete Workflow:
1. **Upload** C++ files using folder or file upload
2. **Review** the generated HTML and project information
3. **Download** the project files
4. **Compile** locally using Emscripten:
   ```bash
   emcc main.cpp -o app.js --bind -s WASM=1
   ```
5. **Outputs**:
   - `app.js` - Emscripten runtime and JavaScript bindings
   - `app.wasm` - Compiled WebAssembly binary
6. **Embed** in your HTML page
7. **Usage** from JavaScript:
   ```javascript
   Module.onRuntimeInitialized = () => {
       // Call your C++ functions
       Module.ccall('myFunction', 'number', ['number'], [42]);
   };
   ```

## Tab Organization

### Available Tabs:

#### 📋 Manifest Tab
- Complete JSON representation of project structure
- File metadata and organization
- Useful for programmatic processing

#### 📄 HTML Tab
- Formatted HTML output
- Project summary and information
- Compilation guide (for C++ projects)
- File listing in HTML format

#### 📊 Analysis Tab
- Interactive file analysis
- Line counts for source files
- Main function detection
- Download buttons for each component

## UI Controls

### Main Buttons:
- **Upload Folder**: Select entire directory with webkitdirectory API
- **Upload Files**: Select individual or multiple files
- **Process Files**: Process uploaded files and generate outputs
- **Clear All**: Reset and start fresh

### Download Buttons (in Analysis tab):
- **JSON Manifest**: Download project metadata
- **HTML Index**: Download generated HTML
- **All Files**: Download complete project package

## Status Indicator

The status indicator (top-right) shows:
- ⏳ **Initializing**: Application is loading
- ✅ **Ready**: WebAssembly module loaded, ready to process
- ❌ **Failed**: Error during initialization

## Logging System

Real-time logs display:
- File processing status
- WASM module initialization
- Project analysis progress
- Download confirmations
- Error messages

Color-coded log levels:
- 🔵 **info**: General information
- ✅ **success**: Operation successful
- ❌ **error**: Error occurred
- ⚠️ **warning**: Potential issues

## Advanced Usage

### Compiling C++ Code

#### Basic Compilation:
```bash
cd /path/to/project
emcc main.cpp -o output.js -s WASM=1
```

#### With Optimization:
```bash
emcc main.cpp -o output.js -s WASM=1 -O3
```

#### With C++ Bindings:
```bash
emcc main.cpp -o output.js --bind -s WASM=1
```

#### With Multiple Files:
```bash
emcc main.cpp utils.cpp -o output.js -s WASM=1
```

### Embedding WASM in HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>My WASM App</title>
</head>
<body>
    <h1>WebAssembly Application</h1>
    <div id="output"></div>

    <script src="output.js"></script>
    <script>
        Module.onRuntimeInitialized = async () => {
            const result = Module.ccall(
                'add',           // C function name
                'number',        // return type
                ['number', 'number'],  // argument types
                [5, 3]          // arguments
            );
            document.getElementById('output').textContent = `5 + 3 = ${result}`;
        };
    </script>
</body>
</html>
```

### Project Structure Best Practices

Organize your C++ project for optimal conversion:

```
my-project/
├── main.cpp           # Entry point
├── include/
│   ├── utils.h
│   └── config.h
├── src/
│   ├── utils.cpp
│   └── algorithms.cpp
├── assets/
│   ├── shader.glsl
│   └── texture.png
└── CMakeLists.txt     # Optional: for build configuration
```

## Browser Compatibility

The application requires:
- Modern browser with WebAssembly support
- ES6 JavaScript support
- File API support for file uploads
- Folder upload support (webkitdirectory API):
  - Chrome/Edge: Fully supported
  - Firefox: Fully supported
  - Safari: Partially supported
  - Mobile browsers: Limited support

## Performance Tips

1. **Uploadable File Size**: Browser typically supports up to 4GB per file
2. **Folder Upload Performance**: Depends on system file I/O speed
3. **Processing Speed**: Local processing is very fast (< 1 second for most projects)
4. **WASM Compilation**: Local compilation time varies by file size (typically seconds to minutes)

## Troubleshooting

### Issue: WebAssembly module not loading
**Solution**: 
- Ensure JavaScript is enabled
- Check browser console for errors
- Verify network connectivity
- Try refreshing the page

### Issue: Files not uploading
**Solution**:
- Check file size limits
- Verify file types are supported
- Try different browser
- Check browser permissions for file access

### Issue: C++ files not detected
**Solution**:
- Verify file extensions (.cpp, .h, .c)
- Ensure files contain valid C++ code
- Check folder upload includes C++ files

### Issue: Compilation fails
**Solution**:
- Verify Emscripten is installed: `emcc --version`
- Check C++ syntax is valid
- Ensure all dependencies are included
- Use `-v` flag for verbose compilation output

## Keyboard Shortcuts

- **Ctrl/Cmd + A**: Select all files in list (when focused)
- **Tab**: Navigate between sections
- **Enter**: Trigger Process button when focused

## Export Formats

### JSON Format:
```json
{
  "name": "ProjectName",
  "created": "2024-02-27T10:30:00Z",
  "files": [
    {
      "path": "src/main.cpp",
      "type": "C++ Source",
      "mimeType": "text/plain",
      "size": 2048
    }
  ]
}
```

### HTML Format:
Dynamically generated with project information, file listings, and compilation guidance.

## Future Enhancements

Planned features:
- 🚀 Real-time compilation in browser using Emscripten online service
- 📦 ZIP file download for complete projects
- 🔍 Code syntax highlighting in preview
- 🐛 Compilation error detection and reporting
- 📱 Mobile folder upload optimization
- ⚡ Background processing for large projects
- 🔗 Direct GitHub integration for loading projects

## Support & Resources

- **Emscripten Documentation**: https://emscripten.org/docs/
- **WebAssembly Resources**: https://webassembly.org/
- **GitHub Issues**: Report bugs or request features
- **Community Forums**: Join the discussion

## License

This tool is provided as part of the Emscripten SDK project.

---

**Version**: 2.0  
**Last Updated**: February 2024  
**Status**: Production Ready ✅
