// The animation engine, loaded after first paint by <LazyMotion> in main.jsx.
// domAnimation covers what the site uses (animate/exit/variants, hover/tap);
// switch to domMax only if layout or drag animations are added.
export { domAnimation as default } from 'motion/react';
