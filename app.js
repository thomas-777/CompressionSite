const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Route to serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});



app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const operation = req.body.operation; // Get the operation (compress or decompress)
    const inputFilePath = path.join(__dirname, req.file.path);
    const fileNameWithoutExt = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const outputFilePath = path.join(
        __dirname,
        'processed',
        `${fileNameWithoutExt}.${operation === 'compress' ? 'bin' : 'text'}`
    );
    
    // Ensure the processed directory exists
    if (!fs.existsSync(path.join(__dirname, 'processed'))) {
        fs.mkdirSync(path.join(__dirname, 'processed'));
    }

    // Determine the command to execute
    const command = operation === 'compress'
        ? `./compressor ${inputFilePath} ${outputFilePath}`
        : `./decompressor ${inputFilePath} ${outputFilePath}`;

    // Execute the command
    exec(command, (err) => {
        fs.unlinkSync(inputFilePath); // Cleanup the uploaded file

        if (err) {
            console.error(`${operation} error:`, err);
            return res.status(500).send(`${operation}ion failed.`);
        }

        // Send the processed file to the user
        res.download(outputFilePath, `${fileNameWithoutExt}.${operation === 'compress' ? 'bin' : 'txt'}`, (err) => {
            if (err) console.error('Download error:', err);

            fs.unlinkSync(outputFilePath); // Cleanup the processed file after download
        });
    });
});
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});