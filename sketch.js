var mic, node;          // audio objects

var FS = 44100;         // sampling rate
var FFTSIZE = 256;      // FFT size - 256 minimo
var HOPSIZE = 256;      // FFT hop size (todo: overlap)

var fft;                // p5.fun objects

var sig = new Array(FFTSIZE); // collector signal (input)

var topten = [];        // mayor amplitud

var moving = [];        // promedios
var moving2 = [];

var fixedFreqs = [1, 3, 5, 7, 9];
var fixedNames = ['120Hz', '400Hz', '770Hz', '1180Hz', '-'];
var emptyArray = ['', '', '', '', ''];
var realFreqs = [0, 0, 0, 0, 0];

/* Sizes */
var xBars;
var yBars;
var wBars;
var hBars;
var xmBars;
var ymBars;

var xGraph;
var yGraph;
var wGraph;
var hGraph;

var xTooltip;
var yTooltip;
var wTooltip;
var hTooltip;

var scaleX = 1.3;
var scaleY = 0.25;

/* Canvas */
var graphCommon;
var graphTop;

/* Promedios panel azul */
var lastAcc = [0, 0, 0, 0, 0];
var lastTime = 0;
var lastSamples = 0;
var lastFreqs = ["Hz", "Hz", "Hz", "Hz", "Hz"];

/* Congelar gráfica, sumar gráficas */
var drawCommon = true;
var drawTop = true;
var drawSumasCommon = false;
var drawSumasTop = false;

/* Elementos DOM */
var buttonRefs = [[], [], [], []];
var linkRef;

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  graphCommon = createGraphics(width*0.27, height*0.9+12);
  graphTop = createGraphics(width*0.27, height*0.9+12);

  xBars = width*0.03;
  yBars = height*0.05;
  wBars = width*0.34;
  hBars = height*0.35;
  xmBars = xBars + wBars;
  ymBars = yBars + hBars;

  xTooltip = width*0.03;
  yTooltip = height*0.77;
  wTooltip = width*0.34;
  hTooltip = height*0.19;

  background(255);
  reTag();
  fill(240);
  rect(xTooltip, yTooltip, wTooltip, hTooltip);

  for (i = 0; i < 4; i++) {
    for (j = 0; j < buttonRefs[i].length; j++) {
      btn = buttonRefs[i][j];
      btn.position(width*(0.03+i*0.09), height*(0.51+j*0.06));
      btn.style('width', width*0.07 + 'px');
      btn.style('height', height*0.05 + 'px');
    }
  }

  // descongelar gráficas cuando se redimensione para evitar problemas de dibujo
  unfreezeCommon();
  unfreezeTop();
}

