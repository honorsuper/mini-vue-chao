import { extend } from "../shared";

class ReactiveEffect {
  private _fn: any;
  public scheduler: Function | undefined;
  // scheduler;
  deps = [];
  active = true;
  onStop?: () => void;
  constructor(fn, scheduler) {
    this._fn = fn;
    this.scheduler = scheduler;
  }

  run() {
    // 1、回收集依赖
    if (!this.active) {
      return this._fn();
    }
    shouldTrack = true;
    activeEffect = this;

    const result = this._fn();
    shouldTrack = false;

    return result;
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });
}

const targetMap = new Map();

export function track(target, key) {
  if (!isTracking()) return;

  // target->key->dep
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }

  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

export function trigger(target, key) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);

  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

let activeEffect;
let shouldTrack;
export function effect(fn, options = {}) {
  // @ts-ignore
  const _effect = new ReactiveEffect(fn, options?.scheduler);
  extend(_effect, options);
  // Object.assign(_effect, options);
  // _effect.onStop = options?.onStop;
  _effect.run();
  const runner = _effect.run.bind(_effect);
  // @ts-ignore
  runner.effect = _effect;
  return runner;
}

export function stop(runner) {
  runner.effect.stop();
}
