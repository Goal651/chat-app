/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';

const FileDisplay = () => {
    const [fileData, setFileData] = useState([]);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch('http://localhost:3001/test');
                if (!response.ok) {
                    throw new Error('Failed to fetch files');
                }
                const data = await response.json();
                setFileData(data);
            } catch (error) {
                console.error('Error fetching files:', error);
            }
        };

        fetchFiles();
    }, []);

    return (
        <div>
            {fileData.length > 0 ? (
                fileData.map((file, index) => (
                    <div key={index}>
                        <img src={`data:image/jpeg;base64,${btoa(
                            String.fromCharCode(...new Uint8Array(file.data.data))
                        )}`} alt="Fetched Image" />
                    </div>
                ))) : (
                <p>Loading files...</p>
            )}
        </div>
    );
};

export default FileDisplay;
