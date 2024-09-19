export default function Progress({ fileIndex, currentChunkIndex, chunkSize, currentFileIndex, file }) {
    let progress = 0
    if (File.finalFilename) {
        progress = 100
    } else {
        const uploading = fileIndex === currentFileIndex;
        const chunks = Math.ceil(file.size / chunkSize)
        if (uploading) {
            progress = Math.round(currentChunkIndex / chunks * 100)
        } else {
            progress = 0
        }
    }
    console.log(progress)
}