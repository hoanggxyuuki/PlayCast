// Translation hook
import { useSettings } from '../contexts/SettingsContext';
import { translations, TranslationKey } from './translations';

export const useTranslation = () => {
  const { settings } = useSettings();
  const currentLanguage = settings.language;

  const t = (key: TranslationKey): string => {
    return translations[currentLanguage][key] || translations.en[key] || key;
  };

  return { t, language: currentLanguage };
};
