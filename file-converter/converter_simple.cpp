#include <string>
#include <vector>
#include <sstream>
#include <cstring>
#include <algorithm>

// Global state for file conversion
struct FileInfo {
    std::string name;
    std::string type;
    std::string content;
};

static std::vector<FileInfo> files;

extern "C" {
    void addFile(const char* name_ptr, const char* type_ptr, const char* content_ptr) {
        FileInfo info;
        info.name = std::string(name_ptr ? name_ptr : "");
        info.type = std::string(type_ptr ? type_ptr : "");
        info.content = std::string(content_ptr ? content_ptr : "");
        files.push_back(info);
    }

    int getFileCount() {
        return (int)files.size();
    }

    const char* getFileInfo(int index) {
        static std::string result;
        if (index < 0 || index >= (int)files.size()) {
            result = "{}";
            return result.c_str();
        }
        std::stringstream ss;
        ss << "{\"name\":\"" << files[index].name << "\","
           << "\"type\":\"" << files[index].type << "\","
           << "\"size\":" << files[index].content.length() << "}";
        result = ss.str();
        return result.c_str();
    }

    const char* generateManifest() {
        static std::string result;
        std::stringstream ss;
        ss << "{\"files\":[";
        for (size_t i = 0; i < files.size(); ++i) {
            if (i > 0) ss << ",";
            ss << "{\"name\":\"" << files[i].name << "\","
               << "\"type\":\"" << files[i].type << "\","
               << "\"size\":" << files[i].content.length() << "}";
        }
        unsigned long total = 0;
        for (const auto& f : files) {
            total += f.content.length();
        }
        ss << "],\"total_size\":" << total << "}";
        result = ss.str();
        return result.c_str();
    }

    const char* generateHtmlIndex() {
        static std::string result;
        std::stringstream html;
        html << "<!DOCTYPE html>\n"
             << "<html>\n"
             << "<head><title>Converted Project</title></head>\n"
             << "<body>\n"
             << "<h1>Project Files</h1>\n"
             << "<ul>\n";
        for (const auto& f : files) {
            html << "<li>" << f.name << " (" << f.type << ", " 
                 << f.content.length() << " bytes)</li>\n";
        }
        html << "</ul>\n"
             << "</body>\n"
             << "</html>";
        result = html.str();
        return result.c_str();
    }

    void clearFiles() {
        files.clear();
    }
}
