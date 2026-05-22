import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import EventGuidePage from './pages/EventGuidePage.vue';
import './styles.css';

document.documentElement.classList.add('page-event-guide');

createApp(EventGuidePage).use(ElementPlus).mount('#app');
