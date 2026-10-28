export async function createEntry(diary, thoughts) {
  await diary.awesome.click();
  await diary.modal.waitFor();
  await diary.mood.waitFor();
  await diary.thoughts.fill(thoughts);
  await diary.save.click();
}
