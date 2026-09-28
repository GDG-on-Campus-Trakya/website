/** @type {import('tailwindcss').Config} */
const token = (name) => `oklch(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  future: {
    // hover: styles only apply on devices that can hover, so touch never gets stuck states
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)"],
        display: ["var(--font-display)"],
        outlier: ["var(--font-outlier)"],
      },
      screens: {
        xs: "320px",
        "2xs": "280px",
      },
      colors: {
        // Legacy overrides. Remove once no page uses purple-500 / pink-500 / red-500 / yellow-500.
        "purple-500": "#9b5de5",
        "pink-500": "#f15bb5",
        "red-500": "#ee6352",
        "yellow-500": "#f9c74f",

        // Design tokens (see tokens.css)
        paper: { DEFAULT: token("paper"), 2: token("paper-2"), 3: token("paper-3") },
        ink: { DEFAULT: token("ink"), 2: token("ink-2") },
        rule: token("rule"),
        edge: token("edge"),
        brand: { DEFAULT: token("accent"), hover: token("accent-hover"), ink: token("accent-ink") },
        focus: token("focus"),
        error: token("error"),
        success: token("success"),
        warning: token("warning"),
        mark: {
          blue: token("mark-blue"),
          red: token("mark-red"),
          yellow: token("mark-yellow"),
          green: token("mark-green"),
        },
        stage: {
          DEFAULT: token("stage"),
          2: token("stage-2"),
          rule: token("stage-rule"),
          ink: token("stage-ink"),
          muted: token("stage-muted"),
        },

        // shadcn semantic names, mapped onto the tokens
        background: token("paper"),
        foreground: token("ink"),
        card: { DEFAULT: token("paper"), foreground: token("ink") },
        popover: { DEFAULT: token("paper"), foreground: token("ink") },
        primary: { DEFAULT: token("accent"), foreground: token("accent-ink") },
        secondary: { DEFAULT: token("paper-2"), foreground: token("ink") },
        muted: { DEFAULT: token("paper-2"), foreground: token("muted") },
        accent: { DEFAULT: token("paper-2"), foreground: token("ink") },
        destructive: { DEFAULT: token("error"), foreground: token("accent-ink") },
        border: token("rule"),
        input: token("edge"),
        ring: token("focus"),
        chart: {
          1: token("mark-blue"),
          2: token("mark-red"),
          3: token("mark-yellow"),
          4: token("mark-green"),
          5: token("ink-2"),
        },
      },
      fontSize: {
        md: ["var(--text-md)", { lineHeight: "1.5" }],
        "display-s": ["var(--text-display-s)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        display: ["var(--text-display)", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md: "var(--radius)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        whisper: "var(--shadow-whisper)",
      },
      zIndex: {
        raised: "var(--z-raised)",
        dropdown: "var(--z-dropdown)",
        sticky: "var(--z-sticky)",
        modal: "var(--z-modal)",
        popover: "var(--z-popover)",
        toast: "var(--z-toast)",
        tooltip: "var(--z-tooltip)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
      },
      transitionDuration: {
        micro: "var(--dur-micro)",
        short: "var(--dur-short)",
        long: "var(--dur-long)",
      },
      maxWidth: {
        page: "var(--page-max)",
        measure: "var(--measure)",
      },
      spacing: {
        gutter: "var(--page-gutter)",
        control: "var(--control-h)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
