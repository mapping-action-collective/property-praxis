export function trackPage() {
  if (window.gtag) {
    window.gtag("send", "page_view", {
      page_location: window.location.href,
      page_path: window.location.pathname,
    })
  }
}
