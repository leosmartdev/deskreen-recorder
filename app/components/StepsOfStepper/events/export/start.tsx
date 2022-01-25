module.exports = () => {
  const videoSelectBtn = (document.querySelector(
    '#videoSelectBtn'
  ) as unknown) as HTMLElement;
  if (videoSelectBtn) {
    videoSelectBtn.style.display = 'none';
  }
  const saveProgressBar = (document.querySelector(
    '#saveProgressBar'
  ) as unknown) as HTMLElement;
  if (saveProgressBar) {
    saveProgressBar.style.display = 'flex';
    saveProgressBar.style.width = '100%';
  }
};
