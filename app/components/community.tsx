import { useEffect, useRef, useState } from "react";
import styles from "./community.module.scss";
import Locale from "../locales";
import { IconButton } from "./button";
import { Input, Modal, ShowLoading, showToast } from "./ui-lib";
import PopularityIcon from "../icons/popularity.svg";
import {
  CommunityPrompt,
  useCommunityPromptStore,
} from "../store/community-prompt";
import { getRandomElements } from "../utils";

export function SharePrompt(props: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const communityPromptStore = useCommunityPromptStore();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <div className="modal-mask share-prompt-modal">
        <Modal
          title={Locale.Community.Share}
          onClose={() => props.onClose()}
          actions={[
            <IconButton
              key="cancel"
              bordered
              text={Locale.Community.Cancel}
              className={`${styles["share-button-cancel"]} ${styles["share-button"]}`}
              onClick={() => {
                props.onClose();
              }}
            />,
            <IconButton
              key="send"
              type="primary"
              bordered
              text={Locale.Community.Submit}
              className={`${styles["share-button-submit"]} ${styles["share-button"]}`}
              onClick={() => {
                if (!text.trim()) {
                  return;
                }

                if (submitting) return;
                setSubmitting(true);

                communityPromptStore
                  .share(text)
                  .then(() => {
                    // communityPromptStore.add({
                    //   id: Date.now() + "",
                    //   prompt: text,
                    //   popularity: 1,
                    //   category: ["用户分享"],
                    //   extra: {},
                    // });
                    showToast(Locale.Community.ShareSuccess);
                    props.onClose();
                    props.onSuccess?.();
                  })
                  .catch((err) => {
                    console.log("[SharePrompt] error:", err);
                    showToast(Locale.Community.ShareSuccess);
                  });
              }}
            />,
          ]}
        >
          <div className={styles["share-prompt"]}>
            <div className={styles["share-prompt-header"]}></div>
            <div className={styles["share-prompt-content"]}>
              <Input
                rows={14}
                value={text}
                placeholder={Locale.Community.SharePlaceholder}
                className={styles["share-prompt-input"]}
                onChange={(e) => setText(e.currentTarget.value)}
              />
            </div>
            <div className={styles["share-prompt-footer"]}></div>
          </div>
        </Modal>
      </div>

      {submitting && <ShowLoading tip="" />}
    </>
  );
}

export function Community(props: {
  onClose: () => void;
  onPromptSelect: (prompt: string) => void;
}) {
  const communityPromptStore = useCommunityPromptStore();

  const [promptHints, setPromptHints] = useState<CommunityPrompt[]>([]);
  const [searchText, setSearchText] = useState("");
  const [currentTagIndex, setCurrentTagIndex] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  const onSearch = (text: string, tag?: string) => {
    let matchedPrompts = [];
    if (tag === "随机") {
      matchedPrompts = communityPromptStore.getRandomPrompts(50);
    } else {
      matchedPrompts = communityPromptStore.search(text, tag);
    }
    setPromptHints(matchedPrompts);
  };

  useEffect(() => {
    container.current?.parentElement?.scrollTo(0, 0);
  }, [promptHints]);

  useEffect(() => {
    // init load prompts
    onSearch(communityPromptStore.promptCategories.at(currentTagIndex) ?? "");
  }, []);

  return (
    <div>
      <div className="modal-mask">
        <Modal
          title={Locale.Community.Title}
          onClose={() => props.onClose()}
          containerClass="community-modal"
        >
          <div ref={container} className={styles["community"]}>
            <div className={styles["community-header"]}>
              <div className={styles["community-search"]}>
                <IconButton
                  text={Locale.Community.Share}
                  className={styles["community-share-button"]}
                  onClick={() => {
                    setShowShare(true);
                  }}
                />
                <input
                  className={styles["community-search-input"]}
                  placeholder={Locale.Community.Placeholder}
                  value={searchText}
                  onInput={(e) => {
                    const text = e.currentTarget.value;
                    setSearchText(text);
                  }}
                />
                <IconButton
                  text={Locale.Community.Search}
                  className={styles["community-search-button"]}
                  onClick={() => onSearch(searchText)}
                />
              </div>
              <div className={styles["community-nav-tags"]}>
                <div className={styles["community-nav-tags-list"]}>
                  {communityPromptStore.promptCategories.map((item, index) => (
                    <span
                      className={`${styles["community-nav-tags-item"]} ${currentTagIndex === index ? styles["community-nav-tags-item-active"] : ""}`}
                      key={item}
                      onClick={() => {
                        setCurrentTagIndex(index);
                        setPromptHints([]);
                        onSearch("", item);
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles["community-content"]}>
              <div className={styles["community-list"]}>
                {promptHints.map((item) => (
                  <div
                    className={styles["community-list-item"]}
                    key={item.id}
                    onClick={() => {
                      props.onPromptSelect(item.prompt);
                    }}
                  >
                    <div className={styles["community-list-item-inner"]}>
                      <div className={styles["community-list-item-inner-top"]}>
                        <pre
                          className={styles["community-list-item-prompt"]}
                          style={{
                            whiteSpace: "pre-wrap",
                            fontFamily: "inherit",
                            margin: "0.5em 0",
                          }}
                        >
                          {item.prompt}
                        </pre>
                      </div>
                      <div
                        className={styles["community-list-item-inner-bottom"]}
                      >
                        <span className={styles["community-list-item-tag"]}>
                          {item.category.join(" / ")}
                        </span>
                        {/* <span
                          className={styles["community-list-item-popularity"]}
                        >
                          <PopularityIcon style={{ width: 18, height: 18 }} />
                          {item.popularity}
                        </span> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles["community-footer"]}></div>
          </div>
        </Modal>
      </div>

      {showShare && (
        <SharePrompt
          onClose={() => setShowShare(false)}
          onSuccess={() => {
            console.log("success");
            // onSearch(
            //   communityPromptStore.promptCategories.at(currentTagIndex) ?? "",
            // );
          }}
        />
      )}
    </div>
  );
}
