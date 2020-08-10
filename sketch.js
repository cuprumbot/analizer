var mic, node;          // audio objects

var FS = 44100;         // sampling rate
var FFTSIZE = 256;      // FFT size - 256 minimo
var HOPSIZE = 256;      // FFT hop size (todo: overlap)

var fft;                // p5.fun objects

var sig = new Array(FFTSIZE); // collector signal (input)

var tb, tl, avgTb;      // textboxes

var topten = [];        // mayor amplitud

var moving = [];        // promedios
var moving2 = [];

var timeCheckpoint;     // medir paso de un segundo

var fixedFreqs = [1, 3, 5, 7, 9];
var fixedNames = ['180Hz', '520Hz', '860Hz', '1200Hz', '1550Hz'];
var emptyArray = ['', '', '', '', ''];

/* Sizes */
var xBars;
var yBars;
var wBars;
var hBars;
var xmBars;
var ymBars;

var graphCommon;
var graphTop;

var xGraph;
var yGraph;
var wGraph;
var hGraph;

var xTooltip;
var yTooltip;
var wTooltip;
var hTooltip;

var scaleX = 1.0;
var scaleY = 1.0;

var prints = 1000;


function setup()
{
  /* UI */
  var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
  var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
  createCanvas(w, h);
  background(255);
  fill(0);
  textSize(18);

  graphCommon = createGraphics(w*0.27,2000);
  graphTop = createGraphics(w*0.27,2000);

  xBars = width*0.03;
  yBars = height*0.06;
  wBars = width*0.34;
  hBars = height*0.44;
  xmBars = xBars + wBars;
  ymBars = yBars + hBars;

  xTooltip = width*0.03;
  yTooltip = height*0.9;
  wTooltip = width*0.34;
  hTooltip = height*0.07;

  /* tone.js, capturar audio */
  mic = new Tone.UserMedia();
  mic.open();

  /* p5.func, FFT */
  fft = new p5.FastFourierTransform(FFTSIZE, FS, HOPSIZE);
  fft.doFrequency = true;

  /* UI */
  /*
  tb = createDiv('');
  tb.style("font-family", "Courier");
  tb.style("font-size", "20px");
  tb.style("white-space", "pre");
  tb.position(width*0.1, height*0.15);
  tb.size(500, 500);

  tl = createDiv('');
  tl.style("font-family", "Courier");
  tl.style("font-size", "12px");
  tl.style("align", "right");
  tl.position(width*0.91, height*0.2);
  tl.size(1,1);

  avgTb = createDiv('');
  avgTb.style("font-family", "Courier");
  avgTb.style("font-size", "14px");
  avgTb.style("align", "right");
  avgTb.position(width*0.7, height*0.55);
  avgTb.size(100, 100);
  */

  /* Capturar audio y enviar a FFT */
  node = Tone.context.createScriptProcessor(FFTSIZE, 1, 1);
  node.onaudioprocess = function (e) {
    //console.log(e);
    sig = e.inputBuffer.getChannelData(0);

/*
    if (prints-- > 0) {
      console.log(sig);
    }
*/

    fft.forward(sig);
  };
  Tone.context.resume();
  Tone.connect(node, Tone.context.destination, [inputNum=0], [outputNum=0]);
  Tone.connect(mic, node, [inputNum=0], [outputNum=0]);

  /* Otras inicializaciones */
  angleMode(DEGREES);
  timeCheckpoint = millis();

  buttonFirstNames = ['Default', 'INICIO MANUAL (CHROME)'];
  buttonFirstFuncs = [ freqsDefault, manualStart ];
  buttonFirstTooltip = [  
                          'Graficar frecuencias predefinidas. Varias frecuencias fáciles de distinguir entre sí.',
                          'Si se está usando el navegador Chrome, presionar este botón para iniciar a graficar.'
                       ];

  buttonSecondNames = ['Bajos', 'Medios', 'Altos', 'Octava 5', 'Octava 6'];
  buttonSecondFuncs = [ freqsBass, freqsMid, freqsTrebble, freqsOctave5, freqsOctave6 ];
  buttonSecondTooltip = [
                          'Frecuencias bajas, graves al oído.',
                          'Frecuencias medias.',
                          'Frecuencias altas, agudas al oído.',
                          'Algunas notas seleccionadas de la quinta octava usada en música.',
                          'Algunas notas seleccionadas de la sexta octava usada en música.'
                        ];

  buttonThirdNames = ['Tiempo: zoom in', 'Tiempo: zoom out', 'Amplitud: zoom in', 'Amplitud: zoom out'];
  buttonThirdFuncs = [ timeZoomIn, timeZoomOut, ampZoomIn, ampZoomOut ];
  buttonThirdTooltip = [
                          'Acercamiento en el eje horizontal. Se visualizarán menos periodos de la señal en la gráfica.',
                          'Alejamiento en el eje horizontal. Se visualizarán más periodos de la señal en la gráfica.',
                          'Acercamiento en el eje vertical. Se podrá visualizar mejor una señal con baja amplitud, es decir, bajo volumen.',
                          'Alejamiento en el eje vertical. Se podrá visualizar mejor una señal con mayor amplitud, des decir, alto volumen.'
                       ];

  for (i = 0; i < buttonFirstNames.length; i++) {
    button = createButton(buttonFirstNames[i]);
    button.position(width*0.03, height*(0.58+i*0.06));
    button.mousePressed(buttonFirstFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.08 +'px');
    button.style('height', '40px');
    button.mouseOver(function() {
      strokeWeight(1);
      fill(240);
      rect(xTooltip, yTooltip, wTooltip, hTooltip);

      strokeWeight(0);
      fill(0);
      textSize(18);
      text(buttonFirstTooltip[this.elt.value], xTooltip+5, yTooltip+15, wTooltip, hTooltip);
    });
  }
  
  for (i = 0; i < buttonSecondNames.length; i++) {
    button = createButton(buttonSecondNames[i]);
    button.position(width*0.13, height*(0.58+i*0.06));
    button.mousePressed(buttonSecondFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.08 + 'px');
    button.style('height', '40px');
    button.mouseOver(function() {
      strokeWeight(1);
      fill(240);
      rect(xTooltip, yTooltip, wTooltip, hTooltip);

      strokeWeight(0);
      fill(0);
      textSize(18);
      text(buttonSecondTooltip[this.elt.value], xTooltip+5, yTooltip+15, wTooltip, hTooltip);
    });
  }

  for (i = 0; i < buttonThirdNames.length; i++) {
    button = createButton(buttonThirdNames[i]);
    button.position(width*0.23, height*(0.58+i*0.06));
    button.mousePressed(buttonThirdFuncs[i]);
    button.value(i);
    button.style('display', 'inline-block');
    button.style('width', width*0.08 + 'px');
    button.style('height', '40px');
    button.mouseOver(function() {
      strokeWeight(1);
      fill(240);
      rect(xTooltip, yTooltip, wTooltip, hTooltip);

      strokeWeight(0);
      fill(0);
      textSize(18);
      console.log(buttonThirdTooltip[i]);
      text(buttonThirdTooltip[this.elt.value], xTooltip+5, yTooltip+15, wTooltip, hTooltip);
    });
  }

  reTag();

  fill(240);
  rect(xTooltip, yTooltip, wTooltip, hTooltip);

  strokeWeight(0);
  fill(0);
  textSize(18);
  text('Coloca el mouse sobre algún elemento para obtener más información.', xTooltip+5, yTooltip+15, wTooltip, hTooltip);
}

