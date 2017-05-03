#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');

function deleteController(quizname) {
  try {
    const targetFile = path.resolve(`./controllers/${quizname}.js`);
    fs.unlink(targetFile, (err, success) => {
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
  console.log(chalk.blue('deleting a new' + thing + ' named ' + name));

  switch (thing) {
    case 'controller':
      deleteController(name);
      break;
    case 'model':
      break;
    default:
      console.log('please enter a command');
  }
} else {
  console.log(chalk.red('missing entity or name'));
}
