import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

import percentPassing from '../lib/percent-pass.js';
import generateTests from '../lib/test-generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = JSON.parse(fs.readFileSync(path.normalize(path.join(__dirname, '..', 'config.json')), 'utf-8'));

// declare constants
const EXERCISES_DIR = path.normalize(path.join(__dirname, '..', config.path));
const PARENT_DIR = path.normalize(path.join(__dirname, '..'));

// make sure the exercises directory exists
try {
  fs.accessSync(EXERCISES_DIR);
} catch (err) {
  console.log(`--- creating ${config.path} directory ---`);
  fs.mkdirSync(EXERCISES_DIR);
};

// a function for prettier logs, not very important
const removeDirname = dirName => dirName.split(PARENT_DIR).join('  ...  ');

// the function that will create an object with the same file paths as your /exercises folder
const register = async function (dirPath) {

  const dirs = [];

  // get an array of all file names in the directory
  const paths = fs.readdirSync(dirPath);

  for (let nextPath of paths) {

    if (nextPath === 'starter') { continue; }

    // is the next path a directory or a file?
    const isDirectory = fs.statSync(path.normalize(path.join(dirPath, nextPath))).isDirectory();
    // if it is a file, and not a javascript file, or md file, skip it
    if (nextPath.includes('.git')) { continue };

    let subDirReport = {};
    if (isDirectory) {

      const subPath = path.normalize(path.join(dirPath, nextPath));
      const readmePath = path.normalize(path.join(subPath, 'README.md'));
      const indexPath = path.normalize(path.join(subPath, 'index.js'));
      const starterFilePath = path.normalize(path.join(subPath, 'starter.js'));
      const starterDirectoryPath = path.normalize(path.join(subPath, 'starter'));
      const docstringPath = path.normalize(path.join(subPath, 'starter/-docstring.js'));
      const hasIndex = fs.existsSync(indexPath);
      const hasReadme = fs.existsSync(readmePath);
      const hasStarterFile = fs.existsSync(starterFilePath) && !fs.statSync(starterFilePath).isDirectory();
      let hasStarterDirectory;
      try {
        hasStarterDirectory = fs.existsSync(starterDirectoryPath) && fs.statSync(starterDirectoryPath).isDirectory();
      } catch (err) {
        hasStarterDirectory = false;
      }


      let exercise = null;
      if (hasIndex) {
        try {
          exercise = (await import(indexPath)).default;
        } catch (err) {
          console.log('---');
          console.log(indexPath);
          console.error(err);
          console.log('---');
          exercise = err;
        }
      }

      if (exercise instanceof Error) {
        subDirReport = {
          readme: hasReadme,
          error: exercise
          // date: (new Date()).toJSON()
        };
      } else if (exercise) {
        const registerStarterFiles = () => {
          const files = fs.readdirSync(starterDirectoryPath)
            .filter(nextPath => {
              const starterFilePath = path.normalize(path.join(starterDirectoryPath, nextPath));
              return !fs.statSync(starterFilePath).isDirectory();
            })
            .filter(nextPath => {
              const starterFilePath = path.normalize(path.join(starterDirectoryPath, nextPath));
              return path.extname(starterFilePath) === '.js';
            })
            .filter(nextPath => {
              return nextPath !== 'docstring.js'
            });
          const docstring = fs.existsSync(docstringPath);
          // if (docstring) {
          //   files.shift();
          // }
          return {
            files,
            docstring
          }
        };
        subDirReport = {
          readme: hasReadme,
          solution: exercise.solution && typeof exercise.solution === 'function',
          args: exercise.args && typeof exercise.args === 'function',
          starter: (exercise.starter && typeof exercise.starter === 'string')
            ? 'snippet'
            : hasStarterFile
              ? 'file'
              : hasStarterDirectory
                ? registerStarterFiles()
                : 'none',
          // date: (new Date()).toJSON()
        };
        if (Array.isArray(subDirReport.starter)
          && subDirReport.starter.includes('docstring.js')) {
          subDirReport.docstring = true;
        }
      }

      if (subDirReport.solution && subDirReport.args) {
        const tests = generateTests({ solution: exercise.solution, args: exercise.args, length: 100 });
        const evalReport = percentPassing(exercise.solution, tests);
        subDirReport.passing = evalReport.passing;
        subDirReport.failing = evalReport.failing;
      }


      if (hasReadme && !subDirReport.error) {
        const percent = subDirReport.passing;
        const newReport = '\n'
          // + (subDirReport.name ? `> - name: ${subDirReport.name} \n` : '')
          + `> - solution: ${subDirReport.solution ? 'ok' : 'not a function'} \n`
          + `> - args: ${subDirReport.args ? 'ok' : 'not a function'} \n`
          + `> - passing: ${typeof percent === 'number'
            ? percent + '%'
            : 'N/A'} \n`
          + `> - starter: ${hasStarterDirectory ? 'directory' : subDirReport.starter}\n`
          + (hasStarterDirectory
            ? subDirReport.starter && subDirReport.starter.docstring
              ? '>   - docstring: true\n'
              : '>   - docstring: false\n'
            : '');
        // + `> - ${(new Date()).toLocaleString()}\n`;

        const readme = fs.readFileSync(readmePath, 'utf-8');

        const reportRegex = /(<!--[ \t]*BEGIN REPORT[ \t]*-->)([^;]*)(<!--[ \t]*END REPORT[ \t]*-->)/;
        const reportReplacer = `<!-- BEGIN REPORT -->${newReport}<!-- END REPORT -->`;
        const newReadme = readme.match(reportRegex)
          ? readme.replace(reportRegex, reportReplacer)
          : `${reportReplacer}\n\n${readme}`;

        fs.writeFileSync(readmePath, newReadme);
      } else if (subDirReport.error) {
        const newReport = '\n'
          + `> - ${subDirReport.error} \n`

        const readme = fs.readFileSync(readmePath, 'utf-8');

        const reportRegex = /(<!--[ \t]*BEGIN REPORT[ \t]*-->)([^;]*)(<!--[ \t]*END REPORT[ \t]*-->)/;
        const reportReplacer = `<!-- BEGIN REPORT -->${newReport}<!-- END REPORT -->`;
        const newReadme = readme.match(reportRegex)
          ? readme.replace(reportRegex, reportReplacer)
          : `${reportReplacer}\n\n${readme}`;

        fs.writeFileSync(readmePath, newReadme);
      }


      if (hasIndex) {
        const failReport = subDirReport.failing;
        delete subDirReport.failing;
        fs.writeFileSync(path.normalize(path.join(subPath, 'report.json')),
          JSON.stringify(subDirReport, (key, value) => {
            if (value instanceof Error) {
              return value.toString();
            }
            return value;
          }, '  '));
        try {
          fs.unlinkSync(path.normalize(path.join(subPath, 'failing-tests.js')));
        } catch (err) { };
        if (failReport.length > 0) {
          console.log('failing tests in ' + subPath);
          fs.writeFileSync(path.normalize(path.join(subPath, 'failing-tests.js')),
            JSON.stringify(failReport, (key, value) => {
              if (value instanceof Error) {
                return value.stack;
              } else if (typeof value === 'function') {
                return value.toString();
              } else if (value === undefined) {
                return "__undefined__"
              } else if (typeof value === 'symbol') {
                return String(value);
              }

              return value;
            }, '  '));
        }
      }

      // recursively register the path if it's a directory
      //  this will create a virtual folder structure for this path
      const subDir = await register(path.normalize(path.join(dirPath, nextPath)));
      if (exercise && subDirReport.args && subDirReport.solution) {
        subDir.isExercise = true;
      }
      if (subDir.isExercise) {
        subDir.report = subDirReport;
      }
      if (subDir) {
        // add the registered sub-directory to the current virtual directory
        dirs.push(subDir);
      }

    }
  };
  // create the new virtual directory object
  const virDir = {
    //  convert the absolute path to a relative path using unix file separators
    path: '/' + dirPath
      .split(path.sep).join('/')
      .split('/').pop(),
  };

  // add the virtual files & sub-directories if they exist
  if (dirs.length > 0) { virDir.dirs = dirs; }

  // return the new virtual directory
  return virDir;
};


