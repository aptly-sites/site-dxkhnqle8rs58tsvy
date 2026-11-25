// Reuse the public Chekkit installation from www.all3realty.com.
// The vendor owns the chat UI, conversation delivery, and responsive sizing.
const source = 'https://chat.chekkit.io/v1/webchat.js';
if (!document.querySelector(`script[src="${source}"]`) && !window.__chekkitWidgetLoaded) {
  window.chekkitSettings = {
    app_id: 'f84b8aca7d68385af009f39abd7f9b3f3r8K2LRth768QeA7q+Lb4d3oWgQcKIdi3XRizWPbuNk=',
  };
  const script = document.createElement('script');
  script.src = source;
  script.async = true;
  document.head.appendChild(script);
}
