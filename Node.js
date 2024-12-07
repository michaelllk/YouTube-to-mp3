const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

app.post('/convert', async (req, res) => {
    const { url } = req.body;
    if (!ytdl.validateURL(url)) {
        return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
    }
    
    const videoID = ytdl.getURLVideoID(url);
    const outputPath = path.join(__dirname, `${videoID}.mp3`);

    try {
        const stream = ytdl(url, { filter: 'audioonly' });
        ffmpeg(stream)
            .audioBitrate(128)
            .save(outputPath)
            .on('end', () => {
                res.json({ success: true, fileUrl: `http://your-backend-url.com/files/${videoID}.mp3` });
            })
            .on('error', (err) => {
                console.error(err);
                res.status(500).json({ success: false, message: 'Error during conversion' });
            });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/files/:filename', (req, res) => {
    const filePath = path.join(__dirname, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath, () => fs.unlinkSync(filePath));
    } else {
        res.status(404).send('File not found');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  
