import "./styles.scss";

import CharacterCount from "@tiptap/extension-character-count";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Highlight from "@tiptap/extension-highlight";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { MenuBar } from "./MenuBar";

const server = "tiptap.edgecompute.app";
const colors = ["#958DF1", "#F98181", "#FBBC88", "#FAF594", "#70CFF8", "#94FADB", "#B9F18D"];
const rooms = ["room-30", "room-31", "room-32"];
const names = [
  "Lea Thompson",
  "Cyndi Lauper",
  "Tom Cruise",
  "Madonna",
  "Jerry Hall",
  "Joan Collins",
  "Winona Ryder",
  "Christina Applegate",
  "Alyssa Milano",
  "Molly Ringwald",
  "Ally Sheedy",
  "Debbie Harry",
  "Olivia Newton-John",
  "Elton John",
  "Michael J. Fox",
  "Axl Rose",
  "Emilio Estevez",
  "Ralph Macchio",
  "Rob Lowe",
  "Jennifer Grey",
  "Mickey Rourke",
  "John Cusack",
  "Matthew Broderick",
  "Justine Bateman",
  "Lisa Bonet",
];

const getRandomElement = (list) => list[Math.floor(Math.random() * list.length)];

const getRandomRoom = () => getRandomElement(rooms);
const getRandomColor = () => getRandomElement(colors);
const getRandomName = () => getRandomElement(names);

let room = "default-room";

const ydoc = new Y.Doc();
let wsProvider = new WebsocketProvider(`wss://${server}`, room, ydoc, { connect: true });

const getInitialUser = () => {
  return (
    JSON.parse(localStorage.getItem("currentUser")) || {
      name: getRandomName(),
      color: getRandomColor(),
    }
  );
};

export const App = () => {
  const [status, setStatus] = useState("connecting");
  const [currentUser, setCurrentUser] = useState(getInitialUser);
  const [pop, setPop] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Highlight,
      TaskList,
      TaskItem,
      Typography,
      CharacterCount.configure({
        limit: 10000,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: wsProvider,
      }),
    ],
  });

  useEffect(() => {
    const fetchPop = async () => {
      const res = await fetch(`https://${server}/pop`);
      const pop = await res.text();
      if (pop) {
        setPop(() => pop);

        setCurrentUser(() => {
          const name = currentUser.name.split("@")[0] + `@${pop}`;
          return { ...currentUser, name };
        });
      }
    };
    fetchPop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Update status changes
    wsProvider.on("status", (event) => {
      setStatus(event.status);
    });
  }, []);

  // Save current user to localStorage and emit to editor
  useEffect(() => {
    if (editor && currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      editor.chain().focus().updateUser(currentUser).run();
    }
  }, [editor, currentUser]);

  const setName = useCallback(() => {
    let name = (window.prompt("Name") || "").trim().substring(0, 32);

    if (name) {
      if (pop) {
        name = name + `@${pop}`;
      }
      return setCurrentUser({ ...currentUser, name });
    }
  }, [currentUser, pop]);

  return (
    <div className="editor">
      {editor && <MenuBar editor={editor} />}
      <EditorContent className="editor__content" editor={editor} />
      <div className="editor__footer">
        <div className={`editor__status editor__status--${status}`}>
          {status === "connected"
            ? `${editor.storage.collaborationCursor.users.length} user${
                editor.storage.collaborationCursor.users.length === 1 ? "" : "s"
              } online in ${room}`
            : "offline"}
        </div>
        <div className="editor__name">
          <button onClick={setName}>{currentUser.name}</button>
        </div>
      </div>
    </div>
  );
};
