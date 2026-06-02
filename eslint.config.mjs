import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    ignores: [
      '.data/**',
      '.next/**',
      '.tools/**',
      'convex/_generated/**',
      'node_modules/**',
      'tsconfig.tsbuildinfo',
    ],
  },
];

export default config;
