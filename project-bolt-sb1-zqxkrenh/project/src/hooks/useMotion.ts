/**
 * React hooks：把 lib/motion.ts 里的动画工具接到组件生命周期上。
 *
 * 关键约定：
 * - 入场类动画用 useLayoutEffect（在浏览器绘制前应用初始隐藏态，避免闪一下）；
 * - 所有动画只触发一次 / 在依赖变化时才重播，不会随普通 re-render 重复播放；
 * - reduced-motion 已在底层工具函数里门控，这里无需再判断。
 */
import { useLayoutEffect, useRef, type RefObject } from 'react';
import {
  animateFadeIn,
  animateCardEnter,
  animateCounter,
  type EntranceOptions,
  type CardEnterOptions,
  type CounterOptions,
} from '@/lib/motion';

/** 容器内匹配 selector 的子元素，挂载时依次进入（stagger）。 */
export function useStagger(
  containerRef: RefObject<HTMLElement | null>,
  selector: string,
  options?: CardEnterOptions,
): void {
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
    animateCardEnter(targets, options);
    // 仅在挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** 单个元素挂载时淡入 + 上移。 */
export function useEntrance(
  ref: RefObject<HTMLElement | null>,
  options?: EntranceOptions,
): void {
  useLayoutEffect(() => {
    if (ref.current) animateFadeIn(ref.current, options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** 数字滚动：to 变化时（或首次挂载）从较低值平滑滚到最终值。 */
export function useCountUp(
  ref: RefObject<HTMLElement | null>,
  to: number,
  options?: Omit<CounterOptions, 'to'>,
): void {
  const firstRun = useRef(true);
  // options 用 ref 保持最新，避免对象字面量每次 render 变化导致 effect 重跑
  const optionsRef = useRef(options);
  optionsRef.current = options;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 首次从 0 滚到 to，之后仅在 to 真正变化时重播
    if (firstRun.current || String(to) !== el.dataset.value) {
      firstRun.current = false;
      el.dataset.value = String(to);
      animateCounter(el, { to, ...optionsRef.current });
    }
  }, [to, ref]);
}
