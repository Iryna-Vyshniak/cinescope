/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx,html}"
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    red: '#E50914',
                    redHover: '#F40612',
                    black: '#141414',
                    gray: '#2B2B2B',
                    light: '#E5E5E5',
                    white: '#FFFFFF'
                }
            },
            fontFamily: {
                sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
            }
        }
    },
    plugins: [],


}