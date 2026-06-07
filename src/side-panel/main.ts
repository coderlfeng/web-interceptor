import './components/rule-card';
import './web-api-side-panel';
import './views/home-page';
import './views/requests-page';
import { registerRoute } from './router';

registerRoute('/', 'home-page', 'Home');
registerRoute('/requests', 'requests-page', 'Requests');

if (!window.location.hash) {
  window.location.hash = '/';
}
