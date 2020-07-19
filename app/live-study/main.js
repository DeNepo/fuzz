import Exercise from './exercise.js';

export default class LiveStudy {

  title = 'Live Study';
  virDir = {};
  populated = {};
  active = null;
  editor = null;
  descriptionContainer = null;
  alternateStarterContainers = null;
  buttonsContainer = null;
  loopGuard = {
    active: false,
    max: 20
  }

  constructor(index, editor, buttonsContainer, descriptionContainer, alternateStarterContainers) {
    this.virDir = index;
    this.populated = [LiveStudy.populate(index, index.path, index.config)];
    this.title = index.config.title;
    this.editor = editor;
    this.buttonsContainer = buttonsContainer;
    this.descriptionContainer = descriptionContainer;
    this.alternateStarterContainers = alternateStarterContainers;
    if (index.config.loopGuard) {
      this.loopGuard = index.config.loopGuard;
    }
  }

  static populate(data, path) {
    const copy = Object.assign({}, data);
    copy.isExercise = data.isExercise;
    copy.exercise = new Exercise(data.path, path, data.report);
    if (data.dirs) {
      copy.populated = [];
      for (let subDir of data.dirs) {
        copy.populated.push(LiveStudy.populate(subDir, path + subDir.path));
      };
    };
    return copy;
  }

