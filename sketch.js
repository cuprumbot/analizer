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
var xBars, yBars, wBars, hBars, xmBars, ymBars;
var xGraph, yGraph, wGraph, hGraph;
var xTooltip, yTooltip, wTooltip, hTooltip;
var sinSpacer, sinSize;
var margin = 10;
var negMargin = margin*2+2;

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

var tooltipTB, linkTB, zoomBP, zoomTB1, zoomTB2, redBP, blueBP, titleTB0, titleTB1, titleTB2;

var backColor = 200;
var panelColor = '#bbb';
var sinBackColor = 20;
var sinTextColor;

function sizes() {
  sinTextColor = color(50,200,50);

  graphCommon = createGraphics(width*0.27, height*0.79+12);
  graphTop = createGraphics(width*0.27, height*0.79+12);

  xBars = width*0.1;
  yBars = height*0.08;
  wBars = width*0.27;
  hBars = height*0.60;
  xmBars = xBars + wBars;
  ymBars = yBars + hBars;

  xTooltip = width*0.03;
  yTooltip = height*0.77;
  wTooltip = width*0.34;
  hTooltip = height*0.19;

  sinSpacer = height*0.183;
  sinSize = height*0.171;

  hButton = height*0.04;
  hPanel = height*0.06;

  textMid = height/47;
  textBig = height/36;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  sizes();
  clear();
  reTag();

  for (i = 0; i < buttonFirstNames.length; i++) {
    button = buttonRefs[0][i]
    button.position(width*0.03, height*0.7);
    button.style('width', width*0.07 + 'px');
    button.style('height', height*0.05 + 'px');
  }

  for (i = 0; i < buttonSecondNames.length; i++) {
    button = buttonRefs[1][i]
    button.position(width*(0.12+i*0.065), height*0.7);
    button.style('width', width*0.055 + 'px');
    button.style('height', height*0.05 + 'px');
  }

  var pos3 = [width*0.43, width*0.58, width*0.73, width*0.88];
  for (i = 0; i < buttonRefs[2].length; i++) {
    button = buttonRefs[2][i];
    button.position(pos3[i], height*0.91);
    button.style('width', width*0.06 + 'px');
    button.style('height', hButton + 'px');
  }

  var pos4 = [width*0.42, width*0.54, width*0.72, width*0.84];
  for (i = 0; i < buttonRefs[3].length; i++) {
    button = buttonRefs[3][i];
    button.position(pos4[i], height*0.83);
    button.style('width', width*0.11 + 'px');
    button.style('height', hButton + 'px');
  }

  UI();

  // descongelar gráficas cuando se redimensione para evitar problemas de dibujo
  unfreezeCommon();
  unfreezeTop();
}

