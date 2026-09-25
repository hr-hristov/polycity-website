import { createOneCity, smooth, clamp01, plan } from './one-city.js?v=a2f722dbad15';
import { createHowLayers } from './how-layers.js?v=b3af98116fa1';
import { WEST, EAST } from './hero-numbers.js?v=61b49655c33d';

// How it works stands on the homepage's city, and each step moves the way its
// words say, one row at a time as the page scrolls:
//   01 each kind of data turns its own part of the city from numbers into the
//      real thing, behind a moving seam, and the zones, the survey's trips and
//      the counting loops arrive with their rows;
//      then each open standard the data is read from keeps only its own part
//      of the city real, or marks what its feed carries, under its own tag;
//   02 a card by the counting place fits the model to the survey and the
//      counts, and today's city is approved;
//   03 the camera looks straight down and a pen draws each change before it is
//      built, with a pin saying when it applies;
//   04 a clock runs a day from four in the morning to midnight, the sun
//      crosses, windows light after dark and the trips fly;
//   05 the map from above paints each result group with its legend;
//   06 the split opens on the colours of what changed, the saved versions step
//      through, and a decision report rises.
const city=createOneCity({glide:5});
const {hero,reducedMotion,poses:P,weights}=city;
const layers=createHowLayers(city);

// How many screens of scrolling each tall step takes, the words' own screen
// included, so every row stays on screen long enough to read. A step carries
// more than its words: rows arrive one at a time, the camera moves, a card
// opens. At three screens a step had two screens of scrolling to do all of it,
// and the city ran past faster than anybody could read it, so every step's
// travel is about half as long again. Simulate a day is longer still: its day
// turns the whole city from night to day and back. The data has eleven rows,
// about two thirds of a screen each.
const PACE={bring:5,formats:8,match:5,draw:6,simulate:8,results:6,compare:5,closing:4};
for(const element of document.querySelectorAll('.screen'))if(element.dataset.screen in PACE)element.style.setProperty('--screens',String(PACE[element.dataset.screen]));

// Where each of Simulate a day's three rows starts in its step. At a third of
// five screens each, the day ran from noon to night in half a screen of
// scrolling, so the day row takes three fifths of eight screens, and the
// residents and the repeat runs a fifth each.
const DAY_ROWS=[0,.2,.8];
// How far through its rows a step stands when the rows are not an even share
// each: 1.5 is halfway through the second row.
function rowsAt(sub,starts){
  let row=starts.length-1;
  while(row>0&&sub<starts[row])row--;
  const end=row+1<starts.length?starts[row+1]:1;
  return row+clamp01((sub-starts[row])/(end-starts[row]));
}

// The data: a row for each open standard, an eleventh of the section each.
// The first three are the files the city is built from. While each is read,
// what that file does not carry turns back into numbers behind step 01's
// seam, and what it carries stays or turns real: streets, transit, people,
// cars. The census, survey and counts have no open standard, so they have no
// row. The other eight are feeds read beside them, each marked on the whole
// city.
const FORMAT_ROWS=11;
const FILE_PARTS=[[1,0,0,0],[0,1,0,0],[0,0,0,0]],REAL=[1,1,1,1];
// A row's first sixth turns back what it does not carry, its second turns
// real what it does, and its mark and tag stand after that.
function filesAt(f){
  const row=Math.min(FORMAT_ROWS-1,Math.max(0,Math.floor(f))),u=f-row;
  const from=FILE_PARTS[row-1]||REAL,to=FILE_PARTS[row]||REAL;
  const away=1-smooth(u/.16),back=smooth((u-.16)/.16);
  const [streets,transit,people,cars]=from.map((a,k)=>a===to[k]?a:a>to[k]?away:back);
  return {streets,transit,people,cars};
}

