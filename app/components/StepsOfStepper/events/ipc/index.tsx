/* eslint-disable no-console */
/* eslint-disable import/prefer-default-export */
const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
const { createVideoFile } = require('../../handlers');

const exportVideo = async (ext: string) => {
  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.${ext}`,
  });

  if (filePath) {
    await createVideoFile(filePath);
  }
};

ipcRenderer.on('select-output', (_event, source) => {
  exportVideo(source.id);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const invokeContextMenu = (data: any, type: any) => {
  ipcRenderer.invoke('context-menu', JSON.stringify({ data, type }));
};

export { invokeContextMenu };