  static insertLoopGuards(code, maxIterations) {
    let loopNum = 0;
    const guarded = code.replace(/for *\(.*\{|while *\(.*\{|do *\{/g, loopHead => {
      const id = ++loopNum;
      return `let loopGuard${id} = 0;\n${loopHead}\nif (++loopGuard${id} > ${maxIterations}) { throw new Error('Loop exceeded ${maxIterations} iterations'); }\n`
    });
    return guarded;
  }

  renderExercises(virDir = this) {
    if (virDir.isExercise && virDir.report && virDir.report.passing !== 100) {
      return document.createTextNode('');
    } else if (virDir.isExercise) {
      const exercise = virDir.exercise;
      const exerciseEl = document.createElement('button');
      exerciseEl.innerHTML = Array.isArray(exercise.starter)
        ? exercise.path.rel + '...'
        : exercise.path.rel;
      exercise.path.rel;
      exerciseEl.onclick = () => {
        history.replaceState(null, "", `?path=${encodeURIComponent(exercise.path.abs)}`);
        document.getElementById('current-path').innerHTML = exercise.path.abs.split('/').slice(2).join('/');

        if (!exercise.loaded) {
          exercise.load()
            .then((loadedExercise) => {
              const model = Array.isArray(exercise.monacoModel)
                ? exercise.monacoModel[exercise.activeStarter]
                : exercise.monacoModel;
              this.editor.setModel(model);
              this.active = loadedExercise;
              this.renderDescription();
              this.renderAlternateStarters();
            })
            .catch(err => console.error(err));
        } else {
          this.active = exercise;
          const model = Array.isArray(exercise.monacoModel)
            ? exercise.monacoModel[exercise.activeStarter]
            : exercise.monacoModel;
          this.editor.setModel(model);
          this.renderDescription();
          this.renderAlternateStarters();
        }
      };

      const exerciseContainer = document.createElement('div');
      exerciseContainer.style = 'margin-top: 0.5em; margin-bottom: 0.5em;';
      exerciseContainer.appendChild(exerciseEl);

      return exerciseContainer;
    } else {
      const detailsEl = document.createElement('details');
      detailsEl.style = 'margin-top: 1%; margin-bottom: 1%;';

      const summaryEl = document.createElement('summary');
      summaryEl.innerHTML = virDir.path;
      detailsEl.appendChild(summaryEl);

      const subListEl = document.createElement('ul');
      subListEl.style = 'padding-left: 1em';
      detailsEl.appendChild(subListEl);

      if (Array.isArray(virDir.populated)) {
        virDir.populated.forEach(subDir => {
          subListEl.appendChild(this.renderExercises(subDir));
        });
      }
      return detailsEl;
    }
  }

  runTests(inDebugger) {
    const exercise = this.active;
    const testified = (inDebugger ? '// study tip: place a breakpoint at the beginning of your function\ndebugger;\n\n' : '')
      + (this.loopGuard.active
        ? Array.isArray(this.active.monacoModel)
          ? LiveStudy.insertLoopGuards(this.active.monacoModel[this.active.activeStarter].getValue(), this.loopGuard.max)
          : LiveStudy.insertLoopGuards(this.active.monacoModel.getValue(), this.loopGuard.max)
        : Array.isArray(this.active.monacoModel)
          ? this.active.monacoModel[this.active.activeStarter].getValue()
          : this.active.monacoModel.getValue()) + '\n\n'
      + 'const tests = generateTests({\n'
      + '  args: exercise.args,\n'
      + '  solution: exercise.solution,\n'
      + '  length: 10\n'
      + '});\n\n'
      + 'const current = active;\n'
      + 'test(fuzzed, tests);';
    try {
      eval(testified);
    } catch (err) {
      console.error(err);
    }

  }

  renderLoopGuardEl() {

    const withLoopGuard = document.createElement('input');
    withLoopGuard.setAttribute('type', 'checkbox');
    withLoopGuard.checked = this.loopGuard.active;
    withLoopGuard.onchange = () => this.loopGuard.active = !this.loopGuard.active;

    const loopGuardInput = document.createElement('input');
    loopGuardInput.value = this.loopGuard.max;
    loopGuardInput.name = 'max';
    loopGuardInput.style = 'width:3em';
    loopGuardInput.onchange = () => this.loopGuard.max = Number(loopGuardInput.value);

    const loopGuardForm = document.createElement('form');
    loopGuardForm.style = 'display:inline-block;';
    loopGuardForm.appendChild(withLoopGuard);
    loopGuardForm.appendChild(document.createTextNode('loop guard: '));
    loopGuardForm.appendChild(loopGuardInput);

    return loopGuardForm;
  }

  renderStudyButtons() {
    const container = document.createElement('div');



    const formatButton = document.createElement('button');
    formatButton.innerHTML = 'format code';
    formatButton.onclick = () => editor.trigger('anyString', 'editor.action.formatDocument');;
    container.appendChild(formatButton);

    container.appendChild(this.renderLoopGuardEl());

    container.appendChild(document.createElement('br'));

    const testCode = document.createElement('button');
    // testCode.style = 'padding-right: .5em; width: 20%;';
    testCode.innerHTML = 'run tests';
    testCode.onclick = () => this.runTests();
    container.appendChild(testCode);

    const inDebugger = document.createElement('button');
    // testCode.style = 'padding-right: .5em; width: 20%;';
    inDebugger.innerHTML = 'in debugger';
    inDebugger.onclick = () => {
      // console.clear();
      this.runTests(true);
    };
    container.appendChild(inDebugger);


    const jsTutorButton = document.createElement('button');
    jsTutorButton.innerHTML = 'in JS Tutor';
    jsTutorButton.onclick = () => {
      const encodedJST = encodeURIComponent(editor.getValue());
      const sanitizedJST = encodedJST
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/%09/g, '%20%20');
      const jsTutorURL = "http://www.pythontutor.com/live.html#code=" + sanitizedJST + "&cumulative=false&curInstr=2&heapPrimitives=false&mode=display&origin=opt-live.js&py=js&rawInputLstJSON=%5B%5D&textReferences=false";
      window.open(jsTutorURL, '_blank');
    };
    container.appendChild(jsTutorButton);


    this.buttonsContainer.innerHTML = '';
    this.buttonsContainer.appendChild(container);
  }

  renderDescription() {
    if (!this.active) { return };
    if (this.active.readme) {
      this.descriptionContainer.innerHTML = marked(this.active.readme);
    } else {
      this.descriptionContainer.innerHTML = '';
    }
  }

  renderAlternateStarters() {
    // debugger;
    this.alternateStarterContainers.innerHTML = '';
    if (!this.active) { return };
    if (Array.isArray(this.active.monacoModel)) {
      const allButtons = [];
      const switchActive = (e) => {
        const index = Number(e.target.id);
        this.editor.setModel(this.active.monacoModel[index]);
        this.active.activeStarter = index;
        allButtons.forEach((button, buttonIndex) => {
          if (buttonIndex === index) {
            button.style.backgroundColor = 'black';
            button.style.color = 'white';
          } else {
            button.style.backgroundColor = 'white';
            button.style.color = 'black';
          }
        });
      };
      for (let i = 0; i < this.active.monacoModel.length; i++) {
        const fileName = this.active.report.starter.files[i].split('.js').join('');
        const button = document.createElement('button');
        button.innerHTML = fileName;
        button.id = i;
        button.onclick = switchActive;
        allButtons.push(button);
        this.alternateStarterContainers.appendChild(button);
      }
      switchActive({ target: { id: 0 } });
    }
  }

  render() {
    const container = document.createElement('div');
    const renderedExercises = this.renderExercises();
    const unWrapped = renderedExercises.lastChild.lastChild.lastChild;
    const divContainer = document.createElement('div');
    for (let child of Array.from(unWrapped.children)) {
      divContainer.appendChild(child);
    }
    container.appendChild(divContainer);

    this.renderDescription();

    this.renderStudyButtons();


    return container;
  }
}

