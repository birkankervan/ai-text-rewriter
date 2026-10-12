/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx,html}"],
  // Attribute selector: Tailwind would add the plasmo- prefix to a class selector here
  darkMode: ["variant", '&:is([class~="appearance-dark"] *)'],
  prefix: "plasmo-"
}
