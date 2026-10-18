import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// base を './' にしておくと、GitHub Pages のようにサブパスで公開しても動きます。
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
