#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');

function addController(quizname) {
  try {
    const from = path.resolve('./controllers/whichEnglish.js');
    const to = path.resolve(`./controllers/${quizname}.js`);
    fs.copy(from, to, (err, success) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      process.exit();
    });
  } catch (err) {
    console.log(chalk.red('please make sure to run this in a pushkin folder'));
  }
}

program.parse(process.argv);

const thing = program.args[0];
const name = program.args[1];
if (thing && name) {
  console.log(chalk.blue('generating a new' + thing + ' named ' + name));
  switch (thing) {
    case 'controller':
      addController(name);
      break;
    case 'model':
      break;
    default:
      console.log('please input a command');
  }
} else {
  console.log('missing entity or name');
}
