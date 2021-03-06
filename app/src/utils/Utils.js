const path = require('path');
const { shell, remote } = require('electron');
const execSync = require('child_process').execSync;

let window;
if (remote) {
  window = remote.getGlobal('win');
}

const isElectronRenderer = () => {
  // running in a web browser
  if (typeof process === 'undefined') return true;

  // node-integration is disabled
  if (!process) return true;

  // We're in node.js somehow
  if (!process.type) return false;

  return process.type === 'renderer';
};


class Utils {
  appPath() {
    let configPath;
    if (process.env.APP_ENV === 'browser') {
      configPath = path.normalize(remote.app.getAppPath());
    } else {
      configPath = path.normalize(__dirname);
    }

    return configPath;
  }

  /**
   *
   * @param {Array} array - Array to sort.
   * @param {String} property - Property sort by.
   */
  uniqueObjectsFromArray(array, property) {
    return Array.from(array.reduce((m, o) =>
      m.set(o[property], o), new Map()).values(),
    );
  }

  /**
   *
   * @param {Array} data - Data to sort.
   * @param {String} property - Property to sort by.
   */
  alphabeticSortByProperty(data, property) {
    return data.sort((a, b) => {
      if (a[property].toLowerCase() < b[property].toLowerCase()) return -1;
      if (a[property].toLowerCase() > b[property].toLowerCase()) return 1;
      return 0;
    });
  }

  parseOutput(command) {
    const output = execSync(command);
    if (output) {
      return output.toString().replace(/^\s+|\s+$/g, '');
    }

    return null;
  }

  electronOpenLinkInBrowser(url, event) {
    let ev = event;
    if (isElectronRenderer()) {
      if (url && url.preventDefault) {
        ev = url;
        ev.preventDefault();
        shell.openExternal(ev.target.href);
      } else {
        ev.preventDefault();
        shell.openExternal(url);
      }
    } else if (url && !url.preventDefault) {
      ev.preventDefault();
      window.location.href = url;
    }
  }

  electronOpenLink(url, event) {
    event.preventDefault();
    window.open(url, 'modal');
  }
}

module.exports = new Utils();
