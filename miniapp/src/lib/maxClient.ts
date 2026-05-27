export function isMaxWebApp(): boolean {
  const initData = window.WebApp?.initData?.trim() || window.MaxBridge?.initData?.trim();
  if (initData) {
    return true;
  }

  // В некоторых сценариях MAX инициализирует bridge позже или без initData.
  return Boolean(
    window.WebApp ||
      window.MaxBridge ||
      window.location.hash.includes('WebAppData='),
  );
}
