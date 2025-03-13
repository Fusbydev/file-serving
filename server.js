const http = require("http");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const formidable = require("formidable");

const uploadDir = path.join(__dirname, "uploads");

// Ensure the uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const server = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/upload") {
        const form = new formidable.IncomingForm();
        form.uploadDir = uploadDir;
        form.keepExtensions = true;
        form.maxFileSize = 10 * 1024 * 1024; // 10MB max file size

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Error processing file upload.");
                return;
            }

            const file = files.file;
            if (!file) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                res.end("No file uploaded.");
                return;
            }

            const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
            if (!allowedTypes.includes(file.mimetype)) {
                fs.unlinkSync(file.filepath); // Delete the file if not allowed
                res.writeHead(400, { "Content-Type": "text/plain" });
                res.end("Invalid file type. Only PNG, JPEG, and PDF are allowed.");
                return;
            }

            const newFilePath = path.join(uploadDir, file.originalFilename);
            fs.rename(file.filepath, newFilePath, (renameErr) => {
                if (renameErr) {
                    res.writeHead(500, { "Content-Type": "text/plain" });
                    res.end("Error saving the file.");
                    return;
                }

                res.writeHead(200, { "Content-Type": "text/plain" });
                res.end(`File uploaded successfully: ${file.originalFilename}`);
            });
        });
    } else {
        const filePath = path.join(__dirname, "public", req.url === "/" ? "index.html" : req.url);

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(err.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/html" });
                res.end(err.code === "ENOENT" ? "<h1>File Not Found</h1>" : `Server Error: ${err.code}`);
            } else {
                res.writeHead(200, { "Content-Type": mime.lookup(filePath) });
                res.end(content, "utf-8");
            }
        });
    }
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