function setup() {
  /* UI */
  var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  createCanvas(w, h);
  background(255);
  fill(0);
  textSize(18);

  graphCommon = createGraphics(w*0.27, height*0.9+12);
  graphTop = createGraphics(w*0.27, height*0.9+12);

  xBars = width*0.03;
  yBars = height*0.05;
  wBars = width*0.34;
  hBars = height*0.35;
  xmBars = xBars + wBars;
  ymBars = yBars + hBars;

  xTooltip = width*0.03;
  yTooltip = height*0.77;
  wTooltip = width*0.34;
  hTooltip = height*0.19;

  /* tone.js, capturar audio */
  mic = new Tone.UserMedia();
  mic.open();

  /* p5.func, FFT */
  fft = new p5.FastFourierTransform(FFTSIZE, FS, HOPSIZE);
  fft.doFrequency = true;

  /* Capturar audio y enviar a FFT */
  node = Tone.context.createScriptProcessor(FFTSIZE, 1, 1);
  node.onaudioprocess = function (e) {
    sig = e.inputBuffer.getChannelData(0);
    fft.forward(sig);
  };
  Tone.context.resume();
  Tone.connect(node, Tone.context.destination, [inputNum=0], [outputNum=0]);
  Tone.connect(mic, node, [inputNum=0], [outputNum=0]);

  /* Otras inicializaciones */
  angleMode(DEGREES);
  lastTime = millis();

  buttonFirstNames = ['INICIO MANUAL (CHROME)'];
  buttonFirstFuncs = [ manualStart ];
  buttonFirstTooltip = [  
                          'Un analizador de espectro permite visualizar las frecuencias que forman una señal, en este caso de audio. Utilizando la transformada de Fourier es posible descomponer la señal para obtener las frecuencias con mayor amplitud que la conforman.\nSi se está usando el navegador Chrome, presionar este botón para empezar a graficar.'
                       ];
  buttonFirstLink = [
                      'https://www.youtube.com/watch?v=spUNpyF58BY'
                    ];
  buttonFirstLinkTitle =  [
                            'Fast Fourier transform'
                          ];

  buttonSecondNames = ['Default', 'Bajos', 'Medios', 'Altos'];
  buttonSecondFuncs = [ freqsDefault, freqsBass, freqsMid, freqsTrebble ];
  buttonSecondTooltip = [
                          'Graficar frecuencias predefinidas en el panel rojo. En las distintas gráficas se puede apreciar la diferencia entre las ocurrencias por unidad de tiempo.',
                          'Frecuencias bajas, graves al oído. La frecuencia más baja perceptible al oído humano es de 20Hz. La voz humana usualmente está en este rango.',
                          'Frecuencias medias. Una voz entrenada para cantar puede generar frecuencias variadas en este rango.',
                          'Frecuencias altas, agudas al oído. El oído humano perfecto puede escuchar hasta 20KHz, pero para la mayoría de personas el límite es de 15KHz. A partir de 10KHz el sonido se vuelve desagradable, en música se suele usar 4 o 5KHz como máximo, y silbando puedes generar una frecuencia entre 2 y 3KHz.'
                        ];
  buttonSecondLink =  [
                        'https://en.wikipedia.org/wiki/Frequency',
                        'https://en.wikipedia.org/wiki/Bass_(sound)',
                        '',
                        'https://en.wikipedia.org/wiki/Treble_(sound)'
                      ];
  buttonSecondLinkTitle = [
                            'Frequency',
                            'Bass',
                            '',
                            'Treble'
                          ];

  buttonThirdNames = ['Tiempo: zoom in', 'Tiempo: zoom out', 'Amplitud: zoom in', 'Amplitud: zoom out'];
  buttonThirdFuncs = [ timeZoomIn, timeZoomOut, ampZoomIn, ampZoomOut ];
  buttonThirdTooltip = [
                          'Acercamiento en el eje horizontal. Se visualizarán menos repeticiones de la señal en la gráfica.\nSi la frecuencia es de 100Hz se verán diez ocurrencias en un periodo de 10ms. Si es de 1000Hz se verán cien ocurrencias.',
                          'Alejamiento en el eje horizontal. Se visualizarán más repeticiones de la señal en la gráfica.\nSi la frecuencia es de 100Hz se verán diez ocurrencias en un periodo de 10ms. Si es de 1000Hz se verán cien ocurrencias.',
                          'Acercamiento en el eje vertical. Se podrá visualizar mejor una señal con baja amplitud, es decir, bajo volumen.',
                          'Alejamiento en el eje vertical. Se podrá visualizar mejor una señal con mayor amplitud, des decir, alto volumen.'
                       ];
  buttonThirdLink = [
                      'https://en.wikipedia.org/wiki/Hertz',
                      'https://en.wikipedia.org/wiki/Hertz',
                      'https://en.wikipedia.org/wiki/Amplitude',
                      'https://en.wikipedia.org/wiki/Amplitude'
                    ];
  buttonThirdLinkTitle =  [
                            'Hertz',
                            'Hertz',
                            'Amplitude',
                            'Amplitude'
                          ];

  buttonFourthNames = ['Congelar panel rojo', 'Congelar panel azul', 'Superponer panel rojo', 'Superponer panel azul' ];
  buttonFourthFuncs = [ freezeCommon, freezeTop, toggleSumCommon, toggleSumTop ];
  buttonFourthTooltip = [
                            'Congelar o descongelar gráficas de frecuencias comunes.',
                            'Congelar o descongelar gráficas de frecuencias con mayor amplitud.',
                            'Superposición de las tres primeras frecuencias del panel rojo. Se suman las amplitudes en cada punto para obtener una nueva señal.',
                            'Superposición de las tres primeras frecuencias del panel azul. Se están sumando tres de las señales que más aportan a nuestra señal original.'
                        ];
  buttonFourthLink =  [
                        '',
                        '',
                        'https://www.acs.psu.edu/drussell/Demos/superposition/superposition.html',
                        'https://www.acs.psu.edu/drussell/Demos/superposition/superposition.html'
                      ];
  buttonFourthLinkTitle = [
                            '',
                            '',
                            'Superposition',
                            'Superposition'
                          ];

  for (i = 0; i < buttonFirstNames.length; i++) {
    button = createButton(buttonFirstNames[i]);
    button.position(width*0.03, height*(0.51+i*0.06));
    button.mousePressed(buttonFirstFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.07 + 'px');
    button.style('height', height*0.05 + 'px');
    button.mouseOver(function() {
      strokeWeight(0);
      fill(255);
      rect(xTooltip, yTooltip, wTooltip, hTooltip*1.5);
      strokeWeight(1);
      fill(240);
      rect(xTooltip, yTooltip, wTooltip, hTooltip);

      strokeWeight(0);
      fill(0);
      textSize(18);
      text(buttonFirstTooltip[this.elt.value], xTooltip+5, yTooltip+15, wTooltip, hTooltip);

      linkRef.remove();
      if (buttonFirstLink[this.elt.value] != '') {
        linkRef = createA(buttonFirstLink[this.elt.value], 'Conoce más >> ' + buttonFirstLinkTitle[this.elt.value], '_blank');
        linkRef.position(width*0.05, height*0.93);
        linkRef.style('font-size', '18px');
        linkRef.style('font-family', 'Arial');
      }
    });

    buttonRefs[0].push(button);
  }
  
  for (i = 0; i < buttonSecondNames.length; i++) {
    button = createButton(buttonSecondNames[i]);
    button.position(width*0.12, height*(0.51+i*0.06));
    button.mousePressed(buttonSecondFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.07 + 'px');
    button.style('height', height*0.05 + 'px');
    button.mouseOver(function() {
      strokeWeight(0);
      fill(255);
      rect(xTooltip, yTooltip, wTooltip, hTooltip*1.5);
      strokeWeight(1);
      fill(240);
      rect(xTooltip, yTooltip, wTooltip, hTooltip);

      strokeWeight(0);
      fill(0);
      textSize(18);
      text(buttonSecondTooltip[this.elt.value], xTooltip+5, yTooltip+15, wTooltip, hTooltip);

      linkRef.remove();
      if (buttonSecondLink[this.elt.value] != '') {
        linkRef = createA(buttonSecondLink[this.elt.value], 'Conoce más >> ' + buttonSecondLinkTitle[this.elt.value], '_blank');
        linkRef.position(width*0.05, height*0.93);
        linkRef.style('font-size', '18px');
        linkRef.style('font-family', 'Arial');
      }
    });

    buttonRefs[1].push(button);
  }

  for (i = 0; i < buttonThirdNames.length; i++) {
    button = createButton(buttonThirdNames[i]);
    button.position(width*0.21, height*(0.51+i*0.06));
    button.mousePressed(buttonThirdFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.07 + 'px');
    button.style('height', height*0.05 + 'px');
    button.mouseOver(function() {
      strokeWeight(0);
      fill(255);
      rect(xTooltip, yTooltip, wTooltip, hTooltip*1.5);
      strokeWeight(1);
      fill(240);
      rect(xTooltip, yTooltip, wTooltip, hTooltip);

      strokeWeight(0);
      fill(0);
      textSize(18);
      text(buttonThirdTooltip[this.elt.value], xTooltip+5, yTooltip+15, wTooltip, hTooltip);

      linkRef.remove();
      if (buttonThirdLink[this.elt.value] != '') {
        linkRef = createA(buttonThirdLink[this.elt.value], 'Conoce más >> ' + buttonThirdLinkTitle[this.elt.value], '_blank');
        linkRef.position(width*0.05, height*0.93);
        linkRef.style('font-size', '18px');
        linkRef.style('font-family', 'Arial');
      }
    });

    buttonRefs[2].push(button);
  }

  for (i = 0; i < buttonFourthNames.length; i++) {
    button = createButton(buttonFourthNames[i]);
    button.position(width*0.30, height*(0.51+i*0.06));
    button.mousePressed(buttonFourthFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.07 + 'px');
    button.style('height', height*0.05 + 'px');
    button.mouseOver(function() {
      strokeWeight(0);
      fill(255);
      rect(xTooltip, yTooltip, wTooltip, hTooltip*1.5);
      strokeWeight(1);
      fill(240);
      rect(xTooltip, yTooltip, wTooltip, hTooltip);

      strokeWeight(0);
      fill(0);
      textSize(18);
      text(buttonFourthTooltip[this.elt.value], xTooltip+5, yTooltip+15, wTooltip, hTooltip);

      linkRef.remove();
      if (buttonFourthLink[this.elt.value] != '') {
        linkRef = createA(buttonFourthLink[this.elt.value], 'Conoce más >> ' + buttonFourthLinkTitle[this.elt.value], '_blank');
        linkRef.position(width*0.05, height*0.93);
        linkRef.style('font-size', '18px');
        linkRef.style('font-family', 'Arial');
      }
    });

    buttonRefs[3].push(button);
  }

  reTag();

  fill(240);
  rect(xTooltip, yTooltip, wTooltip, hTooltip);

  strokeWeight(0);
  fill(0);
  textSize(18);
  text('Un analizador de espectro permite visualizar las frecuencias que forman una señal, en este caso de audio. Utilizando la transformada de Fourier es posible descomponer la señal para obtener las frecuencias con mayor amplitud que la conforman.', xTooltip+5, yTooltip+15, wTooltip, hTooltip);

  linkRef = createA('https://www.youtube.com/watch?v=spUNpyF58BY', 'Conoce más >> Fast Fourier transform', '_blank');
  linkRef.position(width*0.05, height*0.93);
  linkRef.style('font-size', '18px');
  linkRef.style('font-family', 'Arial');
}



