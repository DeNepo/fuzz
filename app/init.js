import LiveStudy from './live-study/main.js';

window.onload = async () => {

  fetch(`./index.json`)
    .then(res => res.json())
    .then(index => {
      document.getElementById('title').innerHTML = index.config.title;
      document.getElementById('header').innerHTML = index.config.title + '/';

      window.liveStudyApp = new LiveStudy(index, editor, document.getElementById('study-buttons'), document.getElementById('description'));
      // console.log(liveStudyApp)

      const urlString = window.location.href;
      const url = new URL(urlString);
      const encodedPath = url.searchParams.get("path");
      let exercise = null;
      if (encodedPath) {
        const path = decodeURIComponent(encodedPath);
        const splitPath = path.split('/');
        let currentPopulated = liveStudyApp;
        for (let nextPath of splitPath) {
          if (!nextPath) { continue; }
          const subPopulated = currentPopulated.populated
            .find(populated => populated.path === '/' + nextPath);
          currentPopulated = subPopulated;
        }
        if (currentPopulated) {
          exercise = currentPopulated.exercise;
        }
      }
      if (!exercise) {
        const findFirstExercise = (populated) => {
          if (!Array.isArray(populated)) { return null; }
          const atThisLevel = populated
            .find(subPop => subPop.isExercise);
          if (atThisLevel) {
            return atThisLevel.exercise;
          } else {
            for (let subPop of populated) {
              const didFind = findFirstExercise(subPop.populated);
              if (didFind) {
                return didFind;
              }
            }
          }
        }
        exercise = findFirstExercise(liveStudyApp.populated);
      }

      exercise.load()
        .then((loadedExercise) => {
          liveStudyApp.active = loadedExercise;

          liveStudyApp.editor.setModel(loadedExercise.monacoModel)
          liveStudyApp.active = loadedExercise;
          liveStudyApp.renderDescription();

          const view = liveStudyApp.render();
          document.getElementById('drop-down').appendChild(view);

          history.replaceState(null, "", `?path=${encodeURIComponent(loadedExercise.path.abs)}`);
          document.getElementById('current-path').innerHTML = loadedExercise.path.abs.split('/').slice(2).join('/');
        })
        .catch(err => console.error(err));

    })
    .catch(err => console.error(err));

};
