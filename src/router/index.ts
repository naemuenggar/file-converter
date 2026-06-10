/**
 * OmniDoc OS Router
 *
 * All tool views are lazy-loaded for optimal initial bundle size.
 * Most single-file conversions route through the UniversalConverter, while
 * complex workspaces (Organize, OCR, Sign, Merge) have dedicated components.
 */
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/components/Navigation/ToolDashboard.vue'),
  },

  // ─── Universal + AI ──────────────────────────────────────────────────────
  {
    path: '/convert',
    name: 'universal',
    component: () => import('@/features/Universal/UniversalConverter.vue'),
  },
  {
    path: '/ocr',
    name: 'ocr',
    component: () => import('@/features/Ocr/OcrStudio.vue'),
  },
  {
    path: '/sign',
    name: 'sign',
    component: () => import('@/features/Sign/PdfSigner.vue'),
  },

  // ─── Dedicated PDF workspaces ───────────────────────────────────────────────
  {
    path: '/tools/merge',
    name: 'merge',
    component: () => import('@/features/MergePdf/MergePdf.vue'),
  },
  {
    path: '/tools/organize',
    name: 'organize',
    component: () => import('@/features/PdfStudio/PdfStudio.vue'),
  },
  {
    path: '/tools/pdf-to-jpg',
    name: 'pdf-to-jpg',
    component: () => import('@/features/PdfToImage/PdfToImage.vue'),
  },
  {
    path: '/tools/watermark',
    name: 'watermark',
    component: () => import('@/features/PdfSecurity/PdfSecurity.vue'),
  },
  {
    path: '/tools/protect',
    name: 'protect',
    component: () => import('@/features/PdfSecurity/PdfSecurity.vue'),
  },

  // ─── Generic conversion tools → UniversalConverter ──────────────────────────
  // Every remaining tool id from the registry resolves here. The converter
  // auto-detects the dropped file and offers the relevant targets.
  {
    path: '/tools/:toolId',
    name: 'tool',
    component: () => import('@/features/Universal/UniversalConverter.vue'),
  },

  // Fallback
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