// Where the camera stands. The data arrives over the whole city, pushed right
// of the words. Its formats are read from a step further back and further
// right, as the day's view is mirrored, so every place a format marks stands
// clear of the words and the screen's edge; the matching stands at the counting place and steps in close
// while the road's capacity is fitted; the drawing and the results look
// straight down on a map; the day is the whole city with the words on the right.
const lift=P.counts.lift;
const numbersPose={...P.closing,lift};
const bringPose={...P.hero,dx:-4.5,dy:.4,lift};
const dataPose={...P.day,span:50,dx:-10.4,dy:.4,lift,phone:30};

const $=selector=>document.querySelector(selector);
const all=selector=>[...document.querySelectorAll(selector)];
// Every value the scene writes into the page is written only when it changes.
const written=new WeakMap();
function write(element,name,value){
  if(!element)return;
  let seen=written.get(element);if(!seen){seen={};written.set(element,seen);}
  if(seen[name]===value)return;seen[name]=value;
  if(name==='text')element.textContent=value;
  else if(name.startsWith('--'))element.style.setProperty(name,value);
  else if(typeof value==='boolean')element.toggleAttribute(name,value);
  else element.setAttribute(name,value);
}

// The rows of a step are read one after another as its scroll runs; the row
// being read stands out.
const stepRows=Object.fromEntries(['bring','formats','match','simulate'].map(name=>[name,all(`.screen[data-screen="${name}"] [data-step-row]`)]));
const placeRows=all('[data-camera-place]');
const rowOf=(at,count)=>at.slide>.5?Math.min(count-1,Math.floor(at.sub*count)):-1;
function readRow(list,at){
  const current=rowOf(at,list.length);
  list.forEach((row,i)=>write(row,'data-current',i===current));
}

// 01: the card of the household whose survey day is opened, and the mark at
// each of its three stops. A trip's line arrives as its leg is drawn.
const surveyCard=$('[data-survey]');
const surveyTrips=[...surveyCard.querySelectorAll('[data-trip]')];
const surveyPins=['surveyHome','surveyWork','surveyShops'];

// The data: each format's tag over the city, and on a phone the kind of data
// the marked name carries, under the names.
const formatTags=all('[data-format-tag]');
const formatKind=$('[data-format-kind]');
const formatKinds=stepRows.formats.map(row=>row.querySelector('span').textContent);

// 02: the card by the counting place, one pane for each row. The model's
// shares settle onto the survey's, its trip lengths onto the survey's curve,
// its cars an hour onto the count, and then the city is approved.
const fit=$('[data-fit]');
const panes=[...fit.querySelectorAll('[data-pane]')];
const modelBars=[...fit.querySelectorAll('[data-model]')];
const MODEL_SHARES=[[88.6,68.6],[28.6,38.6],[5.7,10],[20,25.7]];
const modelCurve=fit.querySelector('[data-curve]');
const CURVE_FROM=[0,50,40,50,70,22,100,22,160,42,200,48],CURVE_TO=[0,50,30,50,38,6,60,6,120,38,200,50];
const curveAt=t=>{
  const v=CURVE_FROM.map((a,i)=>+(a+(CURVE_TO[i]-a)*t).toFixed(1));
  return `M${v[0]} ${v[1]}C${v[2]} ${v[3]} ${v[4]} ${v[5]} ${v[6]} ${v[7]}S${v[8]} ${v[9]} ${v[10]} ${v[11]}`;
};
const count=fit.querySelector('[data-count]'),stamp=fit.querySelector('[data-stamp]');

// 03: the pen's nib, at the end of the line it is drawing.
const nib=$('[data-nib]');
const drawnPins=['drawnStreets','drawnTransit','drawnGrowth'],changeNames=['street','transit','growth'],placeNames=['streets','transit','growth'];

