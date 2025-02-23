const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static(__dirname));

// API endpoint to get files from a specific directory
app.get('/api/files/:directory', (req, res) => {
    const directory = req.params.directory;
    const directoryPath = path.join(__dirname, 'materials', directory);
    
    try {
        const files = fs.readdirSync(directoryPath);
        const fileList = files.map(file => ({
            name: file,
            path: `/materials/${directory}/${file}`
        }));
        res.json(fileList);
    } catch (err) {
        res.json([]);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
