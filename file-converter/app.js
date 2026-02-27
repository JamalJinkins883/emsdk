// File Converter Application
class FileConverterApp {
    constructor() {
        this.files = new Map();
        this.converter = null;
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

        // File input handler
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files));

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        dropZone.addEventListener('click', () => fileInput.click());

        // Process button
        processBtn.addEventListener('click', () => this.processFiles());

        // Clear button
        clearBtn.addEventListener('click', () => this.clearFiles());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    async initializeWasm() {
        try {
            this.log('Initializing WebAssembly module...', 'info');
            
            // Wait for Module to load with timeout
            let retries = 0;
            const maxRetries = 50;
            
            while (!window.Module || !window.Module.FileConverter) {
                if (retries++ > maxRetries) {
                    throw new Error('WebAssembly module failed to load after 5 seconds');
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.converter = window.Module;
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
                
                this.log(`Added file: ${file.name} (${fileType})`, 'success');
            };

            // For binary files, read as ArrayBuffer and convert to base64
            if (this.isBinaryFile(file.name)) {
                reader.readAsArrayBuffer(file);
                reader.onload = (e) => {
                    const binary = new Uint8Array(e.target.result);
                    const base64 = btoa(String.fromCharCode(...binary));
                    this.files.set(file.name, {
                        name: file.name,
                        type: this.getFileType(file.name),
                        size: file.size,
                        content: base64,
                        isBinary: true
                    });
                    this.log(`Added file: ${file.name} (binary)`, 'success');
                    this.updateFileList();
                };
            } else {
                reader.readAsText(file);
            }
        });

        this.updateFileList();
    }

    getFileType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const types = {
            'cpp': 'C++ Source',
            'cc': 'C++ Source',
            'h': 'Header',
            'hpp': 'Header',
            'c': 'C Source',
            'png': 'PNG Image',
            'jpg': 'JPEG Image',
            'jpeg': 'JPEG Image',
            'ogg': 'OGG Audio',
            'wav': 'WAV Audio',
            'mp3': 'MP3 Audio',
            'dll': 'Windows DLL',
            'so': 'Shared Object',
            'txt': 'Text File',
            'json': 'JSON',
            'vas': 'Valve Script'
        };
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
            item.innerHTML = `
                <div class="file-info">
                    <h3>${file.name}</h3>
                    <div class="file-meta">
                        <p>Type: ${file.type}</p>
                        <p>Size: ${this.formatSize(file.size)}</p>
                    </div>
                </div>
                <button class="file-remove" onclick="app.removeFile('${filename}')">✕</button>
            `;
            fileList.appendChild(item);
        });

        fileCount.textContent = this.files.size;
        totalSize.textContent = this.formatSize(total);
        document.getElementById('processBtn').disabled = false;
    }
