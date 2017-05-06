const fs = require('fs');
const path = require('path');

let slack;
try      { slack = require('slack'); }
catch(e) { slack = require(path.resolve(__dirname, '../../../../executables/node_modules/slack/methods/index.js')); }

let Configs;
try      { Configs = require('./Configs'); }
catch(e) { Configs = require(path.resolve(__dirname, './Configs.js')); }
let Emojis;
try      { Emojis = require('./Emojis'); }
catch(e) { Emojis = require(path.resolve(__dirname, './Emojis.js')); }
let Wifi;
try      { Wifi = require('./Wifi'); }
catch(e) { Wifi = require(path.resolve(__dirname, './Wifi.js')); }


class Slack {
  constructor() {
    this.config = Configs.load();
  }

  checkToken(bool) {
    return new Promise((resolve, reject) => {
      bool = bool ||  null;
      this.config = Configs.load();

      if (!this.config || !this.config.token || this.config.token.length < 1) {
        if (process.env.APP_ENV === 'browser' || bool) {
          resolve(false);
          return;
        }
        else {
          throw new Error('Token not set');
        }
      }

      resolve(true);
      return;
    });
  }

  /**
   * Update the status with predefined one for the current SSID.
   *
   * @param {Object} ssidConfig - Current SSID config.
   * @param {Object} profile - Current profile in Slack.
   *
   * @returns {String} - Current SSID name.
   */
  setStatus(ssidConfig, profile) {
    return this.checkToken().then(() => {
      const parent = this;

      return new Promise((resolve, reject) => {
        if (ssidConfig && ssidConfig.status && ssidConfig.icon) {
          const payload = {
            token: parent.config.token,
            profile: Object.assign({},
              profile,
              {
                status_text: ssidConfig.status,
                status_emoji: `:${ssidConfig.icon}:`
              }
            )
          };

          slack.users.profile.set(payload, (error, data) => {
            if (error) {
              reject(error);
              return;
            }

            let response;
            const newStatus = `new status: ${Emojis.get(ssidConfig.icon)}  ${ssidConfig.status}`;
            if (data.ok) {
              response = `Succesfully set ${newStatus}\nOld was: ${Emojis.get(profile.status_emoji)}  ${profile.status_text}`;
            } else {
              response = `Failed to set new status: ${newStatus}`;
            }
            resolve(response);
          });
        } else {
          reject('Config not found');
        }
      });
    })
    .catch(error => {
      console.error(error);
      reject();
    })
  }

  /**
   * Checks the status and updates it if all the conditions are matched.
   *
   * @param {Boolean} forced - Force update.
   */
  checkStatus(forced = false) {
    return this.checkToken().then(() => {

      const parent = this;

      return new Promise((resolve, reject) => {
        slack.users.profile.get({ token: parent.config.token }, (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          const { status_emoji, status_text } = data.profile;

          Wifi.getSsidConfig()
            .then(ssidConfig => {
              if (
                (ssidConfig && forced)
                || (
                  ssidConfig
                  && (`:${ssidConfig.icon}:` !== status_emoji ||  ssidConfig.status !== status_text)
                  && (process.env.FORCE_UPDATE || parent.config.forceUpdate || (parent.isStatusPredefined(data.profile, ssidConfig) && !Wifi.isCurrentSsid(data.profile, ssidConfig)))
                )
              ) {
                parent.setStatus(ssidConfig, data.profile)
                  .then(response => resolve(response))
                  .catch(reason => reject(reason))
                  ;
              } else {
                resolve(`Already up-to-date, status: ${Emojis.get(status_emoji)}  ${status_text}`);
              }
            })
        });
      });
    })
      .catch(error => {
        console.error(error);
        reject();
      })
  }

  /**
   * Checks the status and updates it if all the conditions are matched.
   */
  loadStatus() {
    return this.checkToken().then(() => {
      const parent = this;

      return new Promise((resolve, reject) => {
        slack.users.profile.get({ token: parent.config.token }, (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data.profile);
        });
      });
    })
      .catch(error => {
        console.error(error);
        reject();
      })
  }

  /**
   * Checks the status and updates it if all the conditions are matched.
   */
  getEmojis() {
    return this.checkToken().then(() => {
      const parent = this;

      return new Promise((resolve, reject) => {
        slack.emoji.list({ token: parent.config.token }, (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data.emoji);
        });
      });
    })
      .catch(error => {
        console.error(error);
        reject();
      })
  }

  /**
   * Checks if the current status text is not predefined in config or not.
   *
   * @param {Object} profile - Current profile.
   * @param {String} currentSsid - Current SSID config.
   *
   * @returns {Boolean} - true = Predefined, false = Custom
   */
  isStatusPredefined(profile, currentSsid) {
    return !!this.config.ssids.find(s =>
      (
        s.status === profile.status_text
        && `:${s.icon}:` === profile.status_emoji
      )
    );
  }
}

module.exports = new Slack();