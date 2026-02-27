.PHONY: build clean help server

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "$(GREEN)File Converter Build System$(NC)"
	@echo ""
	@echo "Available targets:"
	@echo "  $(YELLOW)make build$(NC)    - Build WebAssembly module"
	@echo "  $(YELLOW)make clean$(NC)    - Remove build artifacts"
	@echo "  $(YELLOW)make server$(NC)   - Start development server"
	@echo "  $(YELLOW)make help$(NC)     - Show this help message"

build:
	@echo "$(GREEN)🔨 Building File Converter...$(NC)"
	@mkdir -p build
	@echo "$(YELLOW)📦 Compiling converter.cpp...$(NC)"
	emcc converter.cpp \
		-o build/converter.js \
		--bind \
		-s WASM=1 \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]' \
		-O3
	@if [ $$? -eq 0 ]; then \
		echo "$(GREEN)✅ Compilation successful!$(NC)"; \
		echo "$(YELLOW)📂 Build output:$(NC)"; \
		ls -lh build/; \
	else \
		echo "$(RED)❌ Compilation failed!$(NC)"; \
		exit 1; \
	fi

clean:
	@echo "$(YELLOW)🗑️  Cleaning build artifacts...$(NC)"
	@rm -rf build/
	@echo "$(GREEN)✅ Clean complete$(NC)"

server:
	@echo "$(GREEN)🚀 Starting development server...$(NC)"
	@echo "$(YELLOW)📖 Open http://localhost:8000 in your browser$(NC)"
	python3 -m http.server 8000 --directory .

# Run build by default if just called
all: build
