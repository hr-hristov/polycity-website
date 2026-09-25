import { createOneCity, smooth, clamp01, plan } from './one-city.js?v=93d1433f0575';
import { createTechnicalLayers, ROUNDS } from './technical-layers.js?v=6b5ddd7d68fd';

// Technical stands on the homepage's city and runs it the three ways Polycity
// can, one row at a time as the page scrolls:
//   01 the quick estimate: a glass block rises over each zone as tall as the
//      trips it makes, arcs spread the trips between the zones, the arcs part
//      into the ways of travelling, and the car trips load onto the roads as
//      walls that rise and fall with the hour;
//   02 the simulated day: residents stand at every door with a plan each,
//      everyone goes out at once, each day is weighed, one resident changes
//      plan, and the rounds of learning stack over the city until it settles;
//   03 the junction study: a line is drawn round one stretch of the west road,
//      every vehicle leaves a dot each second, each car's gap ahead shows, the
//      signal turns, the longest tailback is marked and a card traces the cars;
//   then the city is cut into three slices, one for each way, and turns back
//   into numbers at the end.
const city=createOneCity({glide:5});
const {hero,reducedMotion,poses:P}=city;
const layers=createTechnicalLayers(city);

// How many screens of scrolling each tall part takes, its words' own screen
// included, as on How it works: about a screen and a half for each row.
const PACE={quick:6,day:8,junction:7,which:5,closing:4};
for(const element of document.querySelectorAll('.screen'))if(element.dataset.screen in PACE)element.style.setProperty('--screens',String(PACE[element.dataset.screen]));

// Where the camera stands. The page opens on the whole number city; the quick
// estimate stands back to take in the blocks and their arcs, with the words on
// the left; the simulated day is the whole city with the words on the right,
// and steps back and up for the rounds' stack; the junction study is a close
// look at the west road; the three ways look at the whole city from the north,
// so the study's stretch stands in the right-hand slice.
const lift=P.counts.lift;
const numbersPose={...P.closing,lift};

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

// The rows of a part are read one after another as its scroll runs; the row
// being read stands out.
const stepRows=Object.fromEntries(['quick','day','junction'].map(name=>[name,all(`.screen[data-screen="${name}"] [data-step-row]`)]));
const rowOf=(at,count)=>at.slide>.5?Math.min(count-1,Math.floor(at.sub*count)):-1;
function readRow(list,at){
  const current=rowOf(at,list.length);
  list.forEach((row,i)=>write(row,'data-current',i===current));
}
// With less movement each row stands finished: how far through its rows a
// part is, as the end of the row being read.
const finished=(rows,count)=>Math.min(count-1,Math.floor(rows))+.999;

const cards=Object.fromEntries(all('[data-card]').map(card=>[card.dataset.card,card]));
const hourClock=$('[data-hour-clock]');
const twoDigits=n=>String(n).padStart(2,'0');
function clockText(hour){
  const h=Math.floor(hour),m=Math.floor((hour-h)*6)*10;
  return `${twoDigits(h)}:${twoDigits(m)}`;
}
const roundCount=$('[data-round]'),roundsCurve=$('[data-rounds-curve]');
const roundTags=Object.fromEntries(all('[data-round-tag]').map(tag=>[tag.dataset.roundTag,tag]));
const veil=$('[data-veil]');
const J=plan.JUNCTION,studyMiddle=[(J.x0+J.x1)/2,0,(J.z0+J.z1)/2];
// The card's trace: each car's line, and the signal's red and green along the
// stop line, over the last twenty-four seconds, now at the right-hand edge.
const traceParts=Object.fromEntries(all('[data-trace]').map(path=>[path.dataset.trace,path]));
const TRACE_W=240,TRACE_H=84,TRACE_FOOT=88;
const traceX=(ago,seconds)=>(TRACE_W-ago*TRACE_W/seconds).toFixed(1);
const traceY=along=>(TRACE_FOOT-along*TRACE_H).toFixed(1);
let traceDrawn=-1;
function drawTrace(){
  const {lines,runs,seconds,stop}=layers.trace();
  const y=traceY(stop);
  const signal=on=>runs.filter(run=>run.green===on).map(run=>`M${traceX(run.older,seconds)} ${y}H${traceX(run.newer,seconds)}`).join('')||'M0 0';
  write(traceParts.red,'d',signal(false));
  write(traceParts.green,'d',signal(true));
  write(traceParts.cars,'d',lines.filter(line=>line.length>1).map(line=>'M'+line.map(p=>`${traceX(p.ago,seconds)} ${traceY(p.along)}`).join('L')).join('')||'M0 0');
}
// The three ways side by side: two lines where the slices meet and a tag over
// each slice.
const slices=$('[data-slices]');
const sliceLines=all('[data-slice-line]');
const sliceTags=Object.fromEntries(all('[data-slice-tag]').map(tag=>[tag.dataset.sliceTag,tag]));