console.log('\n--- registering .js files in ' + removeDirname(EXERCISES_DIR) + ' ---\n');

// register the /exercises directory
register(EXERCISES_DIR)
  .then(registered => {
    // merge the repository config into the virtual directory
    registered.config = config;
    // set the date/time of last build
    registered.lastBuild = (new Date()).toJSON();

    console.log('\n--- writing /index.json ---\n');

    // write the file
    const stringifiedReg = JSON.stringify(registered, null, '  ');
    fs.writeFileSync(path.normalize(path.join('index.json')), stringifiedReg);

    // re-render the /exercises table of contents

    const tableOfContents = (virDir, path, indent) => {
      indent = indent || '';
      path = path || '';
      const dirList = virDir.dirs
        ? virDir.dirs
          .map(subDir => {
            const subIndex = tableOfContents(subDir, path + subDir.path, indent + '  ');
            const reviewPath = path + subDir.path;
            return `${indent}- [${subDir.path}](.${reviewPath})`
              + (subDir.isExercise ? ` - ${subDir.report.error ? subDir.report.error.toString() : typeof subDir.report.passing == 'number' ? subDir.report.passing + '%' : 'N/A'}` : '')
              + (subIndex ? '\n' + subIndex : '\n');
          })
          .reduce((list, li) => list + li, '')
        : '';
      return dirList;
    }

    const newToc = tableOfContents(registered);
    const tocRegex = /(<!--[ \t]*BEGIN TOC[ \t]*-->)([^;]*)(<!--[ \t]*END TOC[ \t]*-->)/;
    const tocReplacer = `<!-- BEGIN TOC -->\n${newToc}\n<!-- END TOC -->`;
    const readmePath = path.normalize(path.join(EXERCISES_DIR, 'README.md'));
    const oldReadme = fs.existsSync(readmePath)
      ? fs.readFileSync(readmePath, 'utf-8')
      : '';
    const newReadme = oldReadme.match(tocRegex)
      ? oldReadme.replace(tocRegex, tocReplacer)
      : `${oldReadme}\n\n${tocReplacer}`;
    fs.writeFileSync(readmePath, newReadme);
  })
  .catch(err => console.error(err));
