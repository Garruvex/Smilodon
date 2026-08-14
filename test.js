// // const { startOwoifier } = require("./djs-bot/util/owoifier.js");

// // console.log(startOwoifier("I love you, would you marry me?"));
// // message = "https://twitter.com/TheRotFox/status/1720488445049446815";
// // let urlRegex = /https?:\/\/x\.com\/(\S+)/gi;
// // if (message.includes("twitter.com")) {
// //   const urlRegex = /https?:\/\/twitter\.com\/(\S+)/gi;
// // }

// // const modifiedContent = message.replace(urlRegex, (match, path) => {
// //   // Replace 'x.com' with 'fxtwitter.com' but keep the captured path
// //   return `https://fxtwitter.com/${path}`;
// // });
// // message = "https://www.furaffinity.net/view/30223720/";
// message = "https://www.twitter.com/TheRotFox/status/1720488445049446815";
// const listOfStrings = ["x.com", "twitter.com", "furaffinity.net"];
// const containsLink = listOfStrings.some((str) => message.includes(str));
// console.log(containsLink);
// const listOfString = ["x.com", "twitter.com"];

// const urlRegex =
//   /https?:\/\/(?:www\.)?(x\.com|twitter\.com|furaffinity\.net)\/(\S+)/gi;

// // Replace 'https://x.com/' with 'https://fxtwitter.com/'
// const modifiedContent = message.replace(urlRegex, (match, domain, path) => {
//   // Replace 'x.com' with 'fxtwitter.com' but keep the captured path
//   console.log(domain, path);
//   if (listOfString.includes(domain)) {
//     console.log("x.com");
//     // Assuming you want to replace 'x.com' with 'fxtwitter.com' and 'twitter.com' with 'fxtwitter.com'
//     return `https://fxtwitter.com/${path}`;
//   } else if (domain === "furaffinity.net") {
//     console.log("furaffinity.net");
//     // Handle the 'furaffinity.net' case
//     return `https://fxfuraffinity.net/${path}`;
//   } else {
//     // If the domain isn't in the listOfStrings or 'furaffinity.net', return the match unmodified
//     return match;
//   }
// });

// console.log(modifiedContent);

// const {
//   translate,
//   Translator,
//   speak,
//   singleTranslate,
//   batchTranslate,
//   languages,
//   isSupported,
//   getCode,
// } = require("google-translate-api-x");

// async function googleTranslate(query, options) {
//   const text = await translate("Привет, мир! Как дела?", {
//     to: "auto",
//     to: "zh-TW",
//     autoCorrect: true,
//   });

//   console.log(text);
// }
// googleTranslate();

// googleTranslate("I am using Google Translate.", { to: "en" })
//   .then((res) => {
//     console.log(res.text); // Output: Estoy usando Google Translate.
//     // Here you can also see additional translation data:
//     console.log(res.from.language.iso); // Output: en
//   })
//   .catch((err) => {
//     console.error(err);
//   });

function createTextBar(count, maxVotes, barLength = 10) {
  const barUnit = maxVotes / barLength;
  const barSize = Math.round(count / barUnit);
  return "▓".repeat(barSize) + "░".repeat(barLength - barSize);
}

const yesCount = 5;
const noCount = 3;

const results = [
  { emoji: "⭕", count: yesCount },
  { emoji: "✖️", count: noCount },
];
let barChart = results
  .map((result) => {
    return `${result.emoji} ${createTextBar(
      result.count,
      yesCount + noCount
    )} ${result.count}`;
  })
  .join("\n");

console.log(barChart);
