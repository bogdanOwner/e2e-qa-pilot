import { test, expect } from './fixture.mjs';
import { createEntry } from './flows/create-entry.flow.mjs';

test('Screen toast is not the cloud-archive sentence', async ({ diary }) => {
  await createEntry(diary, 'A good day');
  await expect(diary.toast).toHaveText('Your diary was stored in the cloud archive.');
});
