import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import DocsPreviewPage from './pages/DocsPreviewPage.vue';
import './styles.css';

document.documentElement.classList.add('page-docs-preview');

createApp(DocsPreviewPage).use(ElementPlus).mount('#app');