const shown={ink:''};
city.run((dt,paused)=>{
  const at=city.readScreens(paused);
  const {quick,day,junction,which,closing}=at;
  const still=reducedMotion.matches,narrow=innerWidth<760;
  const turn=(closing.slide+(PACE.closing-1)*closing.sub)/PACE.closing,turned=smooth(turn);
  const field=still?0:turned;
  const leaving=1-smooth(turn/.15);

  // ---- 01 The quick estimate: a row for each of its four steps.
  const q=still?finished(quick.sub*4,4):quick.sub*4;
  const quickIn=smooth((quick.slide-.3)/.5)*(1-smooth(day.slide/.5));
  // The trips arrive with the zones' blocks and stay while the arcs carry
  // them; once the car trips are on the roads, the blocks and arcs step back.
  const onRoads=smooth((q-3)/.3);
  const quickState={
    blocks:quickIn*(1-.8*onRoads),grow:clamp01(q/.95),
    arcs:quickIn*smooth((q-1)/.1)*(1-.9*onRoads),drawn:clamp01((q-1)/.6),split:smooth((q-2)/.5),
    riders:quickIn*smooth((q-1.5)/.2)*(1-onRoads),
    walls:quickIn*onRoads,hour:still?8.5:5+18*clamp01((q-3.1)/.85)
  };

  // ---- 02 The simulated day: a row for each of its five steps.
  const d=still?finished(day.sub*5,5):day.sub*5;
  const dayIn=smooth((day.slide-.3)/.5)*(1-smooth(junction.slide/.5));
  const stacking=smooth((d-4)/.3);
  const dayState={
    doors:dayIn*(1-smooth((d-1)/.25)),
    plans:dayIn>0&&stacking<1?clamp01(d/.8)*1.1:0,
    route:dayIn*(1-stacking),drawn:clamp01((d-.15)/.6),
    out:dayIn*smooth((d-1)/.25)*(1-stacking),
    weighed:dayIn*smooth((d-2)/.25)*(1-stacking),
    change:clamp01((d-3.1)/.7),better:smooth((d-3.3)/.5),
    rounds:dayIn>0?clamp01((d-4)/.9):0
  };

  // ---- 03 The junction study: a row for each of its five steps.
  const j=still?finished(junction.sub*5,5):junction.sub*5;
  const studyIn=smooth((junction.slide-.4)/.4);
  const junctionState={
    pen:studyIn,drawn:clamp01(j/.7),
    seconds:studyIn*smooth((j-1)/.2),gaps:studyIn*smooth((j-2)/.2),
    signal:studyIn*smooth((j-3)/.2),tailback:studyIn*smooth((j-4)/.2)*(1-smooth(which.slide/.5))
  };

  // ---- 04 Which one: the city in three slices. The quick estimate takes the
  // left, the simulated day the middle and the junction study the right, each
  // showing its own way finished; the quick estimate's people and cars stay
  // numbers, since it works in totals.
  const u=still?(which.slide>.5?1:0):clamp01((which.slide-.35)/.65);
  const cut2=.64*smooth(u/.6),cut1=.36*smooth((u-.4)/.6);
  // From the moment the three ways' screen starts to arrive, the city is drawn
  // as slices, so the quick estimate and the day, set finished here, never
  // show over the study before their slices open.
  const three=which.slide>0;
  if(three){
    Object.assign(quickState,{blocks:1,grow:1,arcs:1,drawn:1,split:1,riders:1,walls:0});
    Object.assign(dayState,{doors:0,plans:1.1,route:1,drawn:1,out:1,weighed:1,change:1,better:1,rounds:0});
  }
  for(const state of [quickState,dayState,junctionState])for(const key of ['blocks','arcs','riders','walls','doors','route','out','weighed','pen','seconds','gaps','signal','tailback'])if(key in state)state[key]*=leaving;
  if(leaving<=0)dayState.plans=0;

  // The number skin: the streets and trams turn real as the quick estimate
  // arrives; its trips are totals, so the people and cars turn real only with
  // the simulated day.
  const parts=still?(quick.slide>.5&&day.slide<.5?{streets:1,transit:1,people:0,cars:0}:undefined)
    :{streets:clamp01((quick.slide-.3)/.7),transit:clamp01((quick.slide-.3)/.7),people:clamp01((day.slide-.3)/.7),cars:clamp01((day.slide-.3)/.7)};

  // The camera: each part takes it over as it slides in.
  city.setPose(numbersPose);
  city.mixPose(P.quick,smooth(quick.slide));
  city.mixPose(P.day,smooth(day.slide));
  city.mixPose(P.rounds,still?(d>=4?1:0):stacking);
  city.mixPose(P.junction,smooth(junction.slide));
  city.mixPose(P.threeWays,smooth(which.slide));
  city.mixPose(numbersPose,turned);
  city.shoot();
  city.live(dt,{paused});
  const dark=city.setDay(null);

  layers.update({quick:quickState,day:dayState,junction:junctionState},paused?0:dt,{paused,still});
  const quickParts={streets:1,transit:1,people:0,cars:0};
  if(three)city.paint({field,parts,night:dark,slices:[
    {to:cut1,parts:field>0?parts:quickParts,look:()=>layers.show('quick')},
    {to:cut2,look:()=>layers.show('day')},
    {to:1,look:()=>layers.show('junction')}
  ]});
  else city.paint({field,parts,night:dark});
  layers.show(null);

  // ---- The words and the cards follow.
  for(const [name,list] of Object.entries(stepRows))readRow(list,at[name]);

  // 01: the ways of travelling while the trips are shared out, and the clock
  // while the car trips load onto the roads.
  const estimating=quick.slide>.6&&day.slide<.3;
  write(cards.modes,'data-shown',estimating&&q>=2&&q<3);
  write(cards.hours,'data-shown',estimating&&q>=3);
  write(hourClock,'text',clockText(quickState.hour));

  // 02: one resident's plan, weighed and changed; then the rounds.
  const living=day.slide>.6&&junction.slide<.3;
  write(cards.plan,'data-shown',living&&d<4);
  write(cards.plan,'data-weighed',d>=2);
  write(cards.plan,'data-changed',d>=3.5);
  const learnt=still?1:dayState.rounds;
  write(cards.rounds,'data-shown',living&&d>=4);
  write(roundCount,'text',String(Math.max(1,Math.round(1+29*learnt*learnt))));
  write(roundsCurve,'stroke-dashoffset',(1-learnt).toFixed(4));
  city.placeAt(roundTags.first,layers.roundTag(0),living&&d>=4&&layers.roundRisen(0));
  city.placeAt(roundTags.last,layers.roundTag(ROUNDS.length-1),living&&d>=4&&layers.roundRisen(ROUNDS.length-1));

  // 03: the veil round the study's stretch, its pin, the trace and the
  // longest tailback.
  const studying=junction.slide>.6&&which.slide<.4;
  city.placeAt(veil,studyMiddle,studying);
  city.placePin('junctionStudy',studying&&j>=.7);
  city.placePin('longestTailback',studying&&j>=4.2&&layers.trace().longest>.5);
  const tracing=studying&&j>=3;
  write(cards.trace,'data-shown',tracing);
  if(tracing&&(hero.frame%4===0||traceDrawn<0||paused)){drawTrace();traceDrawn=hero.frame;}

  // 04: the lines where the slices meet and the tags over them, until the
  // city turns back into numbers.
  const sliced=which.slide>.5&&turn<.05;
  write(slices,'--cut1',(cut1*100).toFixed(2)+'%');
  write(slices,'--cut2',(cut2*100).toFixed(2)+'%');
  write(slices,'data-shown',sliced);
  sliceLines.forEach((line,i)=>write(line,'data-shown',[cut1,cut2][i]>.005));
  // A tag stands once its slice is wide enough to hold it.
  const room=narrow?96:150;
  write(sliceTags.quick,'data-shown',sliced&&cut1*innerWidth>room);
  write(sliceTags.day,'data-shown',sliced&&(cut2-cut1)*innerWidth>room);
  write(sliceTags.junction,'data-shown',sliced&&(1-cut2)*innerWidth>room);

  // The header's words are white while the city is numbers. With less
  // movement the city never turns, and the solid navy of the first and last
  // screens stands in for it.
  const wash=Math.max(field,parts?1-parts.streets:0);
  const ink=(still?quick.slide<.5||closing.slide>.55:wash>.45)?'light':'dark';
  if(ink!==shown.ink){shown.ink=ink;document.body.dataset.stageInk=ink;}
  // On a wide screen the quick estimate's words stand on paper under the
  // brand while the city behind the header is still numbers.
  write(document.body,'data-brand-ink',!narrow&&quick.slide>.5&&day.slide<.5?'dark':'');
  hero.canvas.dataset.screen=['closing','which','junction','day','quick'].find(name=>at[name].slide>.5)||'intro';
  hero.canvas.dataset.numbers=wash.toFixed(4);
  hero.canvas.dataset.hour=quickState.hour.toFixed(2);
  hero.canvas.dataset.round=roundCount?.textContent||'';
  hero.canvas.dataset.slices=`${cut1.toFixed(4)} ${cut2.toFixed(4)}`;
});
