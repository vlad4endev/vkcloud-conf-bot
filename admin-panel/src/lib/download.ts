export async function downloadAdminExport(path: string, filename: string): Promise<void> {
  const token = localStorage.getItem('admin_token');
  const response = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('Не удалось скачать файл');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