// 04: the sun, the trips' tags and the day's card.
const sun=$('[data-sun]');
const tags=Object.fromEntries(all('[data-tag]').map(tag=>[tag.dataset.tag,tag]));
const dayCard=$('[data-day]');
const clock=dayCard.querySelector('[data-clock]'),hoursCurve=dayCard.querySelector('[data-hours]');
const repeatRuns=[...dayCard.querySelectorAll('[data-repeat]')],spread=dayCard.querySelector('[data-spread]');
const twoDigits=n=>String(n).padStart(2,'0');
function clockText(hour){
  if(hour>=24)return '24:00';
  const h=Math.floor(hour),m=Math.floor((hour-h)*6)*10;
  return `${twoDigits(h)}:${twoDigits(m)}`;
}
// The sun rises behind the city in the east, on the right of the screen, is
// highest at one, and sets in the west on the left. On a phone the day card
// stands at the top of the screen, so the sun stays under it.
function placeSun(hour,shown){
  const centre=city.project([0,.9,0]);
  const arc=(hour-6)/14*Math.PI,across=Math.min(innerWidth*.34,480);
  const horizon=centre.y-innerHeight*.04,top=innerWidth<760?190:Math.max(110,innerHeight*.15);
  write(sun,'--x',(centre.x+Math.cos(arc)*across).toFixed(1)+'px');
  write(sun,'--y',(horizon-Math.max(0,Math.sin(arc))*Math.max(0,horizon-top)).toFixed(1)+'px');
  write(sun,'data-shown',shown&&hour>5.6&&hour<20.4);
}

// 05: the result groups and the legend under them.
const groups=all('.groups li'),legends=all('[data-legend]');

// 06: the key to the change colours, the saved versions, the report and the
// three columns under the split.
const compareCards=Object.fromEntries(all('[data-compare-card]').map(card=>[card.dataset.compareCard,card]));
const versions=all('[data-version]'),columns=all('.three>div');

