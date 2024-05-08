import { StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";

export interface SystemPrompt {
  id: string;
  content: string;
  createdAt: number;
}

export const useSysPromptStore = createPersistStore(
  {
    counter: 0,
    enable: true,
    systemPrompts: {} as Record<string, SystemPrompt>,
  },

  (set, get) => ({
    getSysPrompt(id: string) {
      const targetPrompt = get().systemPrompts[id];
      return targetPrompt;
    },

    addSysPrompt(prompt: SystemPrompt) {
      const systemPrompts = get().systemPrompts;

      systemPrompts[prompt.id] = prompt;
      set(() => ({
        systemPrompts: systemPrompts,
      }));

      return systemPrompts.id!;
    },

    updateSysPrompt(id: string, updater: (prompt: SystemPrompt) => void) {
      const systemPrompt = get().systemPrompts[id] ?? {
        content: "",
        id,
      };

      updater(systemPrompt);

      const prompts = get().systemPrompts;
      prompts[id] = systemPrompt;
      set(() => ({ systemPrompts: prompts }));
    },

    removeSysPrompt(id: string) {
      const systemPrompts = get().systemPrompts;
      delete systemPrompts[id];

      Object.entries(systemPrompts).some(([key, prompt]) => {
        if (prompt.id === id) {
          delete systemPrompts[key];
          return true;
        }
        return false;
      });

      set(() => ({
        systemPrompts,
      }));
    },
  }),
  {
    name: StoreKey.SysPrompt,
    version: 1,
  },
);
