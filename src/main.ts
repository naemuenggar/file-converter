/**
 * Application Entry Point
 * Bootstraps the Vue 3 app with Pinia, the router, and global styles.
 *
 * Privacy-first analytics: Vercel Web Analytics is cookie-less and collects no
 * personal data or cross-site identifiers. We use the framework-agnostic
 * `inject()` so no third-party trackers or PII ever touch the user.
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { inject as injectVercelAnalytics } from '@vercel/analytics'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.mount('#app')

// Cookie-less, privacy-friendly page analytics. Only runs in production builds.
injectVercelAnalytics({ mode: import.meta.env.PROD ? 'production' : 'development' })
