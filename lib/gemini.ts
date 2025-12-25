export async function getLatestSecurityNews() {
  try {
    const response = await fetch('/api/news');
    return await response.json();
  } catch (error) {
    return [{ title: "サーバーエラー。再起動してください。", severity: "Error", time: "Now" }];
  }
}