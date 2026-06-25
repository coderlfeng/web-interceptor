import './components/group-display';
import './components/navbar';
import './components/rule-card';
import './web-api-side-panel';
import './views/home-page';
import './views/groups-page';
import './views/group-rules-page';
import { registerRoute } from './router';

registerRoute('/', 'home-page', 'Home');
registerRoute('/requests', 'groups-page', 'Groups');
registerRoute('/group-rules', 'group-rules-page', 'Rules');

if (!window.location.hash) {
  window.location.hash = '/';
}
