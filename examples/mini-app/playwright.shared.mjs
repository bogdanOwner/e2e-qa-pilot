export function createConfig({ mismatch }) {
  const port = Number(process.env.PORT || 4173);
  const baseURL = `http://127.0.0.1:${port}`;
  return {
    testDir: './tests',
    testIgnore: mismatch ? undefined : '**/mismatch.spec.mjs',
    testMatch: mismatch ? '**/mismatch.spec.mjs' : undefined,
    use: { baseURL },
    webServer: {
      command: 'node server.mjs',
      env: { ...process.env, PORT: String(port) },
      url: baseURL,
      reuseExistingServer: false,
    },
  };
}
