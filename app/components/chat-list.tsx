import DeleteIcon from "../icons/delete.svg";
import BotIcon from "../icons/bot.svg";

import styles from "./home.module.scss";

import { ModelType, useChatStore } from "../store";

import Locale from "../locales";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { MaskAvatar } from "./mask";
import { Mask } from "../store/mask";
import { useRef, useEffect } from "react";
import { showConfirm } from "./ui-lib";
import { useMobileScreen } from "../utils";

export function ChatItem(props: {
  onClick?: () => void;
  onDelete?: () => void;
  title: string;
  count: number;
  time: string;
  selected: boolean;
  id: string;
  index: number;
  narrow?: boolean;
  mask: Mask;
}) {
  const draggableRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (props.selected && draggableRef.current) {
      draggableRef.current?.scrollIntoView({
        block: "center",
      });
    }
  }, [props.selected]);

  const { pathname: currentPath } = useLocation();
  return (
    <div
      className={`${styles["chat-item"]} ${
        props.selected &&
        (currentPath === Path.Chat || currentPath === Path.Home) &&
        styles["chat-item-selected"]
      }`}
      onClick={props.onClick}
      title={`${props.title}\n${Locale.ChatItem.ChatItemCount(props.count)}`}
    >
      {props.narrow ? (
        <div className={styles["chat-item-narrow"]}>
          <div className={styles["chat-item-avatar"] + " no-dark"}>
            <MaskAvatar
              avatar={props.mask.avatar}
              model={props.mask.modelConfig.model as ModelType}
            />
          </div>
          <div className={styles["chat-item-narrow-count"]}>{props.count}</div>
        </div>
      ) : (
        <>
          <div className={styles["chat-item-title"]}>{props.title}</div>
          <div className={styles["chat-item-info"]}>
            <div className={styles["chat-item-count"]}>
              {Locale.ChatItem.ChatItemCount(props.count)}
            </div>
            <div className={styles["chat-item-date"]}>{props.time}</div>
          </div>
        </>
      )}

      <div
        className={styles["chat-item-delete"]}
        onClickCapture={(e) => {
          props.onDelete?.();
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <DeleteIcon />
      </div>
    </div>
  );
}

export function ChatList(props: { narrow?: boolean }) {
  const [sessions, selectedIndex, selectSession, moveSession] = useChatStore(
    (state) => [
      state.sessions,
      state.currentSessionIndex,
      state.selectSession,
      state.moveSession,
    ],
  );
  const chatStore = useChatStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobileScreen = useMobileScreen();

  return (
    <div className={styles["chat-list"]}>
      {sessions.map((item, i) => (
        <ChatItem
          title={item.topic}
          time={new Date(item.lastUpdate).toLocaleString()}
          count={item.messages.length}
          key={item.id}
          id={item.id}
          index={i}
          selected={i === selectedIndex}
          onClick={() => {
            navigate(Path.Chat + location.search);
            selectSession(i);
          }}
          onDelete={async () => {
            if (
              (!props.narrow && !isMobileScreen) ||
              (await showConfirm(Locale.Home.DeleteChat))
            ) {
              chatStore.deleteSession(i);
            }
          }}
          narrow={props.narrow}
          mask={item.mask}
        />
      ))}
    </div>
  );
}
