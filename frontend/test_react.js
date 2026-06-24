const assert = require("assert");

let state = [];
const queue = [];

function setState(updater) {
  queue.push(updater);
}

let nextService;
setState((prev) => {
  nextService = "updated";
  return ["updated"];
});

console.log("nextService is:", nextService);
