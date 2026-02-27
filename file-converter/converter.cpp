#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include <string>
#include <vector>
#include <sstream>
#include <cstring>
#include <algorithm>

struct FileInfo {
    std::string name;
    std::string type;
    std::string content;
    unsigned int size;
};

class FileConverter {
private:
    std::vector<FileInfo> files;

public:
    FileConverter() {}

    // Add file data to converter
    void addFile(const std::string& name, const std::string& type, const std::string& content) {
        FileInfo file;
        file.name = name;
        file.type = type;
        file.content = content;
        file.size = content.length();
        files.push_back(file);
    }

    // Get file count
    int getFileCount() const {
        return files.size();
    }

    // Get file info
    std::string getFileInfo(int index) {
        if (index < 0 || index >= files.size()) {
            return "{}";
        }
        
        std::stringstream ss;
        ss << "{\"name\":\"" << files[index].name << "\","
           << "\"type\":\"" << files[index].type << "\","
           << "\"size\":" << files[index].size << "}";
        return ss.str();
    }

    // Process C++ files (extract includes, functions, classes)
    std::string processCppFile(const std::string& filename) {
        FileInfo* file = nullptr;
        for (auto& f : files) {
            if (f.name == filename) {
                file = &f;
                break;
            }
        }
        
        if (!file) {
            return "{\"error\":\"File not found\"}";
        }

        std::stringstream result;
        result << "{\"file\":\"" << filename << "\",";
        result << "\"lines\":" << std::count(file->content.begin(), file->content.end(), '\n') + 1 << ",";
        result << "\"size\":" << file->size << ",";
        result << "\"has_main\":" << (file->content.find("int main") != std::string::npos ? "true" : "false") << "}";
        
        return result.str();
    }

    // Generate manifest JSON
    std::string generateManifest() {
        std::stringstream ss;
        ss << "{\"files\":[";
        
        for (size_t i = 0; i < files.size(); ++i) {
            if (i > 0) ss << ",";
            ss << "{\"name\":\"" << files[i].name << "\","
               << "\"type\":\"" << files[i].type << "\","
               << "\"size\":" << files[i].size << "}";
        }
        
        ss << "],\"total_size\":" << getTotalSize() << "}";
        return ss.str();
    }

    // Clear all files
    void clearFiles() {
        files.clear();
    }

    // Get total size of all files
    unsigned long getTotalSize() const {
        unsigned long total = 0;
        for (const auto& f : files) {
            total += f.size;
        }
        return total;
    }

    // Generate HTML index file
    std::string generateHtmlIndex() {
        std::stringstream html;
        html << "<!DOCTYPE html>\n"
             << "<html>\n"
             << "<head><title>Converted Project</title></head>\n"
             << "<body>\n"
             << "<h1>Project Files</h1>\n"
             << "<ul>\n";
        
        for (const auto& f : files) {
            html << "<li>" << f.name << " (" << f.type << ", " << f.size << " bytes)</li>\n";
        }
        
        html << "</ul>\n"
             << "</body>\n"
             << "</html>";
        
        return html.str();
    }
};

// Bindings for Emscripten
EMSCRIPTEN_BINDINGS(file_converter) {
    emscripten::class_<FileConverter>("FileConverter")
        .constructor<>()
        .function("addFile", &FileConverter::addFile)
        .function("getFileCount", &FileConverter::getFileCount)
        .function("getFileInfo", &FileConverter::getFileInfo)
        .function("processCppFile", &FileConverter::processCppFile)
        .function("generateManifest", &FileConverter::generateManifest)
        .function("generateHtmlIndex", &FileConverter::generateHtmlIndex)
        .function("clearFiles", &FileConverter::clearFiles)
        .function("getTotalSize", &FileConverter::getTotalSize);
}