function reTag() {
  tag = createGraphics(wBars, height*0.08);
  //tag.background(200,255,200);
  tag.background(255);
  tag.rotate(PI*3/2);
  tag.translate(-5, 18);

  for (i = 0; i < 4; i++) {
    tag.textSize(18);
    tag.textAlign(RIGHT);
    tag.stroke('black');
    tag.strokeWeight(0);
    tag.fill(0);
    tag.text(fixedNames[i], 0, wBars/32*fixedFreqs[i]);
  }

  image(tag, xBars, hBars+0.06*height);
}



function toggleSumCommon () {
  drawSumasCommon = !drawSumasCommon;
}

function toggleSumTop () {
  drawSumasTop = !drawSumasTop;
}

function freezeCommon () {
  drawCommon = !drawCommon;
  printRealCommon();
}

function unfreezeCommon () {
  drawCommon = true;
}

function freezeTop () {
  drawTop = !drawTop;
}

function unfreezeTop () {
  drawTop = true;
}

function manualStart () {
  Tone.context.resume();
}

function ampZoomIn () {
  scaleY = constrain(scaleY+0.05, 0.15, 0.6);
}

function ampZoomOut () {
  scaleY = constrain(scaleY-0.05, 0.15, 0.6);
}

function timeZoomIn () {
  scaleX = constrain(scaleX+0.05, 0.5, 2.5);
}

