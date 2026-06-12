import localFont from "next/font/local";

export const machine = localFont({
  src: "../public/fonts/ITCMachine-Regular.woff2",
  variable: "--font-display",
  display: "swap",
  fallback: ["Arial Narrow", "sans-serif"],
});

export const montserrat = localFont({
  src: [
    { path: "../public/fonts/Montserrat-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/Montserrat-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Montserrat-Italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/Montserrat-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/Montserrat-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
