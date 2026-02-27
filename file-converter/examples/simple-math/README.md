# Simple Math Project - Example C++ to WebAssembly

This is a sample C++ project demonstrating how to use the File Converter tool to compile C++ code into WebAssembly.

## Project Structure

```
simple-math/
├── main.cpp      # Main program with math functions
├── math.h        # Header file with function declarations
└── README.md     # This file
```

## Project Contents

### main.cpp (28 lines)
Contains three mathematical functions:
- `add(a, b)` - Returns sum of two integers
- `multiply(a, b)` - Returns product of two integers
- `fibonacci(n)` - Calculates nth Fibonacci number

### math.h (22 lines)
Headers with function declarations and documentation

## How to Use with File Converter

### Step 1: Upload Project
1. Open the File Converter at `http://localhost:8000`
2. Click **📁 Upload Folder**
3. Navigate to and select this `simple-math` directory
4. The system will upload all files

### Step 2: Review Generated Output
After upload, you'll see:
- **C++ Files**: 1
- **Header Files**: 1
- **Total Files**: 2
- Compilation guide with Emscripten commands

### Step 3: Download Project Files
1. Go to **Analysis** tab
2. Click **📥 JSON Manifest** to download project structure
3. Click **📥 HTML Index** to download the guide

### Step 4: Compile Locally

#### Prerequisites:
- Emscripten installed ([Installation Guide](https://emscripten.org/docs/getting_started/downloads.html))
- Terminal/Command Prompt access

#### Basic Compilation:
```bash
cd simple-math
emcc main.cpp -o math.js -s WASM=1
```

**Output:**
- `math.js` (100+ KB) - Emscripten runtime
- `math.wasm` (5+ KB) - Compiled WebAssembly binary

#### With Optimization:
```bash
emcc main.cpp -o math.js -s WASM=1 -O3
```

#### With Bindings (for JavaScript):
```bash
emcc main.cpp -o math.js --bind -s WASM=1
```

### Step 5: Run in Web Browser

Create `index.html` in the same directory:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Simple Math - WebAssembly</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
        }
        button {
            padding: 10px 15px;
            margin: 5px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background: #2980b9;
        }
        #output {
            background: #f0f0f0;
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            font-family: monospace;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <h1>🧮 Simple Math - WebAssembly</h1>
    <p>Click buttons to call C++ functions from JavaScript</p>
    
    <div>
        <button onclick="testAdd()">Test: add(10, 20)</button>
        <button onclick="testMultiply()">Test: multiply(5, 6)</button>
        <button onclick="testFib()">Test: fibonacci(10)</button>
        <button onclick="clearOutput()">Clear Output</button>
    </div>
    
    <div id="output">Output will appear here...</div>

    <script src="math.js"></script>
    <script>
        // Wait for WASM module to initialize
        Module.onRuntimeInitialized = async () => {
            log('✅ WebAssembly module loaded!');
        };

        function log(message) {
            const output = document.getElementById('output');
            output.textContent += message + '\n';
        }

        function clearOutput() {
            document.getElementById('output').textContent = '';
        }

        function testAdd() {
            try {
                const result = Module.ccall('add', 'number', ['number', 'number'], [10, 20]);
                log(`add(10, 20) = ${result}`);
            } catch (error) {
                log(`Error: ${error.message}`);
            }
        }

        function testMultiply() {
            try {
                const result = Module.ccall('multiply', 'number', ['number', 'number'], [5, 6]);
                log(`multiply(5, 6) = ${result}`);
            } catch (error) {
                log(`Error: ${error.message}`);
            }
        }

        function testFib() {
            try {
                const result = Module.ccall('fibonacci', 'number', ['number'], [10]);
                log(`fibonacci(10) = ${result}`);
            } catch (error) {
                log(`Error: ${error.message}`);
            }
        }

        // Wait for user interaction
        window.addEventListener('load', () => {
            log('Application ready. Click buttons to test functions.');
        });
    </script>
</body>
</html>
```

Now open `index.html` in your browser and click the buttons to call C++ functions!

## Expected Output

When running in browser, you should see:
```
✅ WebAssembly module loaded!
add(10, 20) = 30
multiply(5, 6) = 30
fibonacci(10) = 55
```

## Adding More Functions

### To add a new function:

1. **Add to main.cpp**:
```cpp
int square(int x) {
    return x * x;
}
```

2. **Declare in math.h**:
```cpp
int square(int x);
```

3. **Recompile**:
```bash
emcc main.cpp -o math.js -s WASM=1
```

4. **Call from JavaScript**:
```javascript
const result = Module.ccall('square', 'number', ['number'], [5]);
console.log(`square(5) = ${result}`); // Output: 25
```

## Compiler Flags Explained

| Flag | Purpose |
|------|---------|
| `-o math.js` | Output filename for JavaScript loader |
| `-s WASM=1` | Enable WebAssembly output |
| `-O3` | Maximum optimization (slower compile, faster runtime) |
| `--bind` | Enable C++ class/function bindings to JavaScript |
| `-s ALLOW_MEMORY_GROWTH=1` | Allow dynamic memory allocation |
| `-g` | Include debug symbols |

## Troubleshooting

### Issue: "Cannot find emcc"
- **Solution**: Install Emscripten or add it to PATH
- **Command**: `source emsdk_env.sh` (Linux/Mac) or `emsdk_env.bat` (Windows)

### Issue: WASM module not loading
- **Solution**: Ensure math.js and math.wasm are in same directory
- **Check**: Browser console for network errors

### Issue: Function not found
- **Solution**: Verify function was compiled (check math.wasm exists)
- **Fix**: Ensure function is declared with `extern "C"`

## Learning Resources

- [Emscripten Documentation](https://emscripten.org/docs/)
- [WebAssembly.org](https://webassembly.org/)
- [Emscripten Tutorials](https://emscripten.org/docs/getting_started/tutorials/index.html)
- [MDN WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly/)

## Next Steps

- Try modifying main.cpp and recompiling
- Add more complex algorithms
- Experiment with JavaScript interoperability
- Explore Emscripten optimization flags
- Create interactive web interfaces

---

Created with ❤️ using Emscripten
