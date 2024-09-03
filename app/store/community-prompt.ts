import Fuse from "fuse.js";
import { getLang } from "../locales";
import { GPT302_FEISHU_BOT_URL, StoreKey } from "../constant";
import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";
import { getRandomElements } from "../utils";

export interface CommunityCategory {
  title: string;
  value: string;
}

export interface CommunityPrompt {
  id: string;
  prompt: string;
  category: string[];
  popularity: number;
  extra: Record<string, unknown>;
}

export interface CommunityPromptRecord {
  tabs: CommunityCategory[];
  prompts: CommunityPrompt[];
}

const SearchService = {
  ready: false,
  builtinEngine: new Fuse<CommunityPrompt>([], {
    keys: ["prompt", "category", "popularity"],
  }),
  userEngine: new Fuse<CommunityPrompt>([], {
    keys: ["prompt", "category", "popularity"],
  }),
  count: {
    builtin: 0,
  },
  allPrompts: [] as CommunityPrompt[],
  builtinPrompts: [] as CommunityPrompt[],

  init(builtinPrompts: CommunityPrompt[], userPrompts: CommunityPrompt[]) {
    if (this.ready) {
      return;
    }
    this.allPrompts = userPrompts.concat(builtinPrompts);
    this.builtinPrompts = builtinPrompts.slice();
    this.builtinEngine.setCollection(builtinPrompts);
    this.userEngine.setCollection(userPrompts);
    this.ready = true;
  },

  remove(id: string) {
    this.userEngine.remove((doc) => doc.id === id);
  },

  add(prompt: CommunityPrompt) {
    this.userEngine.add(prompt);
  },

  search(text: string) {
    const userResults = this.userEngine.search(text);
    const builtinResults = this.builtinEngine.search(text);
    return userResults.concat(builtinResults).map((v) => v.item);
  },
};

export const useCommunityPromptStore = createPersistStore(
  {
    counter: 0,
    prompts: {} as Record<string, CommunityPrompt>,
    promptCategories: [] as CommunityCategory[],
  },

  (set, get) => ({
    add(prompt: CommunityPrompt) {
      const prompts = get().prompts;
      // prompt.id = nanoid();
      // prompt.isUser = true;
      // prompt.createdAt = Date.now();
      prompts[prompt.id] = prompt;

      set(() => ({
        prompts: prompts,
        counter: get().counter + 1,
      }));

      SearchService.add(prompt);

      return prompt.id!;
    },

    get(id: string) {
      const targetPrompt = get().prompts[id];

      if (!targetPrompt) {
        return SearchService.builtinPrompts.find((v) => v.id === id);
      }

      return targetPrompt;
    },

    remove(id: string) {
      const prompts = get().prompts;
      delete prompts[id];

      Object.entries(prompts).some(([key, prompt]) => {
        if (prompt.id === id) {
          delete prompts[key];
          return true;
        }
        return false;
      });

      SearchService.remove(id);

      set(() => ({
        prompts,
        counter: get().counter - 1,
      }));
    },

    clean() {
      set(() => ({
        prompts: {},
        counter: 0,
      }));
    },

    getUserPrompts() {
      const userPrompts = Object.values(get().prompts ?? {});
      userPrompts.sort((a, b) =>
        b.id && a.id ? b.popularity - a.popularity : 0,
      );
      return userPrompts;
    },

    updatePrompt(id: string, updater: (prompt: CommunityPrompt) => void) {
      const prompt = get().prompts[id] ?? {
        title: "",
        content: "",
        id,
      };

      SearchService.remove(id);
      updater(prompt);
      const prompts = get().prompts;
      prompts[id] = prompt;
      set(() => ({ prompts }));
      SearchService.add(prompt);
    },

    search(text: string, tag?: string) {
      let matchedPrompts;

      if (text.length === 0) {
        // return all rompts
        matchedPrompts = this.getUserPrompts().concat(
          SearchService.builtinPrompts,
        );
      } else {
        matchedPrompts = SearchService.search(text) as CommunityPrompt[];
      }

      if (tag) {
        const _tag = get().promptCategories.find((v) => v.value === tag);
        matchedPrompts = matchedPrompts.filter((v) =>
          v.category.includes(_tag ? _tag.title : tag),
        );
      }

      return matchedPrompts.sort((a, b) =>
        b.id && a.id ? b.popularity - a.popularity : 0,
      );
    },

    getRandomPrompts(n: number) {
      const list = this.getUserPrompts().concat(SearchService.builtinPrompts);

      return getRandomElements(list, Math.min(n, list.length - 1));
    },

    async share(text: string) {
      return fetch(GPT302_FEISHU_BOT_URL, {
        method: "POST",
        body: JSON.stringify({
          msg_type: "text",
          content: {
            text: `模型竞技场问题分享\n分享内容:\n${text}`,
          },
        }),
      }).then(async (res) => {
        const text = await res.text();
        console.log("🚀 ~ share ~ text:", text);
      });
    },

    setPromptCategories(list: CommunityCategory[]) {
      set(() => ({
        promptCategories: list,
      }));
    },
  }),
  {
    name: StoreKey.CommunityPrompt,
    version: 1.1,

    migrate(state, version) {
      const newState = JSON.parse(JSON.stringify(state)) as {
        prompts: Record<string, CommunityPrompt>;
        promptCategories: CommunityCategory[];
      };

      return newState as any;
    },

    onRehydrateStorage: () => (state) => {
      const PROMPT_URL = "./community-prompts.json";

      fetch(PROMPT_URL)
        .then((res) => res.json())
        .then((res) => {
          let lang = getLang();
          let fetchPrompts: CommunityPromptRecord = res[lang] ?? res["en"];

          state?.setPromptCategories(fetchPrompts.tabs ?? []);

          const userPrompts =
            useCommunityPromptStore.getState().getUserPrompts() ?? [];

          const allPromptsForSearch = fetchPrompts.prompts;
          SearchService.count.builtin = fetchPrompts.prompts.length;
          SearchService.init(allPromptsForSearch, userPrompts);
        });
    },
  },
);
