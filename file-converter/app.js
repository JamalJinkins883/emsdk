// File Converter Application using Emscripten ccall API
class FileConverterApp {
    constructor() {
        this.files = new Map();
        this.wasmReady = false;
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
        const processBtn = document.getElementById('processBtn');
        const clearBtn = document.getElementById('clearBtn');

        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));
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
            const reader = new FileReader();
            reader.onload = (e) => {
                const fileType = this.getFileType(file.name);
                this.files.set(file.name, {
                    name: file.name,
                    type: fileType,
                    size: file.size,
                    content: e.target.result
                });
                this.log(`Added file: ${file.name}`, 'success');
                this.updateFileList();
            };
            if (this.isBinaryFile(file.name)) {
                reader.readAsArrayBuffer(file);
                reader.onload = (e) => {
                    const binary = new Uint8Array(e.target.result);
                    const base64 = btoa(String.fromCharCode(...binary));
                    this.files.set(file.name, {
                        name: file.name,
                        type: this.getFileType(file.name),
                        size: file.size,
                        content: base64
                    });
                    this.log(`Added file: ${file.name} (binary)`, 'success');
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
            item.innerHTML = `<div class="file-info"><h3>${file.name}</h3><div class="file-meta"><p>Type: ${file.type}</p><p>Size: ${this.formatSize(file.size)}</p></div></div><button class="file-remove" onclick="app.removeFile('${filename}')">✕</button>`;
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
            window.Module.ccall('clearFiles', null, [], []);
            let successCount = 0;
            this.files.forEach((file, filename) => {
                window.Module.ccall('addFile', null, ['string', 'string', 'string'], [filename, file.type, file.content]);
                this.log(`Processing: ${filename}`, 'info');
                successCount++;
            });

            this.log(`Added ${successCount} files to converter`, 'success');
            const manifest = window.Module.ccall('generateManifest', 'string', [], []);
            const htmlIndex = window.Module.ccall('generateHtmlIndex', 'string', [], []);
            const fileCount = window.Module.ccall('getFileCount', 'number', [], []);

            this.displayResults(manifest, htmlIndex, fileCount);
            this.log('Processing completed successfully!', 'success');
            document.getElementById('outputSection').style.display = 'block';
        } catch (error) {
            this.log(`Error: ${error.message}`, 'error');
        }
    }

    displayResults(manifest, htmlIndex, fileCount) {
        document.getElementById('manifestOutput').value = JSON.stringify(JSON.parse(manifest), null, 2);
        document.getElementById('htmlOutput').value = htmlIndex.replace(/></g, '>\n<');
        let html = '';
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
        document.getElementById('analysisOutput').innerHTML = html || '<p>No files</p>';
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
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
