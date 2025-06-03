import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // Kept for completeness, though might not be used
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // Primary path for App Router
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      // Add any existing theme extensions here if known, or leave as is for a new file.
      // For example, if amber and slate colors were custom extensions:
      // colors: {
      //   amber: {
      //     '50': '#fffbeb',
      //     '100': '#fef3c7',
      //     '200': '#fde68a',
      //     '300': '#fcd34d',
      //     '400': '#fbbf24',
      //     '500': '#f59e0b',
      //     '600': '#d97706',
      //     '700': '#b45309',
      //     '800': '#92400e',
      //     '900': '#78350f',
      //     '950': '#451a03',
      //   },
      // }
    },
  },
  plugins: [
    // Add any existing plugins here if known
    // require('@tailwindcss/forms'), // Example of a common plugin
  ],
};
export default config;
