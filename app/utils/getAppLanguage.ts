import settings from 'electron-settings';

export default function getAppLanguage(): string {
  return settings.hasSync('appLanguage')
    ? (settings.getSync('appLanguage') as string)
    : 'en';
}
