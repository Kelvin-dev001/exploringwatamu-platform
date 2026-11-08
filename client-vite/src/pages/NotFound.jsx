import { Compass } from 'lucide-react';
import { Container } from '@/components/ui/primitives';
import { Button } from '@/components/ui/button';
import { Rosette } from '@/components/brand/Patterns';
import Seo from '@/components/seo/Seo';

export default function NotFound() {
  return (
    <Container size="narrow" className="relative py-24 text-center">
      <Seo title="Page not found" noindex />
      <Rosette className="mx-auto text-sand-300" size={140} />
      <p className="eyebrow mt-8">404 · Lost at sea</p>
      <h1 className="mt-3 font-display text-4xl text-ocean-900 sm:text-5xl">This page drifted off with the tide</h1>
      <p className="mt-4 text-lg text-ocean-900/65">The link may be old or mistyped. Let’s get you back to the good stuff.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button to="/experiences"><Compass /> Browse experiences</Button>
        <Button to="/" variant="outline">Go home</Button>
      </div>
    </Container>
  );
}
