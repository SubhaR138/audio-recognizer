//make prediction in real time

let recognizer;

function predictWord(){
    
//wordLabels() returns an array of all currently supported words the model able to recognize
    
const words = recognizer.wordLabels();
    
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

      /*probabilty threshold:The listen function should call the callback function
      *if the probability threshold of all words greater than this threshold point*/
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
     //collect data

     const NUM_FRAMES=3;//one frame is 23ms of audio

/*an audio frame contains amplitude information at that particular point in time,
*to produce sounds tens of thousands of frames are played in sequence to produce frequencies*/
     let examples=[];

/*pressing the three buttons that we are created in html file will call the collect function,
*which will creating training examples for our model.collect() associates a label
*with the o/p of recognizer.liten*/

     function collect(labels){
       if(recognizer.isListening()){
         return(recognizer.stopListening());
       }
       if(recognizer==null){
         return;
       }

/*since the spectogram is true the recognizerlisten gives the new spectogram for 1sec of audio
*divided into 43 frames,so each frame is 23 ms of audio.
*framesize is the size in bytes of each frame*/

       recognizer.listen(async ({spectrogram: {frameSize, data}}) => {

/*to avoid numerical issues we normalize the data to have an average of 0 and standard deviation 1*/

        let vals = normalize(data.subarray(-frameSize * NUM_FRAMES));

//label 0,1,2 for left,right and noise
//vals are 696 numbers holding the frequency information
        examples.push({vals, label});
      
//storing all data in example variable
        document.querySelector('#console').textContent =
            `${examples.length} examples collected`;
      }, {

/*overlapfactor controls how often the recognizer performs prediction spectogram,
*must be >=0 or <=1 */

        overlapFactor: 0.999,

//let the callback function invoked with the spectogram data included in the argument
        includeSpectrogram: true,
        invokeCallbackOnNoiseAndUnknown: true
//whether the callback function invoked if the word with max probabilty is 'noise' or 'unknown' token.
      });
     }

     //the spectogram values are usually a large negative numbers around -100 and deviation 10.
     function normalize(x) {
      const mean = -100;
      const std = 10;
      return x.map(x => (x - mean) / std);
     }
     }
    
     