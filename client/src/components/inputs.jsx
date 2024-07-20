import  { useState, useRef } from 'react';

const FileAndTextInput = () => {
    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const textAreaRef = useRef(null);

    const handleTextChange = (e) => {
        setText(e.target.value);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setFiles([...files, ...e.dataTransfer.files]);
            e.dataTransfer.clearData();
        }
    };

    const handlePaste = (e) => {
        const clipboardItems = e.clipboardData.items;
        const pastedFiles = [];
        for (let i = 0; i < clipboardItems.length; i++) {
            if (clipboardItems[i].kind === 'file') {
                const file = clipboardItems[i].getAsFile();
                pastedFiles.push(file);
            }
        }
        if (pastedFiles.length > 0) {
            setFiles([...files, ...pastedFiles]);
            e.preventDefault();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Text:', text);
        console.log('Files:', files);
    };

    return (
        <div>
            <div
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
            >
                <textarea
                    ref={textAreaRef}
                    value={text}
                    onChange={handleTextChange}
                    onPaste={handlePaste}
                    placeholder="Type or paste text/files here..."
                    rows="4"
                    cols="50"
                />
            </div>
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
};

export default FileAndTextInput;
