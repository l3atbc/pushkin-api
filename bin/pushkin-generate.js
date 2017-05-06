#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');
const program = require('commander');
const chalk = require('chalk');
const moment = require('moment');

function addController(quizname) {
  try {
    const from = path.resolve('./bin/generalController/generalController.js');
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
function checkIfFileExist(fileList, quizname) {
  return fileList.some(element => {
    return element.indexOf(quizname) > 0;
  });
}
function copySchemas(quizname, mapObj, fileList) {
  const schemas = fs.readdirSync(path.resolve('./bin/generalSchemas'));
  const sortedSchemas = schemas.sort();
  sortedSchemas.forEach((currentSchema, index) => {
    return fs.readFile(
      `../pushkin-api/bin/generalSchemas/${currentSchema}`,
      'utf8',
      (err, data) => {
        if (err) {
          return console.log('err on reading file', err);
        }
        const re = new RegExp(Object.keys(mapObj).join('|'), 'g');
        const result = data.replace(re, matched => {
          return mapObj[matched];
        });
        const formatedFileName = currentSchema.replace(/\d_/, '');
        return fs.writeFile(
          path.resolve(
            `../pushkin-db/migrations/${moment()
              .add(index, 'second')
              .format('YYYYMMDDHHmmss')}_create_${quizname}_${formatedFileName}`
          ),
          result,
          err => {
            if (err) return console.log('error while writing file', err);
          }
        );
      }
    );
  });
}
function copyModels(quizname, mapObj) {
  fs.mkdirSync(`../pushkin-db/models/${quizname}`);
  const models = fs.readdirSync(path.resolve('./bin/generalModels'));
  models.forEach(currentModel => {
    return fs.readFile(
      `../pushkin-api/bin/generalModels/${currentModel}`,
      'utf8',
      (err, data) => {
        if (err) {
          return console.log('err on reading file', err);
        }
        const re = new RegExp(Object.keys(mapObj).join('|'), 'g');
        const result = data.replace(re, matched => {
          return mapObj[matched];
        });
        // const formatedFileName = currentModel.replace('.js', '');
        return fs.writeFile(
          path.resolve(
            `../pushkin-db/models/${quizname}/${quizname}_${currentModel}`
          ),
          result,
          err => {
            if (err) return console.log('error while writing file', err);
          }
        );
      }
    );
  });
}
function copySeeds(quizname) {
  fs.mkdirSync(`../pushkin-db/seeds/${quizname}`);
  try {
    const from = path.resolve('./bin/generalSeeds');
    const to = path.resolve(`../pushkin-db/seeds/${quizname}`);
    fs.copy(from, to, err => {
      if (err) {
        return console.log(chalk.red('err on copying seed files'));
        process.exit(1);
      }
      process.exit();
    });
  } catch (err) {
    console.log(chalk.red('please make sure to run this in a pushkin folder'));
  }
}
function addModel(quizname) {
  const schemaFileList = fs.readdirSync(
    path.resolve('../pushkin-db/migrations')
  );
  const modelFileList = fs.readdirSync(path.resolve('../pushkin-db/models'));
  const seedFileList = fs.readdirSync(path.resolve('../pushkin-db/seeds'));
  if (
    checkIfFileExist(schemaFileList, quizname) ||
    checkIfFileExist(modelFileList, quizname) ||
    checkIfFileExist(seedFileList, quizname)
  ) {
    return console.log(
      chalk.red(
        'quiz model already exist, please try editing the existing files'
      )
    );
  } else {
    try {
      const mapObj = {
        trials: `${quizname}_trials`,
        questions: `${quizname}_questions`,
        choices: `${quizname}_choices`,
        users: `${quizname}_users`,
        responses: `${quizname}_responses`
      };
      return new Promise((resolve, reject) => {
        copySchemas(quizname, mapObj, schemaFileList);
        resolve();
      })
        .then(() => {
          copyModels(quizname, mapObj);
        })
        .then(() => {
          copySeeds(quizname);
        });
    } catch (err) {
      console.log('error!!', err);
    }
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
