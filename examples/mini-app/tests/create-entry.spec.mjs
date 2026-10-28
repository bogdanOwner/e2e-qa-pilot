import { test, expect } from './fixture.mjs';
import { createEntry } from './flows/create-entry.flow.mjs';

test('Save an Awesome diary entry and show the screen toast', async ({ diary }) => {
  test.info().annotations.push(
    { type: 'case-step', description: 'Save an Awesome entry' },
    { type: 'page-contract', description: 'pages/diary.md' },
  );
  await createEntry(diary, 'A good day');
  await expect(diary.mood).toBeHidden();
  await expect(diary.toast).toHaveText('Your Diary entry successfully created!');
  await expect(diary.modal).toBeHidden();
  await expect(diary.preview).toContainText('A good day');
  await expect(diary.chartDot).toBeVisible();
});
