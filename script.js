//make prediction in real time
let recognizer;

function predictWord(){
    //wordLabels() returns an array of all currently supported words the model able to recognize
    const words=recognizer.wordLables();
    //scores contains the probabilty scores that corresponds to recognizer.wordLables()
    recognizer.listen(({scores}) => {
        // Turn scores into a list of (score,word) pairs.
        scores = Array.from(scores).map((s, i) => ({score: s, word: words[i]}));
        // Find the most probable word.
        scores.sort((s1, s2) => s2.score - s1.score);
        document.querySelector('#console').textContent = scores[0].word;
      }, {probabilityThreshold: 0.75});
     }
     
     async function app() {
      recognizer = speechCommands.create('BROWSER_FFT');
      await recognizer.ensureModelLoaded();
      predictWord();
     }
     
     app();
    
     