function UI() {
  /* DOM */
  back.style("background-color", "#aaa");
  back.position(width*0.015, height*0.015);
  back.size(width*0.97, height*0.97);
  back.style("z-index", "-1");

  leg1.style("background-color", "#115");
  leg1.position(width*0.1, height*0.985);
  leg1.size(width*0.05, height*0.015);

  leg2.style("background-color", "#115");
  leg2.position(width*0.85, height*0.985);
  leg2.size(width*0.05, height*0.015);

  zoomBP.style("background-color", panelColor);
  zoomBP.position(width*0.4, height*0.91);
  zoomBP.size(width*0.57, hPanel);

  zoomBP.style("background-color", panelColor);
  zoomBP.position(width*0.4, height*0.91);
  zoomBP.size(width*0.57, hPanel);

  tooltipTB.style("font-family", "Courier");
  tooltipTB.style("font-size", textMid + "px");
  tooltipTB.style("white-space", "pre-wrap");
  tooltipTB.style("background-color", "#444");
  tooltipTB.style("overflow-y", "auto")
  tooltipTB.style("color", "white");
  tooltipTB.style("padding", "4px");
  tooltipTB.position(xTooltip, yTooltip);
  tooltipTB.size(wTooltip-8, hTooltip*0.8-8);

  linkTB.style("font-family", "Courier");
  linkTB.style("font-size", textMid + "px");
  linkTB.style("white-space", "pre-wrap");
  linkTB.style("background-color", "#666");
  linkTB.style("overflow-y", "auto")
  linkTB.style("color", "#ccf")
  linkTB.style("padding-left", "4px")
  linkTB.position(xTooltip, yTooltip+hTooltip*0.8);
  linkTB.size(wTooltip-4, hTooltip*0.2);

  zoomBP.style("background-color", panelColor);
  zoomBP.position(width*0.4, height*0.90);
  zoomBP.size(width*0.57, hPanel);

/*
  redBP.style("background-color", panelColor);
  redBP.position(width*0.41, height*0.82);
  redBP.size(width*0.25, hPanel);

  blueBP.style("background-color", panelColor);
  blueBP.position(width*0.71, height*0.82);
  blueBP.size(width*0.25, hPanel);
*/

  //zoomTB1.style("font-family", "Courier");
  zoomTB1.style("font-size", textMid + "px");
  zoomTB1.style("text-align", "center");
  zoomTB1.position(width*0.49, height*0.92);
  zoomTB1.size(width*0.09, hButton);
  zoomTB1.html("Zoom tiempo");

  //zoomTB2.style("font-family", "Courier");
  zoomTB2.style("font-size", textMid + "px");
  zoomTB2.style("text-align", "center");
  zoomTB2.position(width*0.79, height*0.92);
  zoomTB2.size(width*0.09, hButton);
  zoomTB2.html("Zoom amplitud");

  //titleTB0.style("font-family", "Courier");
  titleTB0.style("font-size", textBig + "px");
  titleTB0.style("text-align", "center");
  titleTB0.position(width*0.03, height*0.05);
  titleTB0.size(width*0.35, height*0.03);
  titleTB0.html("Todas las frecuencias");

  //titleTB1.style("font-family", "Courier");
  titleTB1.style("font-size", textBig + "px");
  titleTB1.style("text-align", "center");
  titleTB1.position(width*0.4, height*0.05);
  titleTB1.size(width*0.27, height*0.03);
  titleTB1.html("Frecuencias seleccionadas");

  //titleTB2.style("font-family", "Courier");
  titleTB2.style("font-size", textBig + "px");
  titleTB2.style("text-align", "center");
  titleTB2.position(width*0.7, height*0.05);
  titleTB2.size(width*0.27, height*0.03);
  titleTB2.html("Mayores amplitudes");
}

