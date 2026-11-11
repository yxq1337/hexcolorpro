/**
 * HexColor Pro - Adsterra 广告统一配置
 * 站点: hexcolorpro.pages.dev (Adsterra site id 6179130, 已 Approved)
 *
 * 多槽位关键：每个单元用独立的 atOptions 变量 + 独立 <script>，
 * 不能共用全局 window.atOptions，否则后加载的单元会覆盖前面的尺寸。
 * 加新单元：在 units 补 key，再到 slotMap 引用。
 *
 * 性能约定（2026-11 改动）：
 * 1. 注入前先用单元尺寸把槽位高度钉死（min-height），广告回填不再顶动页面 -> CLS 归零。
 * 2. 广告在 load 之后、浏览器空闲时才拉取，不抢首屏的带宽与主线程 -> 保护 LCP/INP。
 * 3. 移动端按 320x50 预留，桌面按 728x90 预留；每个槽位只渲染一次，resize 不再重排。
 */

const AD_CONFIG = {
  adsterra: {
    enabled: true,
    scriptBase: 'https://bauval.org/22/',
    units: {
      '728x90':  { w: 728, h: 90,  key: '131835b8c969e0d2ec3c599d6e80e359' },
      '320x50':  { w: 320, h: 50,  key: 'f8cef3d4340ad09befe293163fc95954' },
      '300x250': { w: 300, h: 250, key: '0a760729a913bb5684cf933fee299e42' },
      '160x300': { w: 160, h: 300, key: '799647663723d37d9385c04db486ccaf' },
      '160x600': { w: 160, h: 600, key: '08aedfd263204db0895dad299fbadc72' },
      '468x60':  { w: 468, h: 60,  key: 'f117eed8df5e5335837b80597fd7e9c3' }
    }
  },

  // 槽位 → 响应式单元（desktop / mobile）
  slotMap: {
    top:    { desktop: '728x90',  mobile: '320x50'  },
    bottom: { desktop: '300x250', mobile: '300x250' }
  },

  // 慢网络与省流模式不加载广告：宁可少一次曝光，也不拖垮首屏
  skipOnSlowNetwork: true
};

// 每个单元独立的配置变量，避免互相覆盖
const ADSTERRA_OPTIONS = {};

function isSlowNetwork() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!c) return false;
  if (c.saveData) return true;
  return /(^|-)2g$/.test(c.effectiveType || '');
}

/**
 * 在广告位出现前就把空间占好，避免广告回填导致的布局位移。
 */
function reserveSpace(slot, unit) {
  slot.style.minHeight = unit.h + 'px';
  slot.style.width = '100%';
  slot.style.maxWidth = unit.w + 'px';
  slot.style.margin = '30px auto';
  slot.style.overflow = 'hidden';
  slot.classList.add('ad-live');
  slot.classList.remove('ad-placeholder');
}

/**
 * 在容器内加载一个 Adsterra 横幅（独立 atOptions + 独立脚本）
 */
function loadBanner(container, unitName, unit) {
  container.innerHTML = '';

  // 1. 独立的配置变量，挂到 window 上供 Adsterra 脚本读取
  const varName = 'atOptions_' + unit.key.slice(0, 8);
  ADSTERRA_OPTIONS[varName] = {
    key: unit.key,
    format: 'iframe',
    height: unit.h,
    width: unit.w,
    params: {}
  };
  window[varName] = ADSTERRA_OPTIONS[varName];

  // 2. 配置脚本：把该单元的 atOptions 指向独立变量
  const cfg = document.createElement('script');
  cfg.text = 'var atOptions = window.' + varName + ';';
  container.appendChild(cfg);

  // 3. 加载脚本（Adsterra 读取当前 atOptions 后自行建 iframe）
  const s = document.createElement('script');
  s.src = AD_CONFIG.adsterra.scriptBase + unit.key;
  s.async = true;
  container.appendChild(s);
}

/**
 * 立刻占位：不联网，纯几何，早于首屏绘制。
 */
function reserveAll() {
  const cfg = AD_CONFIG.adsterra;
  if (!cfg.enabled) return;
  const isMobile = window.matchMedia('(max-width: 760px)').matches;

  document.querySelectorAll('[data-ad-slot]').forEach(slot => {
    const position = slot.getAttribute('data-ad-slot');
    const map = AD_CONFIG.slotMap[position];
    if (!map) return;
    const unit = cfg.units[isMobile ? map.mobile : map.desktop];
    if (!unit) return;
    if (slot.dataset.adReserved === '1') return;
    slot.dataset.adReserved = '1';
    slot.dataset.adUnit = isMobile ? map.mobile : map.desktop;
    reserveSpace(slot, unit);
  });
}

/**
 * 渲染页面上所有广告槽位（此时空间已占好，注入不会再顶动布局）
 */
function renderAds() {
  const cfg = AD_CONFIG.adsterra;
  if (!cfg.enabled) return;
  if (cfg.skipOnSlowNetwork && isSlowNetwork()) return;

  document.querySelectorAll('[data-ad-slot]').forEach(slot => {
    if (slot.dataset.adLoaded === '1') return;
    const name = slot.dataset.adUnit;
    if (!name) return;
    const unit = cfg.units[name];
    if (!unit) return;

    slot.dataset.adLoaded = '1';
    loadBanner(slot, name, unit);
  });
}

/**
 * 先占位（DOM 就绪即做），再等首屏渲染完、浏览器空闲时拉广告。
 */
function scheduleAds() {
  const start = () => {
    reserveAll();
    const run = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(renderAds, { timeout: 2500 });
      } else {
        setTimeout(renderAds, 1200);
      }
    };
    if (document.readyState === 'complete') run();
    else window.addEventListener('load', run, { once: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}

scheduleAds();
