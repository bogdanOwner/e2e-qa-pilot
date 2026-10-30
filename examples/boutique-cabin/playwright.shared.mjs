export function createConfig() {
  const port = Number(process.env.PORT || 4173);
  const baseURL = `http://127.0.0.1:${port}`;
  return {
    testDir: './tests',
    timeout: 60_000,
    expect: { timeout: 20_000 },
    testIgnore: ['**/stored-pages.spec.mjs'],
    use: { baseURL },
    webServer: {
      command: 'node server.mjs',
      env: { ...process.env, PORT: String(port) },
      url: baseURL,
      reuseExistingServer: false,
    },
  };
}
