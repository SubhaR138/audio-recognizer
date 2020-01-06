//make prediction in real time

let recognizer;

function predictWord(){
    
//wordLabels() returns an array of all currently supported words the model able to recognize
    
        const words=recognizer.wordLables();
    
//scores contains the probabilty scores that corresponds to recognizer.wordLables()
//['background_noise','go','one'] and so on...
    
        recognizer.listen(({scores}) => {
        
// Turn scores into a list of (score,word) pairs.
        
        scores = Array.from(scores).map((s, i) => ({score: s, word: words[i]}));
        
// Find the most probable word.
/*sort function takes the comparison function as parameter
        shortcut notation for ((s1,s2)=>s2-s1)) is
        function(s1,s2){
          return s2-s1;
 }*/
        
        scores.sort((s1, s2) => s2.score - s1.score);
        document.querySelector('#console').textContent = scores[0].word;
      }, {probabilityThreshold: 0.75});
     }
     //we will use this app() function to load our sppechcommand model
     async function app() {

       //when calling create method we must define the type of audio input
       //browser FFT uses the browser's native fourier transform
       //fft coverts a signal into corresponding frequency domain
       //we can observe how nicely the sound will be observed by using frequency domain

      recognizer = speechCommands.create('BROWSER_FFT');
      await recognizer.ensureModelLoaded();
      predictWord();
     }
     
     app();
    
     