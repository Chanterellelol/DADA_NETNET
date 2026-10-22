const cowsay = require("cowsay");

const appName = "My Mobile App";

console.log(
  cowsay.say({
    text: `${appName} has started!`,
    e: "oO",
    T: "U "
  })
);

function showMessage(text) {
  console.log(cowsay.say({ text: text }));
}

showMessage("Loading interface...");
showMessage("Connecting to server...");

console.log(
  cowsay.think({
    text: `${appName} finished successfully!`
  })
);