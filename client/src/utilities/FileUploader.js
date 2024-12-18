import { useEffect } from 'react';
import axios from 'axios';
const FileUploader = ({ fileToSend, status, serverUrl, finalFileName }) => {
    const accessToken = localStorage.getItem('token');
    const MAX_RETRIES = 3;
    const uploadChunk = async (currentChunk = 0, retryCount = 0) => {
        if (!fileToSend)
            return;
        const chunkSize = 1 * 1024 * 1024; // 1MB chunk size
        const totalChunks = Math.ceil(fileToSend.size / chunkSize);
        const from = currentChunk * chunkSize;
        const to = Math.min(from + chunkSize, fileToSend.size);
        const blob = fileToSend.slice(from, to);
        try {
            const formData = new FormData();
            formData.append('file', blob);
            await axios.post(`${serverUrl}/api/uploadFile`, blob, {
                headers: {
                    accesstoken: accessToken,
                    name: encodeURIComponent(fileToSend.name),
                    type: fileToSend.type,
                    currentChunk,
                    totalChunks,
                    typeFolder: 'messages',
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (currentChunk + 1 < totalChunks) {
                uploadChunk(currentChunk + 1);
            }
            else {
                console.log('Upload complete');
                status(false);
                finalFileName(fileToSend.name);
            }
        }
        catch {
            if (retryCount < MAX_RETRIES) {
                console.warn(`Retrying chunk ${currentChunk}, attempt ${retryCount + 1}`);
                uploadChunk(currentChunk, retryCount + 1);
            }
            else {
                console.error(`Failed chunk ${currentChunk} after ${MAX_RETRIES} retries.`);
                status(false);
            }
        }
    };
    useEffect(() => {
        const sendFile = () => {
            if (!fileToSend)
                return;
            status(true);
            uploadChunk(0);
        };
        sendFile();
    }, [fileToSend]);
    return null;
};
export default FileUploader;
