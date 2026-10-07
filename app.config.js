// Дар GitHub Pages сайт дар зерроҳ (/ZabonDon/) хизмат мешавад. Роҳи пойгоҳ танҳо ҳангоми нашр
// (EXPO_BASE_URL) гузошта мешавад, то сервери маҳаллӣ (localhost:8082) бетағйир кор кунад.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments ?? {}),
    ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}),
  },
});
