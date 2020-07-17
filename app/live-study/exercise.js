export default (() => {
  function Exercise(path, dirPath, report) {
    if (typeof path !== 'string') {
      throw new TypeError('path must be a string');
    };
    this.path = {
      rel: path,
      abs: dirPath,
    };
    this.report = report;
    this.loaded = false;
    this.monacoModel = null;
  }

  // Promise.all this
  Exercise.prototype.load = async function () {
    try {
      Object.assign(this, (await import(`${window.location.origin}${window.location.pathname}${this.path.abs.slice(1)}/index.js`)).default);
      if (this.report.starter === 'none') {
        this.starter = `const ${this.name || 'fuzzed'} = `;
      } else if (this.report.starter === 'file') {
        const starterRes = await fetch(`.${this.path.abs}/starter.js`);
        this.starter = await starterRes.text();
        if (!this.starter.includes('"use strict"') && !this.starter.includes("'use strict'") && !this.starter.includes('`use strict`')) {
          this.starter = "'use strict';\n\n" + this.starter;
        }
      } else if (typeof this.report.starter === 'object') {
        const starterFetches = this.report.starter.files
          .map(file =>
            fetch(`.${this.path.abs}/starter/${file}`)
              .then(res => res.text())
          );
        if (this.report.starter._docstring) {
          starterFetches.push(fetch(`.${this.path.abs}/starter/_docstring.js`)
            .then(res => res.text())
          );
        }
        this.starter = await Promise.all(starterFetches);
        if (this.report.starter._docstring) {
          this._docstring = this.starter.pop();
        }
        for (let i = 0; i < this.starter.length; i++) {
          this.starter[i] = this._docstring + this.starter[i];
          if (!this.starter[i].includes('"use strict"') && !this.starter[i].includes("'use strict'") && !this.starter[i].includes('`use strict`')) {
            this.starter[i] = "'use strict';\n\n" + this.starter[i];
          }
        }
        this.activeStarter = 0;
      } else if (this.report.starter === 'snippet') {
        // it's already attached as a string property
      }
      if (Array.isArray(this.starter)) {
        this.monacoModel = this.starter
          .map(starterCode => {
            const model = monaco.editor.createModel(starterCode, 'javascript');
            model.updateOptions({ tabSize: 2 });
            return model;
          });
      } else {
        console.log(this)
        this.monacoModel = monaco.editor.createModel(this.starter, 'javascript');
      }

      if (this.report.readme) {
        const readmeRes = await fetch(`.${this.path.abs}/README.md`);
        const readmePreClean = await readmeRes.text();
        this.readme = readmePreClean.replace(/(<!--[ \t]*BEGIN REPORT[ \t]*-->)([^;]*)(<!--[ \t]*END REPORT[ \t]*-->)/, '');
      }
      this.loaded = true;

      return this;
    } catch (err) {
      console.error(err);
    };
  }

  Object.freeze(Exercise);

  return Exercise;
})();