function timeZoomOut () {
  scaleX = constrain(scaleX-0.05, 0.5, 2.5);
}

/*
function freqsGuitar() {
  alert("FFT no es apto para guitarra, la mayoría de cuerdas no se pueden visualizar debido a que sus frecuencias son bajas. Las frecuencias que se muestran se parecen demasiado a Bajos. Algunas frecuencias (F5, A5) serán muy incómodas de tocar a menos que la guitarra sea eléctrica por el traste que se usa.");

  fixedFreqs = [1, 2, 3, 4, 5];
  fixedNames = ['D3 (Cuerda 3 al aire)', 'E4 (Cuerda 6 al aire)', 'C5 (Cuerda 6, traste 8)', 'F5 (Cuerda 6, traste 13)', 'A5 (Cuerda 6, traste 17)'];
  reTag();
}
*/

function freqsBass() {
  fixedFreqs = [0, 1, 2, 3, 4];
  //fixedNames = ['16Hz', '180Hz', '340Hz', '520Hz', '680Hz'];
  fixedNames = ['~0Hz', '120Hz', '340Hz', '400Hz', '680Hz'];
  graphCommon.background(255,255,100);
  if (drawCommon) {
    image(graphCommon, width*0.4, yBars);
  }
  reTag();
}

function freqsMid() {
  fixedFreqs = [5, 7, 9, 11, 13];
  fixedNames = ['770Hz', '1180Hz', '1550Hz', '1900Hz', '2200Hz'];
  reTag();
}

