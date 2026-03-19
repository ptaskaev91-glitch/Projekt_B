import { aiActionTypes } from "./ai";
import { imageActionTypes } from "./image";
import { modelsActionTypes } from "./models";
import { listModules, registerModule } from "./index";

let bootstrapped = false;

export function bootstrapModules() {
  if (bootstrapped) return listModules();
  bootstrapped = true;

  registerModule({
    name: "ai",
    register: () => {
      void aiActionTypes;
    },
  });

  registerModule({
    name: "image",
    register: () => {
      void imageActionTypes;
    },
  });

  registerModule({
    name: "models",
    register: () => {
      void modelsActionTypes;
    },
  });

  return listModules();
}