function setup() {
  /* UI */
  var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  createCanvas(w, h);
  //background(backColor);
  fill(0);
  textSize(18);

  sizes();

  /* DOM */
  back = createDiv('');
  leg1 = createDiv('');
  leg2 = createDiv('');
  tooltipTB = createDiv('');
  linkTB = createDiv('');
  zoomBP = createDiv('');
  zoomTB1 = createDiv('');
  zoomTB2 = createDiv('');
  redBP = createDiv('');
  blueBP = createDiv('');
  titleTB0 = createDiv('');
  titleTB1 = createDiv('');
  titleTB2 = createDiv('');
  UI();

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

  buttonFirstNames = ['INICIO'];
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

  buttonThirdNames = ['In', 'Out', 'In', 'Out'];
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

  buttonFourthNames = ['Congelar', 'Superponer', 'Congelar', 'Superponer'];
  buttonFourthFuncs = [ freezeCommon, toggleSumCommon, freezeTop, toggleSumTop ];
  buttonFourthTooltip = [
                            'Congelar o descongelar gráficas de frecuencias comunes.',
                            'Superposición de las tres primeras frecuencias del panel rojo. Se suman las amplitudes en cada punto para obtener una nueva señal.',
                            'Congelar o descongelar gráficas de frecuencias con mayor amplitud.',
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
    button.position(width*0.03, height*0.7);
    button.mousePressed(buttonFirstFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.07 + 'px');
    button.style('height', height*0.05 + 'px');
    button.mouseOver(function() {
      tooltipTB.html(buttonFirstTooltip[this.elt.value]);

      l = buttonFirstLink[this.elt.value];
      if (l != '') {
        h = '<a href="'+l+'">Conoce más >> '+buttonFirstLinkTitle[this.elt.value]+'</a>';
        linkTB.html(h)
      } else {
        linkTB.html("");
      }
    });

    buttonRefs[0].push(button);
  }
  
  for (i = 0; i < buttonSecondNames.length; i++) {
    button = createButton(buttonSecondNames[i]);
    button.position(width*(0.12+i*0.065), height*0.7);
    button.mousePressed(buttonSecondFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.055 + 'px');
    button.style('height', height*0.05 + 'px');
    button.mouseOver(function() {
      tooltipTB.html(buttonSecondTooltip[this.elt.value]);

      l = buttonSecondLink[this.elt.value];
      if (l != '') {
        h = '<a href="'+l+'">Conoce más >> '+buttonSecondLinkTitle[this.elt.value]+'</a>';
        linkTB.html(h)
      } else {
        linkTB.html("");
      }
    });

    buttonRefs[1].push(button);
  }

  var pos3 = [width*0.43, width*0.58, width*0.73, width*0.88];
  for (i = 0; i < buttonThirdNames.length; i++) {
    button = createButton(buttonThirdNames[i]);
    button.position(pos3[i], height*0.91);
    button.mousePressed(buttonThirdFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.06 + 'px');
    button.style('height', hButton + 'px');
    button.mouseOver(function() {
      tooltipTB.html(buttonThirdTooltip[this.elt.value]);

      l = buttonThirdLink[this.elt.value];
      if (l != '') {
        h = '<a href="'+l+'">Conoce más >> '+buttonThirdLinkTitle[this.elt.value]+'</a>';
        linkTB.html(h)
      } else {
        linkTB.html("");
      }
    });

    buttonRefs[2].push(button);
  }

  var pos4 = [width*0.42, width*0.54, width*0.72, width*0.84];
  for (i = 0; i < buttonFourthNames.length; i++) {
    button = createButton(buttonFourthNames[i]);
    button.position(pos4[i], height*0.83);
    button.mousePressed(buttonFourthFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.11 + 'px');
    button.style('height', hButton + 'px');
    button.mouseOver(function() {
      tooltipTB.html(buttonFourthTooltip[this.elt.value]);

      l = buttonFourthLink[this.elt.value];
      if (l != '') {
        h = '<a href="'+l+'">Conoce más >> '+buttonFourthLinkTitle[this.elt.value]+'</a>';
        linkTB.html(h)
      } else {
        linkTB.html("");
      }
    });

    buttonRefs[3].push(button);
  }

  reTag();
}