function freqsTrebble() {
  fixedFreqs = [14, 16, 18, 20, 22];
  fixedNames = ['2400Hz', '2750Hz', '3000Hz', '3300Hz', '3800Hz'];
  reTag();
}

function freqsDefault() {
  fixedFreqs = [1, 3, 5, 7, 9];
  //fixedNames = ['180Hz', '520Hz', '860Hz', '1200Hz', '1550Hz'];
  fixedNames = ['120Hz', '400Hz', '770Hz', '1180Hz', '-'];
  reTag();
}







/*
function freqsOctave5() {
  fixedFreqs = [2, 3, 4, 5, 6];
  fixedNames = ['F4 349Hz', 'C5 523Hz', 'F5 698Hz', 'A5 880Hz', 'C6 1046Hz'];
  reTag();
}

function freqsOctave6() {
  fixedFreqs = [6, 8, 9, 10, 12];
  fixedNames = ['C6 1046Hz', 'F6 1396Hz', 'G6 1567Hz', 'A6 1760Hz', 'C7 2093Hz'];
  reTag();
}
*/





function draw() {
  //background(255);

  stroke('black');
  strokeWeight(1);
  fill(240);
  rect(xBars, yBars, wBars, hBars);

  small = fft.magnitude.slice(0,32);
  spectsort = new Array(small.length);
  for (var i = 0; i < spectsort.length; i++) {
    var p = new Array();
    p[0] = small[i].toFixed(6);   // magnitud
    p[1] = i;                     // indice en el original
    spectsort[i] = p;
  }

  spectsort.sort();
  spectsort.reverse();

  topten = new Array(4);

  for (var i=0; i<4; i++) {
    var tt = {};
    tt.magnitude = sqrt(spectsort[i][0]);
    tt.index = spectsort[i][1];
    
    tt.runningphase = fft.runningphase[tt.index];
    tt.frequency = fft.frequency[tt.index];
    topten[i] = tt;
  }

  topten.sort(function(x,y) {return x.frequency-y.frequency});

  stroke(0);
  for(var i in small) {
    // mas separado visualmente
    //var xlog = sqrt(map(i, 0, fft.magnitude.length-1, 0., 1.));
    var xlog = map(i, 0, small.length, 0.,1.);
    var xs = map(xlog, 0, 1, xBars, xmBars);

    // 0,0.7 -> 0,0.5
    //var ys = map(sqrt(fft.magnitude[i]), 0, sqrt(0.5), height*0.9, height*0.2);
    var ys = constrain( map(sqrt(small[i]), 0, 0.5, ymBars, yBars), yBars, ymBars);
    
    // color para las barras de mayor amplitud
    if (i == topten[0].index) {
      fill(255,0,0);
    } else if (i == topten[1].index) {
      fill(255,125,0);
    } else if (i == topten[2].index) {
      fill(255,255,0);
    } else if (i == topten[3].index) {
      fill(200,255,0);
    } else {
      fill(200);
    }

    // dibujar barras
    rect(xs, ys, wBars/32, ymBars-ys);
  }

  if (drawCommon) {
    drawGraphCommon();
    image(graphCommon, width*0.4, yBars);
  }

  if (drawTop) {
    drawGraphTop();
    image(graphTop, width*0.7, yBars);
  }
}




