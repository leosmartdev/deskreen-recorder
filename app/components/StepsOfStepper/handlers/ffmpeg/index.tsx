/* eslint-disable import/prefer-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
const { start, end } = require('../../events/export');
const loadFfMpeg = require('./load-ffmpeg');
const createReadableVideoBuffer = require('./create-readable-video-buffer');

const createVideoFile = async (filePath: string) => {
  console.log('createVideoFile', filePath);
  const ffmpeg = loadFfMpeg();
  const readableVideoBuffer = createReadableVideoBuffer();

  await ffmpeg
    .input(readableVideoBuffer)
    .output(filePath)
    .withNoAudio()
    .on('start', start)
    .on('end', end)
    .run();
};

export { createVideoFile };
