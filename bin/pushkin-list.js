#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');

function showControllerList() {
  try {
    const controllers = fs.readdirSync(path.resolve('./controllers'));
    controllers.forEach(a => {
      console.log(chalk.magenta(path.parse(a).name));
    });
  } catch (err) {
    console.log(chalk.red('please make sure to run this in a pushkin folder'));
  }
}

program.parse(process.argv);

const thing = program.args[0];
if (thing) {
  switch (thing) {
    case 'controller':
      showControllerList();
      break;
    case 'model':
      break;
    default:
      console.log('please enter a command');
  }
} else {
  console.log(chalk.red('missing entity name'));
}
