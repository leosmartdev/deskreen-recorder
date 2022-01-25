/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
const { createVideoFile } = require('./ffmpeg');

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    videoBuffer?: any;
  }
}

let recordedChunks: any[] | undefined = [];

const handleDataAvailable = (e: any) => {
  console.log('handleDataAvailable');
  if (recordedChunks === undefined) {
    return;
  }
  recordedChunks.push(e.data);
};

const handleStop = async () => {
  console.log('handleStop');
  const blob = new Blob(recordedChunks, { type: 'video/webm; codecs=vp9' });

  recordedChunks = [];

  window.videoBuffer = Buffer.from(await blob.arrayBuffer());
};

export { createVideoFile, handleDataAvailable, handleStop };
