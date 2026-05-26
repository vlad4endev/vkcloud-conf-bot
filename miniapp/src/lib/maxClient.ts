export function isMaxWebApp(): boolean {
  return Boolean(
    window.WebApp?.initData?.trim() || window.MaxBridge?.initData?.trim(),
  );
}
