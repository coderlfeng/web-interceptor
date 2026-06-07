import type { ManifestV3Export } from '@crxjs/vite-plugin';

const manifest: ManifestV3Export = {
  manifest_version: 3,
  name: 'Web API Interceptor',
  description: 'A Lit-based Chrome extension starter with a polished side panel.',
  version: '1.0.0',
  action: {
    default_title: 'Open Web API Interceptor',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  side_panel: {
    default_path: 'index.html',
  },
  permissions: ['sidePanel', 'declarativeNetRequest', 'declarativeNetRequestFeedback', 'storage'],
  host_permissions: ['<all_urls>'],
};

export default manifest;
