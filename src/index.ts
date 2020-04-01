import {
  app,
  Menu,
  Tray,
  MenuItemConstructorOptions,
  MenuItem,
} from "electron";
import { WebClient } from "@slack/web-api";
import * as Path from "path";
import { menubar } from "menubar";
import ElectronStore from "electron-store";
import activeWin from "active-win";

const iconPath = Path.join(__dirname, "..", "assets", "activity.png");

type Config = {
  updateInterval: number;
  defaultEmoji: string;
  slackToken: string;
  nameToEmoji: { [key: string]: string };
};

const configStore = new ElectronStore<Config>({
  defaults: {
    updateInterval: 30000,
    defaultEmoji: ":moomin:",
    slackToken: "PASTE_YOUR_SLACK_TOKEN_HERE",
    nameToEmoji: {
      Slack: ":slack:",
      Code: ":code:",
      "Google Chrome": ":chrome:",
      "zoom.us": ":zoomus:",
    },
  },
});

const menuTemplate: Array<MenuItemConstructorOptions | MenuItem> = [
  {
    label: "Active Application",
    submenu: [{ label: "Name: loading..." }, { label: "Title: loading..." }],
  },
  {
    label: "Preferences...",
    click: () => {
      configStore.openInEditor();
    },
  },
  { role: "quit" },
];

app.on("ready", () => {
  const tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);

  const mb = menubar({
    tray,
  });

  mb.on("ready", () => {
    updateActiveWindow(tray);

    (async () => {
      await setInterval(
        updateActiveWindow,
        configStore.get("updateInterval"),
        tray,
      );
    })();
  });
});

const updateActiveWindow = async (tray: Tray) => {
  const activeWindow = await activeWin();
  const windowName: string = activeWindow?.owner?.name || "";
  const emoji =
    configStore.get("nameToEmoji")[windowName] ||
    configStore.get("defaultEmoji");

  updateMenu(activeWindow, tray);
  setSlackStatus(emoji, windowName, 0, configStore.get("slackToken"));
};

const updateMenu = (activeWindow: any, tray: Tray) => {
  const newMenuTemplate: any = menuTemplate;
  newMenuTemplate[0].submenu[0].label = `Name: ${activeWindow.owner.name}`;
  newMenuTemplate[0].submenu[1].label = `Title: ${activeWindow.title}`;

  const newMenu = Menu.buildFromTemplate(newMenuTemplate);
  tray.setContextMenu(newMenu);
};

const setSlackStatus = async (
  emoji: string,
  text: string,
  expiration: number,
  token: string,
) => {
  const slack = new WebClient(token);
  try {
    const result = await slack.users.profile.set({
      profile: JSON.stringify({
        status_text: text,
        status_emoji: emoji,
        status_expiration: expiration,
      }),
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
};
