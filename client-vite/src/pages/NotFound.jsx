import { Compass } from 'lucide-react';
import { Container } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Rosette } from '@/components/brand/Patterns';
import Seo from '@/components/seo/Seo';
import { useI18n } from '@/i18n';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <Container size="narrow" className="relative py-24 text-center">
      <Seo title={t('notFoundTitle')} noindex />
      <Rosette className="mx-auto text-sand-300" size={140} />
      <p className="eyebrow mt-8">{t('notFoundEyebrow')}</p>
      <h1 className="mt-3 font-display text-4xl text-ocean-900 sm:text-5xl">{t('notFoundHeading')}</h1>
      <p className="mt-4 text-lg text-ocean-900/65">{t('notFoundBody')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/experiences"><Compass /> {t('notFoundBrowse')}</Button>
        <Button to="/" variant="outline">{t('notFoundHome')}</Button>
      </div>
    </Container>
  );
}