!this.wasmReady) {
            this.log('❌ WebAssembly module not ready yet. Please wait...', 'error');
            alert('Application is still initializing. Please wait a moment and try again.');
            return;
        }

        if (this.files.size === 0) {
            alert('Please upload files first');
            return;
        }

        this.log('Starting file processing...', 'info');
        document.getElementById('logsSection').style.display = 'block';

        try {
            // Create a new converter instance
            const converter = new window.Module.FileConverter();

            let successCount = 0;
            this.files.forEach((file, filename) => {
                converter.addFile(filename, file.type, file.content);
                this.log(`Processing: ${filename}`, 'info');
                successCount++;
            });

            this.log(`Added ${successCount} files to converter`, 'success');

            // Generate outputs
            const manifest = converter.generateManifest();
            const htmlIndex = converter.generateHtmlIndex();

            // Display results
            this.displayResults(manifest, htmlIndex, converter);

            this.log('File processing completed successfully!', 'success');
            document.getElementById('outputSection').style.display = 'block';

            converter.delete(); // Clean up
        } catch (error) {
            this.log(`Error during processing: ${error.message}`, 'error');
            console.error('Processing error:', error
                successCount++;
            });

            this.log(`Added ${successCount} files to converter`, 'success');

            // Generate outputs
            const manifest = converter.generateManifest();
            const htmlIndex = converter.generateHtmlIndex();

            // Display results
            this.displayResults(manifest, htmlIndex, converter);

            this.log('File processing completed successfully!', 'success');
            document.getElementById('outputSection').style.display = 'block';

            converter.delete(); // Clean up
        } catch (error) {
            this.log(`Error during processing: ${error.message}`, 'error');
        }
    }

    displayResults(manifest, htmlIndex, converter) {
        // Display manifest
        const manifestPretty = JSON.stringify(JSON.parse(manifest), null, 2);
        document.getElementById('manifestOutput').value = manifestPretty;

        // Display HTML
        document.getElementById('htmlOutput').value = this.formatHtml(htmlIndex);

        // Display analysis
        this.displayAnalysis(converter);
    }

    displayAnalysis(converter) {
        const analysisOutput = document.getElementById('analysisOutput');
        let html = '';

        for (let i = 0; i < converter.getFileCount(); i++) {
            const fileInfo = JSON.parse(converter.getFileInfo(i));
            
            let analysisHtml = `
                <div class="analysis-item">
                    <h4>${fileInfo.name}</h4>
                    <p><strong>Type:</strong> ${fileInfo.type}</p>
                    <p><strong>Size:</strong> ${this.formatSize(fileInfo.size)}</p>
            `;

            // Additional analysis for C++ files
            if (fileInfo.type.includes('Source') || fileInfo.type.includes('C++')) {
                const file = this.files.get(fileInfo.name);
                if (file) {
                    const cppAnalysis = converter.processCppFile(fileInfo.name);
                    const analyzed = JSON.parse(cppAnalysis);
                    analysisHtml += `
                        <p><strong>Lines of code:</strong> ${analyzed.lines || 'N/A'}</p>
                        <p><strong>Has main():</strong> ${analyzed.has_main ? 'Yes' : 'No'}</p>
                    `;
                }
            }

            analysisHtml += '</div>';
            html += analysisHtml;
        }

        analysisOutput.innerHTML = html || '<p>No files to analyze</p>';
    }

    formatHtml(html) {
        // Simple HTML formatting
        return html.replace(/></g, '>\n<');
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });

        // Deactivate all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Activate button
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
        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${timestamp}] ${message}`;
        // Verify Module exists and has FileConverter
        if (typeof window.Module === 'undefined' || !window.Module.FileConverter) {
            throw new Error('FileConverter class not found in Module');
        }
        
        app = new FileConverterApp();
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        const indicator = document.getElementById('statusIndicator');
        if (indicator) {
            indicator.innerHTML = `<span style="color: #e74c3c;">❌ ${error.message}</span>`;
        }
    }
}

// Global function for downloading
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

// Initialize app when page loads
window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Page loaded, waiting for WASM module...');
    
    if (typeof window.Module !== 'undefined') {
        console.log('📦 Module found, setting up initialization');
        
        // Set up the runtime initialized callback
        if (!window.Module.onRuntimeInitialized) {
            window.Module.onRuntimeInitialized = wasmReady;
        } else {
            // If callback already exists, wrap it
            const originalCallback = window.Module.onRuntimeInitialized;
            window.Module.onRuntimeInitialized = () => {
                if (typeof originalCallback === 'function') originalCallback();
                wasmReady();
            };
        }
        
        // If module is already initialized, call wasmReady immediately
        if (window.Module.calledRun) {
            console.log('⚡ Module already initialized, initializing app');
            wasmReady();
        }
    } else {
        console.error('❌ Module not found - converter.js may not be loaded');
        const indicator = document.getElementById('statusIndicator');
        if (indicator) {
            indicator.innerHTML = '<span style="color: #e74c3c;">❌ Failed to load WASM module</span>';
        }
        } else {
            Module.onRuntimeInitialized = wasmReady;
        }
        
        // If FileConverter is already available, init immediately
        if (Module.FileConverter) {
            wasmReady();
        }
    } else {
        console.error('❌ Module not found - converter.js may not be loaded');
    }
});