function reTag() {
  tag = createGraphics(wBars, 50);
  tag.background(200,255,200);
  tag.rotate(PI*3/2);
  tag.translate(-50, 15);

  for (i = 0; i < 4; i++) {
    tag.textSize(12);
    tag.stroke('black');
    tag.strokeWeight(0);
    tag.fill(0);
    tag.text(fixedNames[i], 0, wBars/32*fixedFreqs[i]);
  }

  image(tag, width*0.03, height*0.51);
}

function manualStart () {
  Tone.context.resume();
}

function ampZoomIn () {
  scaleY = constrain(scaleY+0.05, 0.5, 1.5);
}

function ampZoomOut () {
  scaleY = constrain(scaleY-0.05, 0.5, 1.5);
}

function timeZoomIn () {
  scaleX = constrain(scaleX+0.05, 0.5, 1.5);
}

function timeZoomOut () {
  scaleX = constrain(scaleX-0.05, 0.5, 1.5);
}

function freqsGuitar() {
  alert("FFT no es apto para guitarra, la mayoría de cuerdas no se pueden visualizar debido a que sus frecuencias son bajas. Las frecuencias que se muestran se parecen demasiado a Bajos. Algunas frecuencias (F5, A5) serán muy incómodas de tocar a menos que la guitarra sea eléctrica por el traste que se usa.");

  fixedFreqs = [1, 2, 3, 4, 5];
  fixedNames = ['D3 (Cuerda 3 al aire)', 'E4 (Cuerda 6 al aire)', 'C5 (Cuerda 6, traste 8)', 'F5 (Cuerda 6, traste 13)', 'A5 (Cuerda 6, traste 17)'];
  reTag();
}

function freqsBass() {
  fixedFreqs = [0, 1, 2, 3, 4];
  fixedNames = ['16Hz', '180Hz', '340Hz', '520Hz', '680Hz'];
  reTag();
}

function freqsMid() {
  fixedFreqs = [5, 7, 9, 11, 13];
  fixedNames = ['860Hz', '1200Hz', '1550Hz', '1900Hz', '2200Hz'];
  reTag();
}

function freqsTrebble() {
  fixedFreqs = [14, 16, 18, 20, 22];
  fixedNames = ['2400Hz', '2750Hz', '3100Hz', '3450Hz', '3800Hz'];
  reTag();
}

