import gluestackPlugin from '@gluestack-ui/nativewind-utils/tailwind-plugin';

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: ['app/**/*.{tsx,jsx,ts,js}', 'components/**/*.{tsx,jsx,ts,js}'],
  presets: [require('nativewind/preset')],
  plugins: [gluestackPlugin],
};
