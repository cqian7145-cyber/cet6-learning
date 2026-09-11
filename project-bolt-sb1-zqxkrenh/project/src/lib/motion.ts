/**
 * 统一动效配置 + 可复用动画工具（Anime.js v4）。
 *
 * 约定：
 * - 所有动画参数集中在此管理，组件内不散落魔法数字。
 * - 每个工具函数内部先做 prefers-reduced-motion 检查，开启「减少动态效果」时
 *   直接返回 null（元素保持最终可见态），组件无需重复判断。
 * - 入场类动画只接受 ref 得到的 HTMLElement / HTMLElement[]，不依赖全局 class selector。
 * - 动画期间临时禁用目标元素的 CSS transition，避免与 Anime 逐帧写 inline
 *   transform/opacity 冲突（元素若带 Tailwind 的 transition-all 会把每帧变化再平滑一遍）。
 */
import {
  animate,
  stagger,
  createTimeline,
  type JSAnimation,
  type Timeline,
} from 'animejs';

/** 动画时长（ms）—— 对应 spec §14 的 fast/normal/slow */
export const duration = {
  fast: 180,
  normal: 320,
  slow: 600,
  counter: 800,
} as const;

/** 缓动曲线（v4 命名，非 v3 的 easeOutXxx） */
export const ease = {
  /** 默认出场：快进缓出 */
  out: 'outCubic',
  /** 更柔和 */
  outSoft: 'outQuad',
  /** 大位移/长距离用，收尾更干脆 */
  outExpo: 'outExpo',
  /** 居中过渡 */
  inOut: 'inOutQuad',
} as const;

/** 位移距离（px） */
export const distance = {
  smallY: 8,
  mediumY: 16,
  largeY: 20,
} as const;

/** 缩放值 */
export const scale = {
  enter: 0.98,
  hover: 1.01,
  press: 0.98,
  success: 1.08,
} as const;

/** stagger 间隔（ms） */
export const staggerMs = {
  card: 60,
  list: 40,
} as const;

/** 可动画的 DOM 目标（普通元素或 SVG 图标） */
export type MotionTarget = HTMLElement | SVGElement;
/** 目标：单个或一组元素 */
export type ElemTargets = MotionTarget | MotionTarget[];

/**
 * 是否启用了系统「减少动态效果」。
 * 动画触发的瞬间同步读取最新值即可。
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function toElements(targets: ElemTargets): MotionTarget[] {
  return Array.isArray(targets) ? targets : [targets];
}

/**
 * 动画期间禁用 CSS transition，完成后恢复。
 * 只在元素确实带 transition 时需要，这里统一处理、成本很低。
 */
function animateEls(targets: ElemTargets, params: Parameters<typeof animate>[1]): JSAnimation {
  const els = toElements(targets);
  const prevTransitions = els.map((el) => el.style.transition);
  els.forEach((el) => {
    el.style.transition = 'none';
  });
  return animate(els, {
    ...params,
    onComplete: (self) => {
      els.forEach((el, i) => {
        el.style.transition = prevTransitions[i];
      });
      (params.onComplete as ((s: typeof self) => void) | undefined)?.(self);
    },
  });
}

export interface EntranceOptions {
  delay?: number;
  y?: number;
  duration?: number;
}

/** 淡入 + 轻微上移。 */
export function animateFadeIn(targets: ElemTargets, options: EntranceOptions = {}): JSAnimation | null {
  if (prefersReducedMotion()) return null;
  if (toElements(targets).length === 0) return null;
  return animateEls(targets, {
    opacity: [0, 1],
    y: [options.y ?? distance.smallY, 0],
    duration: options.duration ?? duration.normal,
    delay: options.delay ?? 0,
    ease: ease.out,
  });
}

export interface CardEnterOptions {
  stagger?: number;
  y?: number;
  duration?: number;
  /** 最多动画前 N 个元素，避免超长列表全部动画（性能） */
  max?: number;
}