function freqsDefault() {
  fixedFreqs = [1, 3, 5, 7, 9];
  fixedNames = ['180Hz', '520Hz', '860Hz', '1200Hz', '1550Hz'];
  reTag();
}

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
  topten = new Array(10);

  for(var i =0;i<10;i++) {
    var tt = {};
    tt.index = spectsort[i][1];                     // indice de la estructura original
    tt.magnitude = spectsort[i][0];                       // magnitud
    tt.phase = fft.phase[tt.index];                 // fase, se usa el índice para hallarlo en fft original
    tt.cf = fft.getBandFrequency(tt.index);
    tt.runningphase = fft.runningphase[tt.index];
    tt.frequency = fft.frequency[tt.index];
    topten[i] = tt;
  }

  stroke(0);
  for(var i in small) {
    // mas separado visualmente
    //var xlog = sqrt(map(i, 0, fft.magnitude.length-1, 0., 1.));
    var xlog = map(i, 0, small.length, 0.,1.);
    var xs = map(xlog, 0, 1, xBars, xmBars);

    // 0,0.7 -> 0,0.5
    //var ys = map(sqrt(fft.magnitude[i]), 0, sqrt(0.5), height*0.9, height*0.2);
    var ys = map(sqrt(small[i]), 0, 0.5, ymBars, yBars);
    
    // color para las barras de mayor amplitud
    if (i == topten[0].index) {
      fill(0,255,0);
    } else if (i == topten[1].index) {
      fill(255,0,0);
    } else {
      fill(200);
    }
    // dibujar barras
    rect(xs, ys, wBars/32, ymBars-ys);
  }

  //var hs = '';
  //hs+= 'p5.FastFourierTransform()<br>';
  //hs+= 'est: ' + topten[0].freq.toFixed(3) + ' r: ' + topten[0].mag + ' θΔ: ' + topten[0].runningphase.toFixed(3);
  //hs += 'freq: ' + topten[0].frequency.toFixed(1) + '\tamplitude: ' + topten[0].magnitude + '<br>';
  //hs += 'freq: ' + topten[1].frequency.toFixed(1) + '\tamplitude: ' + topten[1].magnitude + '<br>';
  //tb.html(hs);


  drawGraphCommon();
  drawGraphTop();
  image(graphCommon, width*0.4, height*0.06);
  image(graphTop, width*0.7, height*0.06);

/*
  // moving average: frecuencia con mayor amplitud durante el último segundo
  if (millis() - 1000 > timeCheckpoint) {
    for (var avg = 0, avg2 = 0, i = 0; i < moving.length; i++) {
      avg += moving[i];
      avg2 += moving2[i];
    }
    //console.log(avg/moving.length);
    avgTb.html(avg/moving.length + '<br>' + avg2/moving2.length);

    moving = [];
    moving2 = [];
    timeCheckpoint = millis();
  } else {
    moving.push(ff);
    moving2.push(ff2);
  }
*/
}




function drawGraphCommon () {
  graphCommon.background(255,200,200);

  for (var i = 0; i < 4; i++) {
    graphCommon.fill(240);
    graphCommon.stroke('black');
    graphCommon.strokeWeight(1);
    graphCommon.rect(5, i*height*0.24+5, width*0.27-12, height*0.21);

    drawSine( graphCommon,
              fft.frequency[ fixedFreqs[i] ],
              fft.magnitude[ fixedFreqs[i] ] * 100,
              fft.runningphase[ fixedFreqs[i] ] * 57.2958,
              'red',
              5,
              i*height*0.24+5,
              width*0.27-12,
              height*0.21,
              fixedNames[i]
            );

    

  }
}

function drawGraphTop () {
  graphTop.background(200,200,255);

  for (var i = 0; i < 4; i++) {
    graphTop.fill(240);
    graphTop.stroke('black');
    graphTop.strokeWeight(1);
    graphTop.rect(5, i*height*0.24+5, width*0.27-12, height*0.21);

    drawSine( graphTop,
              topten[i].frequency,
              topten[i].magnitude * 100,
              topten[i].runningphase * 57.2958,
              'blue',
              5,
              i*height*0.24+5,
              width*0.27-12,
              height*0.21,
              emptyArray[i]
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
  canvas.strokeWeight(1);

  canvas.beginShape();
  for (var i = 0; i < w; i++) {  
    var yp = sm * sin(i * sf100 + phase);
    canvas.vertex(x + i, yma - constrain(yp, -ma, ma));
  }
  canvas.endShape();

  
}

function drawSampleSine (canvas, x, y, w, h) {
  canvas.stroke('green');
  canvas.strokeWeight(2);

  var ma = h/2;

  for (var i = 0; i < 360; i++) {
    var yp = ma * sin(i*100/100);
    canvas.point(x + i, y + ma - constrain(yp, -ma, ma));
  }
}