const shown={row:'',ink:''};
city.run((dt,paused)=>{
  const at=city.readScreens(paused);
  const {bring,formats,match,draw,simulate,results,compare,closing}=at;
  const still=reducedMotion.matches,narrow=innerWidth<760;
  const turn=(closing.slide+(PACE.closing-1)*closing.sub)/PACE.closing,turned=smooth(turn);
  const field=still?0:turned;

  // ---- 01 Bring the city: a row for each kind of data. The street map turns
  // the streets, buildings and park real; the timetable the trams, their stops
  // and wires; the census the people, with its zones; the survey draws the
  // trips it records; the counts turn the cars real and light the loops.
  const b=bring.sub*5;
  const partAt=k=>clamp01((b-k)/.9);
  // The data's rows then turn parts back and forth; before the data and after
  // it every part is real, so each part is the lesser of the two.
  const f=formats.sub*FORMAT_ROWS,formatRow=Math.min(FORMAT_ROWS-1,Math.floor(f)),inData=formats.slide>.5;
  const filed=filesAt(f);
  const parts=still?undefined:{streets:Math.min(partAt(0),filed.streets),transit:Math.min(partAt(1),filed.transit),people:Math.min(partAt(2),filed.people),cars:Math.min(partAt(4),filed.cars)};
  const sweeping=parts&&Object.values(parts).find(p=>p>0&&p<1);
  // A row's mark stands once its parts have turned and leaves just before the
  // next row; the first four rows turn parts first, so theirs comes later.
  const markOf=i=>still?(inData&&formatRow===i?1:0):smooth((f-i-(i<4?.3:.12))/.1)*(1-smooth((f-i-.88)/.08));
  // Step 01's zones, survey and loops leave as the data slides in, and come
  // back only on their own rows there: the zones for GeoJSON and Open Matrix,
  // the loops for DATEX II.
  const leaving=1-smooth(formats.slide/.7);
  const zones=Math.max((still?1:smooth((b-2)/.5))*leaving*smooth(bring.slide/.5),markOf(2),markOf(9));
  // The survey's row: the homes asked are ringed, one household's day is drawn
  // stop by stop, and the rest of the sample fills in behind it.
  const survey=still?1:clamp01((b-2.9)/1.05);
  const surveyView=still?1:smooth((b-2.6)/.5)*(1-smooth((b-3.85)/.35));
  // The loops stand again at the counting place when the matching begins.
  const loops=Math.max(
    (still?1:smooth((b-4)/.3))*leaving*smooth(bring.slide/.5),
    markOf(4),
    (still?1:smooth(match.slide/.5))*(1-smooth((draw.slide-.3)/.3))
  );
  const marks={route:markOf(1),realtime:markOf(3),counts:markOf(4),datex:markOf(4),ridership:markOf(5),gbfs:markOf(6),kerb:markOf(7),charging:markOf(8),matrix:markOf(9),elevation:markOf(10)};

  // ---- 02 Match today: a row for each fit, a quarter of the step each.
  const m=match.sub*4,matchRow=Math.min(3,Math.floor(m)),local=still?1:clamp01(m-matchRow);
  const zoom=smooth((m-2)/.24)*(1-smooth((m-3)/.24));

  // ---- 03 Draw the change: a row for each change, a screen each. The pen
  // draws it, then it is built, then its pin says when it applies.
  const drawRow=Math.min(2,Math.floor(draw.sub*3));
  const pens=[0,1,2].map(k=>{
    const l=draw.sub*3-k,progress=clamp01((l-.05)/.4);
    const on=!still&&l>.05&&l<1?1-smooth((l-.8)/.15):0;
    weights[changeNames[k]]=still?(draw.slide>.5?1:0):smooth((l-.45)/.2);
    return {progress,shown:on*smooth((draw.slide-.5)/.3),built:still?draw.slide>.5:l>.66};
  });

  // ---- 04 Simulate a day: the residents come to their doors at four in the
  // morning, the day runs to midnight, and the day is run again.
  const s=rowsAt(simulate.sub,DAY_ROWS);
  const hour=still?12:s<1?4:s<2?4+20*(s-1):24;
  const residents=s<1?clamp01((s-.1)/.8)*4:4;
  const dayAmount=smooth(simulate.slide)*(1-smooth(results.slide));
  const dayShown=smooth((simulate.slide-.5)/.4)*(1-smooth(results.slide/.4));

  // ---- 05 Read the results: a group for each ninth of the step.
  const r=results.sub*9,group=Math.min(8,Math.floor(r));
  const resultsShown=smooth((results.slide-.4)/.5)*(1-smooth(compare.slide*2));
  const resultAlpha=[...Array(9)].map((_,i)=>{
    if(still)return i===group?resultsShown:0;
    const inside=i===0?1:smooth((r-i+.06)/.12),outside=i===8?0:smooth((r-i-1+.06)/.12);
    return inside*(1-outside)*resultsShown;
  });

  // ---- 06 Compare and decide: the change colours, the saved versions, the
  // report. The versions step the proposal's side through what each added.
  const c=compare.sub*3,compareRow=Math.min(2,Math.floor(c));
  const opened=(still?1:smooth(compare.sub/.1))*smooth(compare.slide)*(1-smooth(turn/.1));
  const changes=(still?(c<1?1:0):smooth((c-.05)/.2)*(1-smooth((c-.95)/.12)))*opened;
  const l=c-1;
  if(compare.slide>.5&&l>=0&&l<1){
    const version=(start)=>still?(l>=start?1:0):l<.06?1-smooth(l/.06):smooth((l-start)/.08);
    weights.transit=version(.33);weights.growth=version(.66);
  }
  const versionShown=l<.33?0:l<.66?1:2;

  // The camera: each step takes it over as it slides in.
  city.setPose(numbersPose);
  city.mixPose(bringPose,smooth(bring.slide));
  city.mixPose(P.survey,surveyView*smooth(bring.slide));
  city.mixPose(dataPose,smooth(formats.slide));
  city.mixPose(P.counts,smooth(match.slide));
  city.mixPose(P.countsClose,still?0:zoom);
  city.mixPose(P.map,smooth(draw.slide));
  city.mixPose(P.day,smooth(simulate.slide));
  city.mixPose(P.resultsMap,smooth(results.slide));
  city.mixPose(P.comparison,smooth(compare.slide));
  city.mixPose(numbersPose,turned);
  city.shoot();
  city.applyProposal(weights);
  // While the timetable and the passenger counts are read, a tram stands a
  // little longer at the first stop, where people board it.
  city.live(dt,{paused,nearStop:inData&&(formatRow===1||formatRow===5)});

  const dark=dayAmount>0?city.setDay(hour,dayAmount):city.setDay(null);
  let seam={x:0,glow:0};
  if(sweeping!==undefined)seam={x:WEST+(EAST-WEST)*sweeping,glow:smooth(sweeping/.05)*smooth((1-sweeping)/.05)};
  layers.update({
    zones,survey,surveyShown:leaving*smooth(bring.slide/.5),loops,seam,
    light:parts?1-parts.streets:0,formats:marks,journey:still?1:clamp01((f-4.12)/.4),
    pens:pens.map(({progress,shown:on})=>({progress,shown:on})),
    day:{shown:dayShown,hour,residents},
    results:resultAlpha,
    changes
  },paused?0:dt);
  const cut=city.paint({field,opened,parts,night:dark});

  // ---- The words and the cards follow. Simulate a day's row marked is the
  // one its day is in, not an even third of the step.
  const reads={...at,simulate:{...simulate,sub:s/3}};
  for(const [name,list] of Object.entries(stepRows))readRow(list,reads[name]);
  const place=placeNames[drawRow];
  if(place!==shown.row){shown.row=place;city.mark(placeRows,'cameraPlace',place);hero.host.dataset.choice=place;}

  // 01: a mark at each stop of the opened day, and the card of that household
  // beside its home. Each trip's line arrives as its leg is drawn.
  const asking=bring.slide>.6&&formats.slide<.4&&surveyView>.05;
  surveyPins.forEach((name,i)=>city.placePin(name,asking&&survey>=.16+i*.17));
  city.placeAt(surveyCard,plan.PINS.surveyHome.place,asking&&survey>=.12);
  surveyTrips.forEach((row,i)=>write(row,'data-shown',survey>=.16+i*.17));

  // The data: the tag of the row being read over what it carries, and on a
  // phone the kind of data under the names. On a wide screen a tag riding on
  // a tram or a bike hides while it passes under the words.
  formatTags.forEach((tag,i)=>{
    const place=layers.formatPlace(tag.dataset.formatTag),clear=narrow||city.project(place).x>innerWidth*.57;
    city.placeAt(tag,place,inData&&match.slide<.3&&markOf(i)>.5&&clear);
  });
  write(formatKind,'text',formatKinds[Math.max(0,rowOf(formats,formatKinds.length))]);

  // 02: the card stands under the pin of the counting place.
  const matching=match.slide>.6&&draw.slide<.3;
  city.placePin('counted',matching);
  city.placeAt(fit,plan.PINS.counted.place,matching);
  panes.forEach((pane,i)=>write(pane,'data-current',i===matchRow));
  const bars=matchRow===0?smooth((local-.05)/.5):matchRow>0?1:0;
  modelBars.forEach((bar,i)=>{const [from,to]=MODEL_SHARES[i];write(bar,'--model',(from+(to-from)*bars).toFixed(2)+'%');});
  const lengths=matchRow===1?smooth((local-.1)/.5):matchRow>1?1:0;
  write(modelCurve,'d',curveAt(lengths));
  const capacity=matchRow===2?smooth((local-.3)/.45):matchRow>2?1:0;
  write(count,'text',String(Math.round(410+220*capacity)));
  write(stamp,'--land',(matchRow===3?smooth((local-.08)/.14):0).toFixed(3));

  // 03: a wide screen keeps every pin of a change already built; a narrow one
  // has room for the pin of the row being read.
  const drawing=draw.slide>.6&&simulate.slide<.4;
  drawnPins.forEach((name,k)=>city.placePin(name,drawing&&pens[k].built&&(!narrow||k===drawRow)));
  const pen=pens.find(p=>p.shown>.5&&p.progress>0&&p.progress<1);
  const penAt=pen?pens.indexOf(pen):-1;
  // placeAt shows the nib without going through write, so it is hidden here
  // directly too; otherwise it stays where the last line ended.
  if(pen)city.placeAt(nib,layers.tip(penAt,pen.progress),drawing);
  else nib.toggleAttribute('data-shown',false);

  // 04: the sun, the clock and the trips' tags. The page goes to night with
  // the city, so the words turn light over it.
  const living=simulate.slide>.6&&results.slide<.3;
  placeSun(hour,living&&!still);
  write(document.body,'--night',dark.toFixed(3));
  write(dayCard,'data-shown',living);
  write(clock,'text',clockText(hour));
  write(hoursCurve,'stroke-dashoffset',(still?0:1-clamp01((hour-4)/20)).toFixed(4));
  const runs=still?1:smooth((s-2.1)/.3),band=still?1:smooth((s-2.45)/.3);
  repeatRuns.forEach(run=>write(run,'--shown',runs.toFixed(3)));
  write(spread,'--shown',band.toFixed(3));
  for(const [name,tag] of Object.entries(tags)){
    const {place,from,to}=layers.TAGS[name];
    city.placeAt(tag,[place[0],1.3,place[1]],living&&hour>=from&&hour<=to);
  }

  // 05: the group painted on the map is the one marked in the list.
  const reading=results.slide>.5&&compare.slide<.5;
  groups.forEach((item,i)=>write(item,'data-current',reading&&i===group));
  legends.forEach((legend,i)=>write(legend,'data-current',reading&&i===group));

  // 06: each card stands while its row is read.
  const comparing=compare.slide>.6&&turn<.05;
  write(compareCards.key,'data-shown',comparing&&compareRow===0&&opened>.5);
  write(compareCards.versions,'data-shown',comparing&&compareRow===1);
  versions.forEach((item,i)=>{write(item,'data-reached',i<=versionShown);write(item,'data-current',i===versionShown);});
  const rise=comparing?still?(compareRow===2?1:0):smooth((c-2)/.25):0;
  write(compareCards.report,'--rise',rise.toFixed(3));
  columns.forEach((column,i)=>write(column,'data-current',compare.slide>.5&&i===compareRow));

  // The header's words are white while the city is numbers or the day is
  // dark. With less movement the city never turns, and the solid navy of the
  // first and last screens stands in for it.
  const wash=Math.max(field,parts?1-parts.streets:0);
  const ink=(still?bring.slide<.5||closing.slide>.55:wash>.45||dark>.5)?'light':'dark';
  if(ink!==shown.ink){shown.ink=ink;document.body.dataset.stageInk=ink;}
  // On a wide screen step 01's and the data's words stand on paper under the
  // brand, so the brand keeps its dark ink there while the rest of the header
  // turns light over the numbers.
  write(document.body,'data-brand-ink',!narrow&&bring.slide>.5&&match.slide<.5?'dark':'');
  hero.canvas.dataset.screen=['closing','compare','results','simulate','draw','match','formats','bring'].find(name=>at[name].slide>.5)||'intro';
  hero.canvas.dataset.format=inData&&match.slide<=.5?formatTags[formatRow].dataset.formatTag:'';
  hero.canvas.dataset.numbers=wash.toFixed(4);
  hero.canvas.dataset.split=cut.toFixed(4);
  hero.canvas.dataset.hour=hour.toFixed(2);
});
