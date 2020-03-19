import { app, Menu, Tray, MenuItemConstructorOptions, MenuItem } from 'electron';
import { WebClient } from '@slack/web-api';
import * as Path from 'path';
import { menubar } from 'menubar';

const activeWin = require('active-win');
const iconPath = Path.join(__dirname, '..', 'assets', 'activity.png');

// TODO: Make configurable
const updateInterval = 300000;
const defaultEmoji = ':moomin:'
const slackToken = 'XXX'
const slackUser = 'XXX'

const NameToEmoji: { [key: string]: string } = {
  'Slack': ':slack:',
  'Code': ':code:',
  'Google Chrome': ':chrome:',
  'zoom.us': ':zoomus:',
}

const menuTemplate: Array<(MenuItemConstructorOptions) | (MenuItem)> = [
  {
    label: 'Active Application',
    submenu: [
      { label: 'Name: loading...' },
      { label: 'Title: loading...' },
    ],
  },
  { role: 'quit' },
]

app.on('ready', () => {
  const tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate(menuTemplate);
  tray.setContextMenu(contextMenu);

  const mb = menubar({
    tray,
  });

  mb.on('ready', () => {
    updateActiveWindow(tray);

    ;(async () => {
      await setInterval(updateActiveWindow, updateInterval, tray);
    })();
  });
});

const updateActiveWindow = async (tray: Tray) => {
  const activeWindow = await getActiveWindow();
  const windowName: string = activeWindow.owner.name;
  const emoji = NameToEmoji[windowName] || defaultEmoji;

  updateMenu(activeWindow, tray);
  setSlackStatus(emoji, windowName, 0, slackToken, slackUser);
}

const updateMenu = (activeWindow: any, tray: Tray) => {
  const newMenuTemplate: any = menuTemplate
  newMenuTemplate[0].submenu[0].label  = `Name: ${activeWindow.owner.name}`;
  newMenuTemplate[0].submenu[1].label = `Title: ${activeWindow.title}`;

  const newMenu = Menu.buildFromTemplate(newMenuTemplate);
  tray.setContextMenu(newMenu);
}

const getActiveWindow = async () => {
  const result = await activeWin();
  if (result == null) {
    return "";
  }

  console.log(result);
  return result;
}

const setSlackStatus = async (emoji: string, text: string, expiration: number, token: string, user: string) => {
  const slack = new WebClient(token);
  try {
    const result = await slack.users.profile.set({
      profile: JSON.stringify({
        status_text: text,
        status_emoji: emoji,
        status_expiration: 0,
      }),
    });
    console.log(result);
  } catch (error) {
    console.error(error);
  }
}