function drawGraphCommon () {
  graphCommon.background(255,100,100);

  for (var i = 0; i < 3; i++) {
    graphCommon.fill(240);
    graphCommon.stroke('black');
    graphCommon.strokeWeight(1);
    graphCommon.rect(5, i*height*0.23+5, width*0.27-12, height*0.21);

    realFreqs[i] = fft.frequency[ fixedFreqs[i] ];

    drawSine( graphCommon,
              fft.frequency[ fixedFreqs[i] ],
              sqrt( fft.magnitude[ fixedFreqs[i] ] ) * 10,
              fft.runningphase[ fixedFreqs[i] ] * 57.2958,
              'red',
              5,
              i*height*0.23+5,
              width*0.27-12,
              height*0.21,
              fixedNames[i]
            );
  }

  if (drawSumasCommon) {
    drawMultiSine(  graphCommon,
                  [
                    fft.frequency[ fixedFreqs[0] ],
                    fft.frequency[ fixedFreqs[1] ],
                    fft.frequency[ fixedFreqs[2] ]
                  ],
                  [
                    sqrt( fft.magnitude[ fixedFreqs[0] ] ) * 10,
                    sqrt( fft.magnitude[ fixedFreqs[1] ] ) * 10,
                    sqrt( fft.magnitude[ fixedFreqs[2] ] ) * 10
                  ],
                  [
                    fft.runningphase[ fixedFreqs[0] ] * 57.2958,
                    fft.runningphase[ fixedFreqs[1] ] * 57.2958,
                    fft.runningphase[ fixedFreqs[2] ] * 57.2958
                  ],
                  'green',
                  5,
                  height*0.23*3+5,
                  width*0.27-12,
                  height*0.21,
                  fixedNames[1] + ' + ' + fixedNames[2] + ' + ' + fixedNames[3]
                );
  } else {
    graphCommon.fill(240);
    graphCommon.stroke('black');
    graphCommon.strokeWeight(1);
    graphCommon.rect(5, 3*height*0.23+5, width*0.27-12, height*0.21);

    realFreqs[i] = fft.frequency[ fixedFreqs[3] ];

    drawSine( graphCommon,
              fft.frequency[ fixedFreqs[3] ],
              sqrt( fft.magnitude[ fixedFreqs[3] ] ) * 10,
              fft.runningphase[ fixedFreqs[3] ] * 57.2958,
              'red',
              5,
              3*height*0.23+5,
              width*0.27-12,
              height*0.21,
              fixedNames[i]
            );
  }
}

function printRealCommon () {
  graphCommon.stroke('black');
  graphCommon.textFont('Arial');
  graphCommon.fill(0);

  graphCommon.textSize(16);
  graphCommon.strokeWeight(0);

  for (var i = 0; i < 3; i++) {
    graphCommon.text("Real: " + Math.abs(realFreqs[i].toFixed(1)) + "Hz", 180, i*height*0.23+25);
  }

  if (!drawSumasCommon) {
    graphCommon.text("Real: " + realFreqs[3].toFixed(1) + "Hz", 180, 3*height*0.23+25);
  }

  image(graphCommon, width*0.4, height*0.05);
}

function drawGraphTop () {
  graphTop.background(100,100,255);

  if (millis() - 200 > lastTime) {
    // calcular promedios, limpiar
    for (var i = 0; i < 4; i++) {
      lastFreqs[i] = (lastAcc[i] / lastSamples).toFixed(1) + "Hz";
      lastAcc[i] = 0;
    }

    // limpiar
    lastSamples = 0;
    lastTime = millis();
  } else {
    // acumular
    for (var i = 0; i < 4; i++) {
      lastAcc[i] += topten[i].frequency;
    }
    // contar un frame
    lastSamples++;
  }

  for (var i = 0; i < 3; i++) {
    graphTop.fill(240);
    graphTop.stroke('black');
    graphTop.strokeWeight(1);
    graphTop.rect(5, i*height*0.23+5, width*0.27-12, height*0.21);

    drawSine( graphTop,
              topten[i].frequency,
              topten[i].magnitude * 10,
              topten[i].runningphase * 57.2958,
              'blue',
              5,
              i*height*0.23+5,
              width*0.27-12,
              height*0.21,
              lastFreqs[i]
            );
  }

  if (drawSumasTop) {
    drawMultiSine(  graphTop,
                  [
                    topten[0].frequency,
                    topten[1].frequency,
                    topten[2].frequency
                  ],
                  [
                    topten[0].magnitude * 10,
                    topten[1].magnitude * 10,
                    topten[2].magnitude * 10
                  ],
                  [
                    topten[0].runningphase * 57.2958,
                    topten[1].runningphase * 57.2958,
                    topten[2].runningphase * 57.2958
                  ],
                  'green',
                  5,
                  height*0.23*3+5,
                  width*0.27-12,
                  height*0.21,
                  lastFreqs[0] + ' + ' + lastFreqs[1] + ' + ' + lastFreqs[2]
                );
  } else {
    graphTop.fill(240);
    graphTop.stroke('black');
    graphTop.strokeWeight(1);
    graphTop.rect(5, 3*height*0.23+5, width*0.27-12, height*0.21);

    drawSine( graphTop,
              topten[3].frequency,
              topten[3].magnitude * 10,
              topten[3].runningphase * 57.2958,
              'blue',
              5,
              3*height*0.23+5,
              width*0.27-12,
              height*0.21,
              lastFreqs[3]
            );
  }
}

