#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
var program = require('commander');

program.command(
  'generate [thing] [name]',
  'generate a new controller or model'
);
program.command('delete [thing] [name]', 'delete a controller');
program.command('list [thing]', 'show list of entities');

program.parse(process.argv);
