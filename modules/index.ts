export type ModuleRegistration = {
  name: string;
  register?: () => void;
};

const modules: ModuleRegistration[] = [];

export function registerModule(mod: ModuleRegistration) {
  if (modules.some((m) => m.name === mod.name)) return;
  mod.register?.();
  modules.push(mod);
}

export function listModules() {
  return modules.map((m) => m.name);
}
