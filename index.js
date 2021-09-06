require("dotenv").config();
const fetch = require("node-fetch");
const Discord = require("discord.js");
const fs = require("fs");
const chalk = require("chalk");
const {
  delay,
  InstagramUsername,
  discordWebhookID,
  discordWebhookToken,
  COOKIE
} = process.env;

const webhook = new Discord.WebhookClient(
  discordWebhookID,
  discordWebhookToken
);

const URL = `https://instagram.com/${InstagramUsername}/?__a=1`;

const database = "database.txt";
const filepath = "./" + database;
const shortDelay = delay * 0.5;
function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}
function timeNowISO() {
  let timeNow = new Date();
  let timeNowISO = timeNow.toISOString();

  return timeNowISO;
}
function consoleLog(threadID, message) {
  console.log(
    chalk.blue(timeNowISO()) + " " + chalk.magenta(threadID) + " " + message
  );
}
function getAvatarURL(threadID, jsonData) {
  consoleLog(threadID, "Retrieving the target user's avatar URL…");

  return jsonData["graphql"]["user"]["profile_pic_url_hd"];
}

function getLastPostURL(threadID, jsonData) {
  consoleLog(threadID, "Retrieving the target user's last post URL…");

  return jsonData["graphql"]["user"]["edge_owner_to_timeline_media"][
    "edges"
  ][0]["node"]["shortcode"];
}

function getLastImageURL(threadID, jsonData) {
  consoleLog(threadID, "Retrieving the target user's last image URL…");

  return jsonData["graphql"]["user"]["edge_owner_to_timeline_media"][
    "edges"
  ][0]["node"]["display_url"];
}
function getImageCaption(threadID, jsonData) {
  consoleLog(threadID, "Retrieving the target user's last post caption…");

  try {
    return jsonData["graphql"]["user"]["edge_owner_to_timeline_media"][
      "edges"
    ][0]["node"]["edge_media_to_caption"]["edges"][0]["node"]["text"];
  } catch (err) {
    consoleLog(threadID, "No caption for the last post was found.");

    return false;
  }
}
function sendEmbed(threadID, jsonData) {
  try {
    let authorAvatarURL = getAvatarURL(threadID, jsonData);
    let authorURL = "https://www.instagram.com/" + InstagramUsername + "/";
    if (!caption) {
      embed = new Discord.MessageEmbed()
        .setColor(`36393F`)
        .setAuthor(InstagramUsername, authorAvatarURL, authorURL)
        .setTitle(`New post by @${InstagramUsername}`)
        .setURL(
          `https://www.instagram.com/p/${getLastPostURL(threadID, jsonData)}/`
        )
        .setImage(getLastImageURL(threadID, jsonData))
        .setTimestamp();
    } else {
      embed = new Discord.MessageEmbed()
        .setColor(`36393F`)
        .setAuthor(InstagramUsername, authorAvatarURL, authorURL)
        .setTitle(`New post by @${InstagramUsername}`)
        .setURL(
          `https://www.instagram.com/p/${getLastPostURL(threadID, jsonData)}/`
        )
        .setDescription(getImageCaption(threadID, jsonData))
        .setImage(getLastImageURL(threadID, jsonData))
        .setTimestamp();
    }
    webhook.send({
      username: InstagramUsername,
      avatarURL: getAvatarURL(threadID, jsonData),
      embeds: [embed]
    });

    consoleLog(threadID, chalk.green("Embed sent to Discord."));
  } catch (err) {
    console.error(err);
    consoleLog(threadID, chalk.red("An error occured."));
  }
}

async function logData(threadID, oldData, newData) {
  consoleLog(threadID, "Old data: " + oldData);
  consoleLog(threadID, "New data: " + newData);
}

async function testData(threadID, oldData, newData, jsonData) {
  if (oldData == newData) {
    consoleLog(threadID, chalk.yellow("No new post(s) found."));
  } else {
    consoleLog(threadID, chalk.green("New post(s) found."));

    sendEmbed(threadID, jsonData);
    fs.access(filepath, fs.constants.R_OK, err => {
      if (err) {
        console.error(err);
        consoleLog(
          threadID,
          chalk.red(
            'An error occured trying to read the file "' + filename + '".'
          )
        );
      } else {
        fs.writeFile(filepath, newData, err => {
          if (err) {
            console.error(err);
            consoleLog(
              threadID,
              chalk.red(
                'An error occured trying to write to the file "' +
                  filename +
                  '".'
              )
            );
          } else {
            consoleLog(threadID, "New data written to " + filepath + ".");
          }
        });
      }
    });
  }
}

async function test(threadID, jsonData) {
  let oldData;

  setTimeout(function() {
    fs.access(filepath, fs.constants.R_OK, err => {
      if (err) {
        console.error(err);
        consoleLog(
          threadID,
          chalk.red(
            'An error occured trying to read the file "' + filename + '".'
          )
        );
      } else {
        fs.readFile(filepath, "utf8", (err, data) => {
          if (err) {
            console.error(err);
            consoleLog(
              threadID,
              chalk.red(
                'An error occured trying to read the file "' + filename + '".'
              )
            );
          } else {
            consoleLog(threadID, "Data read from " + filepath + ".");

            oldData = data;
          }
        });
      }
    });
  }, shortDelay);

  let newData = getLastPostURL(threadID, jsonData);
  setTimeout(function() {
    logData(threadID, oldData, newData);
    testData(threadID, oldData, newData, jsonData);
  }, delay);
}
async function main(threadID) {
  try {
    let options = {
      headers: {
        cookie: `sessionid=${COOKIE}`
      }
    };

    let jsonData;

    jsonData = await fetch(URL, options).then(res => res.json());

    setTimeout(function() {
      test(threadID, jsonData);
    }, delay);
  } catch (err) {
    console.error(err);
    consoleLog(threadID, chalk.red("An error occured."));
  }
}

consoleLog("0000", "Script initialised.");

setInterval(function() {
  let threadID = getRndInteger(1000, 9999).toString();

  setTimeout(function() {
    main(threadID);
  }, shortDelay);
}, delay);
