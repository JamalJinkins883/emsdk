#!/usr/bin/env python3
"""Simple Flask server that serves the static frontend and compiles C/C++
projects using the installed Emscripten toolchain.

Usage:
    python3 server.py

The server listens on port 8000 (configurable) and exposes:
    GET /            -> serves index.html
    GET /<path>      -> serves static files from the directory
    POST /compile    -> accepts JSON with project files and returns compiled
                       output.js/wasm as base64 strings.

This makes the web app fully automatic: users upload C++ code and the
backend runs `emcc` to produce WebAssembly without manual steps.
"""

import os
import tempfile
import subprocess
import shutil
import base64
from flask import Flask, request, jsonify, send_from_directory

# location of this script's folder (frontend files)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")

@app.route("/compile", methods=["POST"])
def compile_endpoint():
    data = request.get_json()
    if not data or "files" not in data:
        return jsonify({"error": "no files provided"}), 400

    files = data["files"]
    tmpdir = tempfile.mkdtemp(prefix="emsdk_compile_")
    try:
        # write each file to disk
        for f in files:
            name = f.get("name")
            content = f.get("content")
            if not name or content is None:
                continue
            dest = os.path.join(tmpdir, name)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            # content may be binary encoded in base64 already or plain text
            if isinstance(content, str):
                # check if looks like base64 (contains non-printable)
                try:
                    decoded = base64.b64decode(content)
                    # if decode succeeds and larger than a few bytes, assume binary
                    if b"\x00" in decoded or len(decoded) > len(content):
                        with open(dest, "wb") as fh:
                            fh.write(decoded)
                    else:
                        with open(dest, "w", encoding="utf-8") as fh:
                            fh.write(content)
                except Exception:
                    with open(dest, "w", encoding="utf-8") as fh:
                        fh.write(content)
            else:
                with open(dest, "wb") as fh:
                    fh.write(content)

        # find source files
        sources = []
        for root, _, filenames in os.walk(tmpdir):
            for fn in filenames:
                if fn.endswith(('.cpp', '.cc', '.c', '.cxx')):
                    sources.append(os.path.join(root, fn))

        if not sources:
            return jsonify({"error": "no C/C++ source files found"}), 400

        output_js = os.path.join(tmpdir, "output.js")
        output_wasm = os.path.join(tmpdir, "output.wasm")

        cmd = ["emcc", *sources, "-o", output_js, "-s", "WASM=1", "-O3"]
        proc = subprocess.run(cmd, cwd=tmpdir, capture_output=True, text=True)
        if proc.returncode != 0:
            return jsonify({
                "error": "compilation failed",
                "stderr": proc.stderr,
                "stdout": proc.stdout
            }), 500

        # read compiled outputs
        with open(output_js, "rb") as fh:
            js_b64 = base64.b64encode(fh.read()).decode("ascii")
        with open(output_wasm, "rb") as fh:
            wasm_b64 = base64.b64encode(fh.read()).decode("ascii")

        return jsonify({
            "js": js_b64,
            "wasm": wasm_b64,
            "stdout": proc.stdout,
            "stderr": proc.stderr
        })
    finally:
        shutil.rmtree(tmpdir)


@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(BASE_DIR, path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting server on http://0.0.0.0:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
