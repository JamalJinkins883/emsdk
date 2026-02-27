// File Converter Application using Emscripten ccall API
class FileConverterApp {
    constructor() {
        this.files = new Map();
        this.wasmReady = false;
        this.compiledJS = null;
        this.compiledWasm = null;
        this.setupEventListeners();
        this.updateStatus('⏳ Initializing WebAssembly...', '#f39c12');
        this.initializeWasm().then(() => {
            this.wasmReady = true;
            this.log('Application ready for file processing', 'success');
            this.updateStatus('✅ Ready', '#27ae60');
        }).catch(error => {
            this.log(`Application failed to initialize: ${error.message}`, 'error');
            this.updateStatus('❌ Failed to load', '#e74c3c');
        });
    }

    updateStatus(message, color) {
        const indicator = document.getElementById('statusIndicator');
        if (indicator) {
            indicator.innerHTML = `<span style="color: ${color};">${message}</span>`;
        }
    }

    setupEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const folderInput = document.getElementById('folderInput');
        const uploadFolderBtn = document.getElementById('uploadFolderBtn');
        const uploadFilesBtn = document.getElementById('uploadFilesBtn');
        const processBtn = document.getElementById('processBtn');
        const clearBtn = document.getElementById('clearBtn');

        // Upload buttons
        uploadFolderBtn.addEventListener('click', () => folderInput.click());
        uploadFilesBtn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
        folderInput.addEventListener('change', (e) => this.handleFolderSelect(e.target.files));
        
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
        dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); this.handleFileSelect(e.dataTransfer.files); });
        dropZone.addEventListener('click', () => fileInput.click());
        processBtn.addEventListener('click', () => this.processFiles());
        clearBtn.addEventListener('click', () => this.clearFiles());
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    handleFolderSelect(fileList) {
        this.log('📁 Processing folder upload...', 'info');
        this.handleFileSelect(fileList);
    }

    async initializeWasm() {
        try {
            this.log('Initializing WebAssembly module...', 'info');
            let retries = 0;
            while (!window.Module || !window.Module.ccall) {
                if (retries++ > 50) throw new Error('WebAssembly module failed to load after 5 seconds');
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            this.log('✅ WebAssembly module ready', 'success');
        } catch (error) {
            this.log(`❌ Failed to initialize WASM: ${error.message}`, 'error');
            throw error;
        }
    }

    handleFileSelect(fileList) {
        Array.from(fileList).forEach(file => {
            // webkitRelativePath contains path when folder-uploaded
            const relative = file.webkitRelativePath || file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileType = this.getFileType(relative);
                this.files.set(relative, {
                    name: relative,
                    type: fileType,
                    size: file.size,
                    content: e.target.result
                });
                this.log(`Added file: ${relative}`, 'success');
                this.updateFileList();
            };
            if (this.isBinaryFile(relative)) {
                reader.readAsArrayBuffer(file);
                reader.onload = (e) => {
                    const binary = new Uint8Array(e.target.result);
                    const base64 = btoa(String.fromCharCode(...binary));
                    this.files.set(relative, {
                        name: relative,
                        type: this.getFileType(relative),
                        size: file.size,
                        content: base64
                    });
                    this.log(`Added file: ${relative} (binary)`, 'success');
                    this.updateFileList();
                };
            } else {
                reader.readAsText(file);
            }
        });
    }

    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = { 'cpp': 'C++ Source', 'cc': 'C++ Source', 'h': 'Header', 'hpp': 'Header', 'c': 'C Source', 'png': 'PNG Image', 'jpg': 'JPEG Image', 'jpeg': 'JPEG Image', 'ogg': 'OGG Audio', 'wav': 'WAV Audio', 'mp3': 'MP3 Audio', 'dll': 'Windows DLL', 'so': 'Shared Object', 'txt': 'Text File', 'json': 'JSON', 'vas': 'Valve Script' };
        return types[ext] || 'Unknown';
    }

    isBinaryFile(filename) {
        const binaryExtensions = ['dll', 'so', 'png', 'jpg', 'jpeg', 'ogg', 'wav', 'mp3'];
        const ext = filename.split('.').pop().toLowerCase();
        return binaryExtensions.includes(ext);
    }

    updateFileList() {
        const fileList = document.getElementById('fileList');
        const fileCount = document.getElementById('fileCount');
        const totalSize = document.getElementById('totalSize');

        if (this.files.size === 0) {
            fileList.innerHTML = '<p class="empty-state">No files uploaded yet</p>';
            fileCount.textContent = '0';
            totalSize.textContent = '0 B';
            document.getElementById('processBtn').disabled = true;
            return;
        }

        fileList.innerHTML = '';
        let total = 0;

        this.files.forEach((file, filename) => {
            total += file.size;
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = `<div class="file-info"><h3>${file.name}</h3><div class="file-meta"><p>Type: ${file.type}</p><p>Size: ${this.formatSize(file.size)}</p></div></div><button class="file-remove" onclick="app.removeFile('${filename.replace(/'/g,"\\'")}')">✕</button>`;
            fileList.appendChild(item);
        });

        fileCount.textContent = this.files.size;
        totalSize.textContent = this.formatSize(total);
        document.getElementById('processBtn').disabled = false;
    }

    removeFile(filename) {
        this.files.delete(filename);
        this.updateFileList();
        this.log(`Removed file: ${filename}`, 'info');
    }

    clearFiles() {
        if (this.files.size > 0 && confirm('Clear all files?')) {
            try { window.Module.ccall('clearFiles', null, [], []); } catch (e) {}
            this.files.clear();
            document.getElementById('fileInput').value = '';
            document.getElementById('outputSection').style.display = 'none';
            this.updateFileList();
            this.log('All files cleared', 'info');
        }
    }

    processFiles() {
        if (!this.wasmReady) {
            this.log('❌ WebAssembly module not ready yet...', 'error');
            alert('Application is initializing. Please wait.');
            return;
        }
        if (this.files.size === 0) {
            alert('Please upload files first');
            return;
        }

        this.log('Starting file processing...', 'info');
        document.getElementById('logsSection').style.display = 'block';

        try {
            const cppFiles = Array.from(this.files.values()).filter(f => ['C++ Source', 'Header', 'C Source'].includes(f.type));
            const otherAssets = Array.from(this.files.values()).filter(f => !['C++ Source', 'Header', 'C Source'].includes(f.type));

            if (cppFiles.length > 0) {
                this.log(`📂 Found ${cppFiles.length} C++ files and ${otherAssets.length} assets`, 'success');
                this.generateCompilableProject(cppFiles, otherAssets);
            } else {
                this.generateStandardProject();
            }

            document.getElementById('outputSection').style.display = 'block';
        } catch (error) {
            this.log(`Error: ${error.message}`, 'error');
        }
    }

    generateCompilableProject(cppFiles, assets) {
        this.log('🔧 Preparing C++ project for automatic compilation...', 'info');

        const projectInfo = {
            name: 'CompiledProject',
            files: cppFiles.map(f => ({ name: f.name, type: f.type })),
            assets: assets.map(f => ({ name: f.name, type: f.type }))
        };

        const projectJson = JSON.stringify(projectInfo, null, 2);
        document.getElementById('manifestOutput').value = projectJson;

        // initially show instructions while compilation runs
        document.getElementById('htmlOutput').value = this.generateCompilationHTML(cppFiles, assets, projectInfo);

        // analysis until compile finishes
        let analysisHtml = `<h3>C++ Project Ready for Compilation</h3>`;
        analysisHtml += `<p><strong>C++ Files:</strong> ${cppFiles.length}</p>`;
        analysisHtml += `<p><strong>Header Files:</strong> ${cppFiles.filter(f => f.type === 'Header').length}</p>`;
        analysisHtml += `<p><strong>Assets:</strong> ${assets.length}</p>`;
        analysisHtml += `<div style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 10px;">`;
        analysisHtml += `<h4>📡 Compiling automatically on server...</h4>`;
        analysisHtml += `</div>`;
        document.getElementById('analysisOutput').innerHTML = analysisHtml;

        // kick off remote compilation
        this.compileProject(cppFiles, assets, projectInfo);
    }

    generateCompilationHTML(cppFiles, assets, projectInfo) {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectInfo.name} - Compiled Project</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
        }
        header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .file-list {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .file-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: white;
            margin-bottom: 10px;
            border-radius: 4px;
            border-left: 3px solid #667eea;
        }
        .file-item strong {
            color: #667eea;
        }
        .file-type {
            font-size: 0.85em;
            color: #888;
            background: #f0f0f0;
            padding: 2px 8px;
            border-radius: 3px;
        }
        .compilation-guide {
            background: #fffbea;
            border-left: 4px solid #ffc107;
            padding: 20px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .compilation-guide h3 {
            color: #ff9800;
            margin-bottom: 10px;
        }
        .code-block {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            margin: 10px 0;
            line-height: 1.5;
        }
        .btn {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 5px 10px 0;
            transition: all 0.3s ease;
            text-decoration: none;
        }
        .btn:hover {
            background: #764ba2;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .btn-primary { background: #667eea; }
        .btn-primary:hover { background: #764ba2; }
        .btn-success { background: #4caf50; }
        .btn-success:hover { background: #45a049; }
        footer {
            background: #f5f5f5;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ddd;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-box .number {
            font-size: 2.5em;
            font-weight: bold;
        }
        .stat-box .label {
            font-size: 0.9em;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 ${projectInfo.name}</h1>
            <p>WebAssembly Compiled C++ Project</p>
        </header>
        
        <div class="content">
            <div class="stats">
                <div class="stat-box">
                    <div class="number">${cppFiles.length}</div>
                    <div class="label">C++ Files</div>
                </div>
                <div class="stat-box">
                    <div class="number">${cppFiles.filter(f => f.type === 'Header').length}</div>
                    <div class="label">Headers</div>
                </div>
                <div class="stat-box">
                    <div class="number">${assets.length}</div>
                    <div class="label">Assets</div>
                </div>
            </div>

            <div class="section">
                <h2>📄 Source Files</h2>
                <div class="file-list">
                    ${cppFiles.map(f => `
                        <div class="file-item">
                            <div><strong>${f.name}</strong></div>
                            <span class="file-type">${f.type}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${assets.length > 0 ? `
            <div class="section">
                <h2>🎨 Assets</h2>
                <div class="file-list">
                    ${assets.map(f => `
                        <div class="file-item">
                            <div><strong>${f.name}</strong></div>
                            <span class="file-type">${f.type}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="section">
                <h2>🔧 Compilation Instructions</h2>
                
                <div class="compilation-guide">
                    <h3>✨ Getting Started</h3>
                    <p>This project is ready to be compiled into WebAssembly. Follow the steps below to compile and run it in your browser:</p>
                </div>

                <h3>Step 1: Install Emscripten</h3>
                <p>If you don't have Emscripten installed, get it here: <strong>https://emscripten.org/docs/getting_started/downloads.html</strong></p>

                <h3>Step 2: Compile Your C++ Code</h3>
                <p>Navigate to your project directory and run:</p>
                <div class="code-block">
# Basic compilation (for console output)
emcc ${cppFiles[0].name} -o output.js -s WASM=1

# With optimizations
emcc ${cppFiles[0].name} -o output.js -s WASM=1 -O3

# For interactive web apps with bindings
emcc ${cppFiles[0].name} -o output.js --bind -s WASM=1
                </div>

                <h3>Step 3: Run in Browser</h3>
                <p>The compiler generates:</p>
                <ul style="margin-left: 20px; margin-top: 10px;">
                    <li><code>output.js</code> - JavaScript bindings and Emscripten runtime</li>
                    <li><code>output.wasm</code> - Your compiled WebAssembly binary</li>
                </ul>
                <p style="margin-top: 10px;">You can then embed them in an HTML file like this:</p>
                <div class="code-block">
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;title&gt;My WASM App&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;Hello from WebAssembly!&lt;/h1&gt;
    &lt;div id="output"&gt;&lt;/div&gt;

    &lt;script src="output.js"&gt;&lt;/script&gt;
    &lt;script&gt;
        // After module loads, call your functions
        Module.onRuntimeInitialized = () =&gt; {
            // Your C++ functions are now available!
        };
    &lt;/script&gt;
&lt;/body&gt;
&lt;/html&gt;
                </div>

                <div class="compilation-guide">
                    <h3>💡 Tips</h3>
                    <ul style="margin-left: 20px;">
                        <li>Use <code>--bind</code> flag to expose C++ classes and functions to JavaScript</li>
                        <li>Use <code>-O3</code> for optimized builds</li>
                        <li>Use <code>-g</code> for debugging information</li>
                        <li>Check Emscripten docs for more compiler flags</li>
                    </ul>
                </div>
            </div>

            <div class="section">
                <h2>📦 Project Contents</h2>
                <p><strong>Project Name:</strong> ${projectInfo.name}</p>
                <p><strong>Total Files:</strong> ${cppFiles.length + assets.length}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
        </div>

        <footer>
            <p>🚀 Built with Emscripten - Compile C++ to WebAssembly</p>
            <p style="margin-top: 10px; font-size: 0.9em; color: #999;">
                Learn more at <a href="https://emscripten.org" target="_blank" style="color: #667eea;">emscripten.org</a>
            </p>
        </footer>
    </div>
</body>
</html>`;
        return html;
    }

    generateStandardProject() {
        this.log('📦 Generating standard file package...', 'info');
        window.Module.ccall('clearFiles', null, [], []);
        let successCount = 0;
        this.files.forEach((file, filename) => {
            window.Module.ccall('addFile', null, ['string', 'string', 'string'], [filename, file.type, file.content]);
            this.log(`Processing: ${filename}`, 'info');
            successCount++;
        });

        this.log(`Added ${successCount} files`, 'success');
        const manifest = window.Module.ccall('generateManifest', 'string', [], []);
        const htmlIndex = window.Module.ccall('generateHtmlIndex', 'string', [], []);
        const fileCount = window.Module.ccall('getFileCount', 'number', [], []);

        this.displayResults(manifest, htmlIndex, fileCount);
    }

    displayResults(manifest, htmlIndex, fileCount) {
        document.getElementById('manifestOutput').value = JSON.stringify(JSON.parse(manifest), null, 2);
        document.getElementById('htmlOutput').value = htmlIndex.replace(/></g, '>\n<');
        let html = '<div class="analysis-container">';
        for (let i = 0; i < fileCount; i++) {
            const infoStr = window.Module.ccall('getFileInfo', 'string', ['number'], [i]);
            const fileInfo = JSON.parse(infoStr);
            const file = this.files.get(fileInfo.name);
            const hasMain = file && file.content.includes('int main');
            const lineCount = file ? (file.content.match(/\n/g) || []).length + 1 : 0;
            html += `<div class="analysis-item"><h4>${fileInfo.name}</h4><p><strong>Type:</strong> ${fileInfo.type}</p><p><strong>Size:</strong> ${this.formatSize(fileInfo.size)}</p>`;
            if (fileInfo.type.includes('Source')) {
                html += `<p><strong>Lines:</strong> ${lineCount}</p><p><strong>Has main():</strong> ${hasMain ? 'Yes' : 'No'}</p>`;
            }
            html += '</div>';
        }
        html += '<div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">';
        html += '<h4 style="margin-bottom: 15px;">📥 Download Files</h4>';
        html += '<button class="btn" onclick="downloadFile(\'manifest.json\', document.getElementById(\'manifestOutput\').value)" style="margin-right: 10px;">JSON Manifest</button>';
        html += '<button class="btn" onclick="downloadFile(\'index.html\', document.getElementById(\'htmlOutput\').value)">HTML Index</button>';
        html += '</div>';
        html += '</div>';
        document.getElementById('analysisOutput').innerHTML = html || '<p>No files</p>';
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    // send project files to server for compilation
    compileProject(cppFiles, assets, projectInfo) {
        this.log('🚀 Sending files to backend compiler...', 'info');
        const payload = {
            files: []
        };
        cppFiles.forEach(f => payload.files.push({ name: f.name, content: f.content }));
        assets.forEach(f => payload.files.push({ name: f.name, content: f.content }));
        
        fetch('/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(resp => resp.json())
        .then(data => {
            if (data.error) {
                this.log(`❌ Compilation failed: ${data.stderr || data.error}`, 'error');
                return;
            }
            this.log('✅ Compilation finished on server', 'success');
            this.compiledJS = data.js;
            this.compiledWasm = data.wasm;
            this.showCompiledPreview();
            document.getElementById('analysisOutput').innerHTML = this.generateAnalysis();
            // automatically switch to compiled view
            this.switchTab('compiled');
        })
        .catch(err => {
            this.log(`❌ Network error: ${err.message}`, 'error');
        });
    }

    showCompiledPreview() {
        // convert base64 strings to blobs
        const jsBlob = this.base64ToBlob(this.compiledJS, 'application/javascript');
        const wasmBlob = this.base64ToBlob(this.compiledWasm, 'application/wasm');
        const jsUrl = URL.createObjectURL(jsBlob);
        const wasmUrl = URL.createObjectURL(wasmBlob);
        
        const preview = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Compiled Preview</title></head>
<body>
<h2>🔧 Compiled Output</h2>
<script>var Module = { wasmBinaryFile: '${wasmUrl}' };</script>
<script src="${jsUrl}"></script>
</body>
</html>`;
        // populate HTML tab with preview as well
        document.getElementById('htmlOutput').value = preview;
        // update compiled tab content
        this.updateCompiledTab(preview);
    }

    updateCompiledTab(previewHtml) {
        const container = document.getElementById('compiledOutput');
        if (!container) return;
        let html = `<p>✅ Compilation succeeded. Files are ready.</p>`;
        html += `<button class="btn" onclick="app.downloadCompiled()">Download output.js + output.wasm</button>`;
        html += `<h3 style=\"margin-top:20px;\">Preview:</h3>`;
        html += `<iframe style=\"width:100%;height:400px;\" srcdoc=\"${previewHtml.replace(/"/g,'&quot;')}\"></iframe>`;
        container.innerHTML = html;
    }

    base64ToBlob(base64, mime) {
        const bytes = atob(base64);
        const len = bytes.length;
        const buf = new Uint8Array(len);
        for (let i = 0; i < len; i++) buf[i] = bytes.charCodeAt(i);
        return new Blob([buf], { type: mime });
    }

    downloadCompiled() {
        if (this.compiledJS) {
            const blob = this.base64ToBlob(this.compiledJS, 'application/javascript');
            this.downloadBlob(blob, 'output.js');
        }
        if (this.compiledWasm) {
            const blob = this.base64ToBlob(this.compiledWasm, 'application/wasm');
            this.downloadBlob(blob, 'output.wasm');
        }
        this.log('✅ Compiled files downloaded', 'success');
    }

    formatSize(bytes) {
        const sizes = ['B', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 B';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    log(message, type = 'info') {
        const logs = document.getElementById('logs');
        if (!logs) return;
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logs.appendChild(entry);
        logs.scrollTop = logs.scrollHeight;
    }
}

let app;

function wasmReady() {
    try {
        if (typeof window.Module === 'undefined' || !window.Module.ccall) {
            throw new Error('ccall function not found');
        }
        app = new FileConverterApp();
        console.log('✅ App initialized');
    } catch (error) {
        console.error('❌ Init failed:', error);
        const indicator = document.getElementById('statusIndicator');
        if (indicator) indicator.innerHTML = `<span style="color: #e74c3c;">❌ ${error.message}</span>`;
    }
}

function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

window.addEventListener('DOMContentLoaded', () => {
    if (typeof window.Module !== 'undefined') {
        if (!window.Module.onRuntimeInitialized) {
            window.Module.onRuntimeInitialized = wasmReady;
        } else {
            const oldCallback = window.Module.onRuntimeInitialized;
            window.Module.onRuntimeInitialized = () => {
                if (typeof oldCallback === 'function') oldCallback();
                wasmReady();
            };
        }
        if (window.Module.calledRun) wasmReady();
    }
});
