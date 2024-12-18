import { useEffect, useState } from "react";

interface FileMessagePreviewProps {
    key:number
    data: File;
    cancelFile: (fileName:string) => void;
}

export default function FileMessagePreview({ data, cancelFile }: FileMessagePreviewProps) {
    const [filePreview, setFilePreview] = useState<string>("");

    const handleCancelFile  = () => {
        cancelFile(data.name);
        setFilePreview("");
    }

    useEffect(() => {
        if (data) {
            const preview = URL.createObjectURL(data);
            setFilePreview(preview);

            // Cleanup the object URL when the component unmounts
            return () => URL.revokeObjectURL(preview);
        }
    }, [data]);

    return (
        <div className="relative rounded-box w-20 h-20">
            <button 
                className="absolute right-0 bg-gray-100 text-black text-sm w-5 h-5 rounded-full"
                onClick={handleCancelFile}
            >
                🗙
            </button>
            {filePreview && (
                <div className="flex items-center justify-center w-full h-full">
                    <img
                        src={filePreview}
                        alt="File Preview"
                        className="max-w-full max-h-full object-contain rounded-box"
                    />
                </div>
            )}
        </div>
    );
}
