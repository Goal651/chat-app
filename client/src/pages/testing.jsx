import  { useState } from 'react';
import { ReactMic } from 'react-mic';

export default function AudioRecorder() {
    const [record, setRecord] = useState(false);
    const [audioURL, setAudioURL] = useState('');

    const startRecording = () => {
        setRecord(true);
    };

    const stopRecording = () => {
        setRecord(false);
    };

    const onStop = (recordedBlob) => {
        setAudioURL(URL.createObjectURL(recordedBlob.blob));
    };

    return (
        <div className="flex flex-col items-center p-4">
            <h1 className="text-2xl font-bold mb-4">Audio Recorder</h1>
            <ReactMic
                record={record}
                onStop={onStop}
                className="w-full h-48 border border-gray-300 rounded"
                mimeType="audio/wav"
                visualSetting="sinewave"
            />
            <div className="mt-4 flex space-x-4">
                <button
                    onClick={startRecording}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                    Start Recording
                </button>
                <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                    Stop Recording
                </button>
            </div>
            {audioURL && (
                <div className="mt-4">
                    <audio controls src={audioURL}>
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}
        </div>
    );
}
