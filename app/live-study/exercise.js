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
    this.monacoModel = monaco.editor.createModel('', 'javascript');
    this.monacoModel.updateOptions({ tabSize: 2 });
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
      } else if (this.report.starter === 'snippet') {
        // it's already attached as a string property
      }
      this.monacoModel.setValue(this.starter);
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
