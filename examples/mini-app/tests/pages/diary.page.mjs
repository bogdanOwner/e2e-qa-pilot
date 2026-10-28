export class DiaryPage {
  constructor(page) {
    this.page = page;
    this.awesome = page.getByRole('button', { name: 'Awesome' });
    this.modal = page.getByRole('dialog', { name: 'Create Diary Entry' });
    this.mood = page.getByText('Mood: Awesome');
    this.thoughts = page.getByLabel('Thoughts');
    this.save = page.getByRole('button', { name: 'Save' });
    this.toast = page.getByRole('status');
    this.preview = page.getByRole('list', { name: 'Mood Diary preview' });
    this.chartDot = page.getByLabel('chart dot');
  }

  async open() {
    await this.page.goto('/');
  }
}
