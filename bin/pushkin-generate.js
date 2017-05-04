#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
const moment = require('moment');

function addController(quizname) {
  try {
    const from = path.resolve(
      './controllers/generalController/generalController.js'
    );
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
function addModel(quizname) {
  try {
    const schemas = fs.readdirSync(
      path.resolve('../pushkin-db/migrations/generalSchemas')
    );
    const sortedSchemas = schemas.sort();
    const mapObj = {
      trials: `${quizname}_trials`,
      questions: `${quizname}_questions`,
      choices: `${quizname}_choices`,
      users: `${quizname}_users`,
      responses: `${quizname}_responses`
    };
    sortedSchemas.forEach((currentSchema, index) => {
      return fs.readFile(
        `../pushkin-db/migrations/generalSchemas/${currentSchema}`,
        'utf8',
        (err, data) => {
          if (err) {
            return console.log('err on reading file', err);
          }
          const re = new RegExp(Object.keys(mapObj).join('|'), 'gi');
          const result = data.replace(re, matched => {
            return mapObj[matched];
          });
          const formatedFileName = currentSchema.replace(/\d_/, '');
          return fs.writeFile(
            path.resolve(
              `../pushkin-db/migrations/${moment()
                .add(index, 'second')
                .format(
                  'YYYYMMDDHHmmss'
                )}_create_${quizname}_${formatedFileName}`
            ),
            result,
            function(err) {
              if (err) return console.log('error while writing file', err);
            }
          );
        }
      );
    });
  } catch (err) {
    console.log('error!!', err);
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
      addModel(name);
      break;
    default:
      console.log('please input a command');
  }
} else {
  console.log(chalk.red('missing entity or name'));
}