function reTag() {
  fill(0)
  strokeWeight(1);
  rect(width*0.03, yBars, width*0.09, hBars);
  textSize(hBars/32-1);
  textAlign(RIGHT);
  stroke('white');
  strokeWeight(0);
  fill(255);
  for (i = 0; i < 4; i++) {
    text(fixedNames[i], xBars-10, yBars+hBars/32*(fixedFreqs[i]+1));
  }
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

function freqsBass() {
  fixedFreqs = [0, 1, 2, 3, 4];
  //fixedNames = ['16Hz', '180Hz', '340Hz', '520Hz', '680Hz'];
  fixedNames = ['~0Hz', '120Hz', '340Hz', '400Hz', '680Hz'];
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
  stroke('black');
  strokeWeight(1);
  fill(sinBackColor);
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
    var yy = map(xlog, 0, 1, yBars, ymBars);

    // 0,0.7 -> 0,0.5
    //var ys = map(sqrt(fft.magnitude[i]), 0, sqrt(0.5), height*0.9, height*0.2);
    var ys = constrain( map(sqrt(small[i]), 0, 0.5, ymBars, yBars), yBars, ymBars);
    var ww = constrain( map(sqrt(small[i]), 0, 0.5, 0, wBars), 0, wBars);


    
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
      fill(225);
    }

    // dibujar barras
    //rect(xs, ys, wBars/32, ymBars-ys);
    rect(xBars, yy, ww, hBars/32);
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
  graphCommon.background(200,180,180);

  for (var i = 0; i < 3; i++) {
    graphCommon.fill(sinBackColor);
    graphCommon.stroke(sinBackColor);
    graphCommon.strokeWeight(1);
    graphCommon.rect(margin, i*sinSpacer+margin, width*0.27-negMargin, sinSize);

    realFreqs[i] = fft.frequency[ fixedFreqs[i] ];

    drawSine( graphCommon,
              fft.frequency[ fixedFreqs[i] ],
              sqrt( fft.magnitude[ fixedFreqs[i] ] ) * 10,
              fft.runningphase[ fixedFreqs[i] ] * 57.2958,
              'red',
              margin,
              i*sinSpacer+margin,
              width*0.27-negMargin,
              sinSize,
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
                  'white',
                  margin,
                  sinSpacer*3+margin,
                  width*0.27-negMargin,
                  sinSize,
                  fixedNames[0] + ' + ' + fixedNames[1] + ' + ' + fixedNames[2]
                );
  } else {
    graphCommon.fill(sinBackColor);
    graphCommon.stroke(sinBackColor);
    graphCommon.strokeWeight(1);
    graphCommon.rect(margin, 3*sinSpacer+margin, width*0.27-negMargin, sinSize);

    realFreqs[i] = fft.frequency[ fixedFreqs[3] ];

    drawSine( graphCommon,
              fft.frequency[ fixedFreqs[3] ],
              sqrt( fft.magnitude[ fixedFreqs[3] ] ) * 10,
              fft.runningphase[ fixedFreqs[3] ] * 57.2958,
              'red',
              margin,
              3*sinSpacer+margin,
              width*0.27-negMargin,
              sinSize,
              fixedNames[i]
            );
  }
}

function printRealCommon () {
  graphCommon.stroke(sinTextColor);
  graphCommon.textFont('Arial');
  graphCommon.fill(sinTextColor);

  graphCommon.textSize(16);
  graphCommon.strokeWeight(0);

  for (var i = 0; i < 3; i++) {
    graphCommon.text("Real: " + Math.abs(realFreqs[i].toFixed(1)) + "Hz", 180, i*sinSpacer+25);
  }

  if (!drawSumasCommon) {
    graphCommon.text("Real: " + realFreqs[3].toFixed(1) + "Hz", 180, 3*sinSpacer+25);
  }

  image(graphCommon, width*0.4, yBars);
}