/** 卡片/列表项依次进入：opacity + translateY + scale 0.98→1。 */
export function animateCardEnter(targets: ElemTargets, options: CardEnterOptions = {}): JSAnimation | null {
  if (prefersReducedMotion()) return null;
  const els = toElements(targets);
  const limited = typeof options.max === 'number' ? els.slice(0, options.max) : els;
  if (limited.length === 0) return null;
  return animateEls(limited, {
    opacity: [0, 1],
    y: [options.y ?? distance.mediumY, 0],
    scale: [scale.enter, 1],
    duration: options.duration ?? duration.normal,
    delay: stagger(options.stagger ?? staggerMs.card, { from: 'first' }),
    ease: ease.out,
  });
}

export interface CounterOptions {
  to: number;
  from?: number;
  duration?: number;
  /** 自定义格式化，例如 (v) => `${Math.round(v)}%` */
  format?: (value: number) => string;
}

/**
 * 数字滚动：从较低值平滑过渡到最终值（spec §3）。
 * 动画一个普通 JS 对象，onUpdate 回写 textContent。
 */
export function animateCounter(el: HTMLElement | null, options: CounterOptions): JSAnimation | null {
  if (!el || prefersReducedMotion()) return null;
  const from = options.from ?? 0;
  const format = options.format ?? ((value: number) => String(Math.round(value)));
  const state = { value: from };
  return animate(state, {
    value: [from, options.to],
    duration: options.duration ?? duration.counter,
    ease: ease.out,
    onUpdate: () => {
      el.textContent = format(state.value);
    },
  });
}

/** 选中高亮：轻微 scale 1 → 1.02 → 1（spec §6 选中）。 */
export function animateHighlight(el: MotionTarget | null): JSAnimation | null {
  if (!el || prefersReducedMotion()) return null;
  return animateEls(el, {
    scale: [1, 1.02, 1],
    duration: 220,
    ease: ease.out,
  });
}

/** 轻微水平 shake，只播放一次（spec §6 错误答案）。 */
export function animateShake(el: MotionTarget | null): JSAnimation | null {
  if (!el || prefersReducedMotion()) return null;
  return animateEls(el, {
    x: [0, -6, 6, -3, 3, 0],
    duration: 300,
    ease: ease.outSoft,
  });
}

/** 成功图标：scale 0.8 → 1.08 → 1（spec §12）。 */
export function animateSuccess(el: MotionTarget | null): JSAnimation | null {
  if (!el || prefersReducedMotion()) return null;
  return animateEls(el, {
    scale: [0.8, scale.success, 1],
    duration: duration.normal + 80,
    ease: ease.out,
  });
}

/** 成功反馈序列：先弹成功图标，再让结果区 fade + slide 出现（timeline 用法）。 */
export function animateSuccessReveal(
  icon: MotionTarget | null,
  reveal: MotionTarget | null,
): Timeline | null {
  if (!icon || !reveal || prefersReducedMotion()) return null;
  const tl = createTimeline({ defaults: { ease: ease.out } });
  tl.add(icon, { scale: [0.8, scale.success, 1], duration: duration.normal + 80 }, 0);
  tl.add(reveal, { opacity: [0, 1], y: [distance.smallY, 0], duration: duration.normal }, '-=100');
  return tl;
}

/** 模态框进入：overlay 淡入 + 内容 scale 0.97→1、y 8→0（spec §8，当前 app 暂无 modal，备用）。 */
export function animateModalEnter(
  overlay: HTMLElement | null,
  panel: HTMLElement | null,
): Timeline | null {
  if (!overlay || !panel || prefersReducedMotion()) return null;
  return createTimeline({ defaults: { ease: ease.out } })
    .add(overlay, { opacity: [0, 1], duration: 200 }, 0)
    .add(
      panel,
      { opacity: [0, 1], scale: [0.97, 1], y: [distance.smallY, 0], duration: 240 },
      0,
    );
}
