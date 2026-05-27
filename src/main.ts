import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

import App from "./App.vue";
import "./styles.css";
import "@app-designer/flow-beeflow/flow-beeflow.css";

createApp(App).use(createPinia()).use(ElementPlus).mount("#app");