function drawGraphTop () {
  graphTop.background(180,180,200);

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
    graphTop.fill(sinBackColor);
    graphTop.stroke(sinBackColor);
    graphTop.strokeWeight(1);
    graphTop.rect(margin, i*sinSpacer+margin, width*0.27-negMargin, sinSize);

    drawSine( graphTop,
              topten[i].frequency,
              topten[i].magnitude * 10,
              topten[i].runningphase * 57.2958,
              'blue',
              margin,
              i*sinSpacer+margin,
              width*0.27-negMargin,
              sinSize,
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
                  'white',
                  margin,
                  sinSpacer*3+margin,
                  width*0.27-negMargin,
                  sinSize,
                  lastFreqs[0] + ' + ' + lastFreqs[1] + ' + ' + lastFreqs[2]
                );
  } else {
    graphTop.fill(sinBackColor);
    graphTop.stroke(sinBackColor);
    graphTop.strokeWeight(1);
    graphTop.rect(margin, 3*sinSpacer+margin, width*0.27-negMargin, sinSize);

    drawSine( graphTop,
              topten[3].frequency,
              topten[3].magnitude * 10,
              topten[3].runningphase * 57.2958,
              'blue',
              margin,
              3*sinSpacer+margin,
              width*0.27-negMargin,
              sinSize,
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
  w = w-2;

  var scalex180 = scaleX * 180;

  canvas.stroke(sinTextColor);
  canvas.textFont('Arial');
  canvas.fill(sinTextColor);

  canvas.textSize(16);
  canvas.strokeWeight(0);
  canvas.text(name, 100, y+20);
  
  canvas.strokeWeight(1);
  canvas.line(margin, yma, w+margin, yma);

  dbText = [' ', '-18 dB', '-12 dB', ' -6 dB', '  0 dB', '  6dB', ' '];

  canvas.textSize(10);
  for (var i = 1; (160*scaleY*i) < (ma-1); i++) {
    canvas.strokeWeight(0);
    canvas.text(dbText[i], 17, yma - 160*scaleY*i + 4);

    canvas.strokeWeight(1);
    canvas.line(margin, yma + 160*scaleY*i, 15, yma + 160*scaleY*i);
    canvas.line(margin, yma - 160*scaleY*i, 15, yma - 160*scaleY*i);
  }

  canvas.textSize(12);
  for (var i = 0; (i*scaleX*180) < w; i++) {
    if (i*scaleX*180 < w-25) {
      canvas.strokeWeight(0);
      canvas.text(i*5 + ' ms', 180*i*scaleX+margin+2, yma+15);
    }
    canvas.strokeWeight(1);
    canvas.line(180*i*scaleX+margin, yma-8, 180*i*scaleX+margin, yma+8);
  }

  canvas.stroke(color);
  canvas.noFill();
  canvas.strokeWeight(2);

  canvas.beginShape();
  for (var i = 2; i < w; i++) {  
    var yp = sm * sin(i * sf100 + phase);
    canvas.vertex(x + i, yma - constrain(yp, -ma, ma));
  }
  canvas.endShape();
}




function drawMultiSine (canvas, freq, mag, phase, color, x, y, w, h, name) {
  var ma = h/2;               // max amplitude
  var sa = ma * scaleY;       // scaled max amplitude
  var yma = y + ma;           // centro, y base + max amplitude
  w = w-2;

  canvas.fill(sinBackColor);
  canvas.stroke(sinTextColor);
  canvas.strokeWeight(0);
  canvas.rect(margin, sinSpacer*3+margin, width*0.27-negMargin, sinSize);

  canvas.textFont('Arial');
  canvas.fill(sinTextColor);

  canvas.textSize(16);
  canvas.strokeWeight(0);
  canvas.text(name, 100, y+20);

  canvas.strokeWeight(1);
  canvas.line(margin, y+ma, w+margin, y+ma);

  dbText = [' ', '-18 dB', '-12 dB', ' -6 dB', '  0 dB', '  6dB', ' '];

  canvas.textSize(10);
  for (var i = 1; (160*scaleY*i) < ma; i++) {
    canvas.strokeWeight(0);
    canvas.text(dbText[i], 17, yma - 160*scaleY*i + 4);

    canvas.strokeWeight(1);
    canvas.line(margin, yma + 160*scaleY*i, 15, yma + 160*scaleY*i);
    canvas.line(margin, yma - 160*scaleY*i, 15, yma - 160*scaleY*i);
  }

  canvas.textSize(12);
  for (var i = 0; (i*scaleX*180) < w; i++) {
    canvas.strokeWeight(0);
    canvas.text(i*5 + ' ms', 180*i*scaleX+margin+2, y+ma+15);

    canvas.strokeWeight(1);
    canvas.line(180*i*scaleX+margin, y+ma-8, 180*i*scaleX+margin, y+ma+8);
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
  for (var i = 2; i < w; i++) {  
    canvas.vertex(x + i, yma - constrain(res[i], -ma, ma));
  }
  canvas.endShape();  
}