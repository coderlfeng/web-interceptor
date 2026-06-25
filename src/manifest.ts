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
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/interceptor-main.ts'],
      run_at: 'document_start',
      world: 'MAIN',
    },
    {
      matches: ['<all_urls>'],
      js: ['src/content/interceptor.ts'],
      run_at: 'document_start',
    },
  ],
  permissions: ['sidePanel', 'declarativeNetRequest', 'declarativeNetRequestFeedback', 'storage'],
  host_permissions: ['<all_urls>'],
};

export default manifest;
