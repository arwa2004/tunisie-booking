const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

module.exports = createJestConfig({
  // jsdom simule un vrai navigateur en mémoire (nécessaire pour les composants React)
  testEnvironment: 'jsdom',

  // Charge les matchers spéciaux de jest-dom avant chaque test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Support des alias Next.js comme @/components
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Indique à Jest de mesurer la couverture de TOUS les fichiers du code source
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts', // Exclure les fichiers de types TypeScript
    '!src/app/api/**', // Exclure les routes API Next.js si nécessaire
  ],

  // Patterns des fichiers de tests à détecter
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
});