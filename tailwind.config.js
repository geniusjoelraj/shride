/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        shride: {
          primary: '#41431B',     // Deep Moss (Primary Brand Color)
          secondary: '#AEB784',   // Sage Green (Secondary/Accent)
          accent: '#E3DBBB',      // Warm Sand (UI Accents/Borders)
          background: '#F8F3E1',  // Soft Cream (Main Background)
          surface: '#FEF9E7',     // Off-White (Card/Panel Surface)
          text: {
            primary: '#2B2D07',   // Dark Forest (High Contrast Text)
            secondary: '#60683D', // Muted Olive (Secondary Text)
          }
        }
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'], // For headers and dynamic data
        body: ['Outfit', 'sans-serif'],          // For readable body content
        mono: ['JetBrains Mono', 'monospace'],   // For telemetry and stats
      },
    },
  },
  plugins: [],
}