function drawSine (canvas, freq, mag, phase, color, x, y, w, h, name) {
  var ma = h/2;               // max amplitude
  var sa = ma * scaleY;       // scaled max amplitude
  var sm = sa * mag;          // scaled magnitude
  var yma = y + ma;           // centro, y base + max amplitude
  var sf = freq/scaleX;       // scaled frequency
  var sf100 = sf/100;         // scaled frequency adaptado al tamano de grafica

  canvas.stroke('black');
  canvas.textFont('Arial');
  canvas.fill(0);

  canvas.textSize(16);
  canvas.strokeWeight(0);
  canvas.text(name, 100, y+20);
  

  canvas.strokeWeight(1);
  canvas.line(5, yma, w+5, yma);

  dbText = [' ', '-18 dB', '-12 dB', ' -6 dB', '  0 dB', '  6dB', ' '];

  canvas.textSize(10);
  for (var i = 1; (160*scaleY*i) < ma; i++) {
    canvas.strokeWeight(0);
    canvas.text(dbText[i], 17, yma - 160*scaleY*i + 4);

    canvas.strokeWeight(1);
    canvas.line(5, yma + 160*scaleY*i, 15, yma + 160*scaleY*i);
    canvas.line(5, yma - 160*scaleY*i, 15, yma - 160*scaleY*i);
  }

  canvas.textSize(12);
  for (var i = 0; (i*scaleX*180) < w; i++) {
    canvas.strokeWeight(0);
    canvas.text(i*5 + ' ms', 180*i*scaleX+7, yma+15);

    canvas.strokeWeight(1);
    canvas.line(180*i*scaleX+5, yma-8, 180*i*scaleX+5, yma+8);
  }

  canvas.stroke(color);
  canvas.noFill();
  canvas.strokeWeight(1);

  canvas.beginShape();
  for (var i = 0; i < w; i++) {  
    var yp = sm * sin(i * sf100 + phase);
    canvas.vertex(x + i, yma - constrain(yp, -ma, ma));
  }
  canvas.endShape();
}




function drawMultiSine (canvas, freq, mag, phase, color, x, y, w, h, name) {
  var ma = h/2;               // max amplitude
  var sa = ma * scaleY;       // scaled max amplitude
  var yma = y + ma;           // centro, y base + max amplitude

  canvas.fill(240);
  canvas.stroke('black');
  canvas.strokeWeight(1);
  canvas.rect(5, height*0.23*3+5, width*0.27-12, height*0.21);

  canvas.stroke('black');
  canvas.textFont('Arial');
  canvas.fill(0);

  canvas.textSize(16);
  canvas.strokeWeight(0);
  canvas.text(name, 10, y+20);
  canvas.textSize(12);

  canvas.strokeWeight(1);
  canvas.line(5, y+ma, w+5, y+ma);
  canvas.line(5, y+ma + 40*scaleY, 15, y+ma + 40*scaleY);
  canvas.line(5, y+ma - 40*scaleY, 15, y+ma - 40*scaleY);

  for (var i = 0; (i*scaleX*180) < w; i++) {
    canvas.strokeWeight(0);
    canvas.text(i*5 + ' ms', 180*i*scaleX+7, y+ma+15);

    canvas.strokeWeight(1);
    canvas.line(180*i*scaleX+5, y+ma-8, 180*i*scaleX+5, y+ma+8);
  }

  canvas.stroke(color);
  canvas.noFill();
  canvas.strokeWeight(2);

  var res = new Array(Math.ceil(w)).fill(0);

  for (var s = 0; s < freq.length; s++) {
    var sm = sa * mag[s];
    var sf = freq[s]/scaleX;
    var sf100 = sf/100;
    var fase = phase[s];

    for (var i = 0; i < w; i++) {
      var yp = sm * sin(i * sf100 + fase);
      res[i] = res[i] + yp;
    }
  }

  canvas.beginShape();
  for (var i = 0; i < w; i++) {  
    canvas.vertex(x + i, yma - constrain(res[i], -ma, ma));
  }
  canvas.endShape();  
}