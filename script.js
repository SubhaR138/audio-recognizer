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
     // predictWord();
     buildModel();
     }
     
     app();
     //collect data

     const NUM_FRAMES=3;//one frame is 23ms of audio

/*an audio frame contains amplitude information at that particular point in time,
*to produce sounds tens of thousands of frames are played in sequence to produce frequencies*/
     let examples=[];

/*pressing the three buttons that we are created in html file will call the collect function,
*which will creating training examples for our model.collect() associates a label
*with the o/p of recognizer.listen*/

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
    
     //train a model

     const INPUT_SHAPE = [NUM_FRAMES, 232, 1];

//the first dimension is the number of audio frames
//second dimension(232) is the number of frequency datapoints in every frame of spectogram
//the last dimension is set to 1,this follows the convention of convolutional neural network in tfjs and keras

     let model;

    async function train() {
      toggleButtons(false);

//returns oneHot tensor among three classes

      const ys = tf.oneHot(examples.map(e => e.label), 3);

/*the three ... dots spread over the input shapes and all its properties,then
*overwrite the existing properties with the one we'are passing.*/

      const xsShape = [examples.length, ...INPUT_SHAPE];
      const xs = tf.tensor(flatten(examples.map(e => e.vals)), xsShape);
      console.log(xs);
    await model.fit(xs, ys, {
      batchSize: 16,
      epochs: 10,
      callbacks: {
      onEpochEnd: (epoch, logs) => {

//$ commonly used as identifier and shortcut to the function document.getElementByID

       document.querySelector('#console').textContent =
           `Accuracy: ${(logs.acc * 100).toFixed(1)}% Epoch: ${epoch + 1}`;

//toFixed method converts a number into a string,by keeping the specified number of decimals.

     }
    }
  });
       tf.dispose([xs, ys]);
       toggleButtons(true);
}

    function buildModel() {
       model = tf.sequential();

//covolutionlayer is used to process the audio data
//depthwiseConv2D applies convolution operation on each input channel separately.

       model.add(tf.layers.depthwiseConv2d({

/*depthmultiplier changes the number of channels in each layer,
*controls how many output channels are generated per input channel in the depthwise step.*/

       depthMultiplier: 8,
       kernelSize: [NUM_FRAMES, 3],
       activation: 'relu',
       inputShape: INPUT_SHAPE

//the input_shape of the model is [num-frames,232,1]
//232 is because the amount of frequencies needed to capture the human voice

 }));
       model.add(tf.layers.maxPooling2d({poolSize: [1, 2], strides: [2, 2]}));
       model.add(tf.layers.flatten());
       model.add(tf.layers.dense({units: 3, activation: 'softmax'}));
       const optimizer = tf.train.adam(0.01);
       model.compile({
           optimizer,
           loss: 'categoricalCrossentropy',
           metrics: ['accuracy']
        });
      }

//forEach method calls a function once for each element in an array

     function toggleButtons(enable) {
        document.querySelectorAll('button').forEach(b => b.disabled = !enable);
     }

     function flatten(tensors) {
       const size = tensors[0].length;
       const result = new Float32Array(tensors.length * size);
       tensors.forEach((arr, i) => result.set(arr, i * size));
       return result;
}

//The slider function reduces the slider for left ,increases for right and nochange for noise

async function moveSlider(labelTensor) {

  //we can call data() method and get its first argument to get our label from it.

  const label = (await labelTensor.data())[0];
  document.getElementById('console').textContent = label;
  if (label == 2) {
    return;
  }

  //delta rule is a gradient descent learning rule for updating the weights of the input

  let delta = 0.1;
  const prevValue = +document.getElementById('output').value;
  document.getElementById('output').value =
      prevValue + (label === 0 ? -delta : delta);
 }

 //this listen function listens to the microphone and makes real time prediction.

 function listen() {
  if (recognizer.isListening()) {
    recognizer.stopListening();

//we set the togglebuttons true,it will allow the listen function to start listening.

    toggleButtons(true);
    document.getElementById('listen').textContent = 'Listen';
    return;
  }
  toggleButtons(false);
  document.getElementById('listen').textContent = 'Stop';
  document.getElementById('listen').disabled = false;
 
  recognizer.listen(async ({spectrogram: {frameSize, data}}) => {

    //It normalizes the raw spectrogram

    const vals = normalize(data.subarray(-frameSize * NUM_FRAMES));
    const input = tf.tensor(vals, [1, ...INPUT_SHAPE]);

    //Here we call the trained model to make prediction.

    const probs = model.predict(input);

/*the output of model.predict is a tensor of shape[1,num-classes] representing the
*over the number of classes.
*The tensor has a dimension 1 which desccribes the number of batches(examples)*/

    const predLabel = probs.argMax(1);

//prob.argmax function returns the class with highest probabilty
//we pass one as the argument beacuse we compute the probabilty for num_classes

    await moveSlider(predLabel);

//this slider will increase and decrease the value of the slide according to the labels

    tf.dispose([input, probs, predLabel]);
  }, {
    overlapFactor: 0.999,
    includeSpectrogram: true,
    invokeCallbackOnNoiseAndUnknown: true
  });
 }

    
     