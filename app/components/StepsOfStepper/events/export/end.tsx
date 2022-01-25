module.exports = () => {
  const videoSelectBtn = (document.querySelector(
    '#videoSelectBtn'
  ) as unknown) as HTMLElement;
  const saveProgressBar = (document.querySelector(
    '#saveProgressBar'
  ) as unknown) as HTMLElement;
  if (saveProgressBar) {
    saveProgressBar.style.display = 'none';
  }
  if (videoSelectBtn) {
    videoSelectBtn.style.display = 'unset';
  }
};
