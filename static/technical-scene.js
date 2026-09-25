import { createOneCity, smooth, clamp01, plan, THREE } from './one-city.js?v=a2f722dbad15';
import { createTechnicalLayers, TRIP_RATE, ZONE_TRIPS, ZONE_KM, LIT_ZONE, DESTINATIONS, MODES, hourLoad, roadLoad, READ_ROAD } from './technical-layers.js?v=9ee794aff843';
import { pull, pullCurve, travelTime, roadCurve, ROUND_COUNT, NEW_PLANS_STOP, averageScore, roundsChart, safeSpeed, safeCurve, LIMIT, MIN_GAP, CYCLE, mainPhases, signalTrace } from './story-curves.js?v=7dd555d9dbcc';
import { createWeighingCard, fillRemembered, clock } from './day-score.js?v=3884fd80fb69';

// Technical stands on the homepage's city and runs it the three ways Polycity
// can, one row at a time as the page scrolls:
//   01 the quick estimate keeps the city in numbers, since it works in totals:
//      a column of light rises over each zone as tall as the trips it makes,
//      glowing arcs spread the trips between the zones and part into the ways
//      of travelling, and the car trips pour onto the roads as flowing light;
//   02 the simulated day, the main way, over seven rows: the residents, their
//      plans, everyone out at once with tailbacks, each day as a thread rising
//      over the city an hour a step while the card weighs one resident's day,
//      the days a resident remembers, the rounds of learning, and what comes
//      back, the threads in income colours;
//   03 the junction study: a line round one stretch of the west road, a trail
//      behind every vehicle coloured by its speed, each car's gap, the signal's
//      cycle and the longest tailback;
//   then the city is cut into three slices, one for each way, each in its own
//   look, and turns back into numbers at the end.
// Each row raises a card over the city, and every number on a card is worked
// out here from the rules the product runs.
const city=createOneCity({glide:5});
const {hero,reducedMotion,poses:P}=city;
const layers=createTechnicalLayers(city);

// How many screens of scrolling each tall part takes, its words' own screen
// included: about a screen and a half for each row. The simulated day has
// seven rows and is the longest.
const PACE={quick:6,day:11,junction:7,which:5,closing:4};
for(const element of document.querySelectorAll('.screen'))if(element.dataset.screen in PACE)element.style.setProperty('--screens',String(PACE[element.dataset.screen]));

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
const SVG='http://www.w3.org/2000/svg';
function draw(parent,name,attributes,text){
  const element=document.createElementNS(SVG,name);
  for(const [key,value] of Object.entries(attributes))element.setAttribute(key,String(value));
  if(text!=null)element.textContent=text;
  parent?.appendChild(element);return element;
}
// Thousands apart by a space that never breaks, as the site writes them.
const grouped=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,' ');

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
const inCard=(name,selector)=>cards[name]?.querySelector(selector);
const inCardAll=(name,selector)=>[...(cards[name]?.querySelectorAll(selector)||[])];

// ---- 01 The quick estimate's cards ----------------------------------------------
write(inCard('trips','[data-trip-rate]'),'text',String(TRIP_RATE));
const zoneTags=all('[data-zone-tag]');
zoneTags.forEach(tag=>write(tag.querySelector('b'),'text',grouped(ZONE_TRIPS[+tag.dataset.zoneTag])));
// A zone's tag is left out where it would stand on the quick estimate's
// words, the column from the eyebrow down to the last row as wide as the
// paragraph, or under the card shown. The tag stands centred above its point.
const quickWords={top:$('#quick .eyebrow'),side:$('#quick .copy'),bottom:$('#quick .changes')};
function wordsColumn(){
  if(!quickWords.top||!quickWords.side||!quickWords.bottom)return null;
  const side=quickWords.side.getBoundingClientRect();
  return {left:side.left,right:side.right,top:quickWords.top.getBoundingClientRect().top,bottom:quickWords.bottom.getBoundingClientRect().bottom};
}
const covered=(box,{x,y},{w,h})=>!!box&&x+w/2>box.left&&x-w/2<box.right&&y>box.top&&y-h<box.bottom;
// Where they go: the pull of distance, with each of the lit zone's
// destinations on the curve and the one the arc lights marked.
const FALL_MOST=8;
const fall=pullCurve(160,66,{top:4,left:5,bottom:4,most:FALL_MOST});
write(inCard('gravity','[data-fall-line]'),'points',fall.points);
const fallDots=inCard('gravity','[data-fall-dots]');
DESTINATIONS.forEach(j=>{const p=fall.at(ZONE_KM[LIT_ZONE][j]);draw(fallDots,'circle',{cx:p.x.toFixed(1),cy:p.y.toFixed(1),r:2.2});});
const fallNow=inCard('gravity','[data-fall-now]');
const gravityText={from:inCard('gravity','[data-from]'),to:inCard('gravity','[data-to]'),km:inCard('gravity','[data-km]'),kmMath:inCard('gravity','[data-km-math]'),pull:inCard('gravity','[data-pull]')};
write(gravityText.from,'text',String(LIT_ZONE+1));
// How they travel: each way's share of the trips.
inCardAll('modes','[data-share]').forEach(bar=>{
  const mode=MODES[+bar.dataset.share];
  write(bar,'--w',(mode.share*100).toFixed(1)+'%');
  write(bar.querySelector('b'),'text',`${Math.round(mode.share*100)} %`);
});
// Which roads: the road's travel time against how full it is, and the dot
// for the north street at the hour the roads show.
const ROAD_MOST=1.5,CAPACITY=1800;
const road=roadCurve(150,62,{most:ROAD_MOST});
write(inCard('roads','[data-road-line]'),'points',road.points);
const roadFull=inCard('roads','[data-road-full]');
write(roadFull,'x1',road.full.toFixed(1));write(roadFull,'x2',road.full.toFixed(1));
const roadNow=inCard('roads','[data-road-now]');
const roadText={clock:inCard('roads','[data-hour-clock]'),cars:inCard('roads','[data-cars]'),capacity:inCard('roads','[data-capacity]'),slower:inCard('roads','[data-slower]')};
write(roadText.capacity,'text',grouped(CAPACITY));
// The north street is a little over full at the busiest hour.
const ratioAt=hour=>1.12*roadLoad(READ_ROAD)*hourLoad(hour);

// ---- 02 The simulated day's cards ----------------------------------------------
const weighing=createWeighingCard(cards.weigh);
fillRemembered(cards.memory);
// Rounds of learning: the average score round by round, drawn as far as the
// round reached, the round new plans stop and the last tenth the settling
// check reads.
const rounds=roundsChart(300,130,{left:22,right:8,top:14,bottom:20});
const roundPoints=Array.from({length:ROUND_COUNT},(_,i)=>`${rounds.x(i+1).toFixed(1)},${rounds.y(averageScore(i+1)).toFixed(1)}`);
const roundsLine=inCard('rounds','[data-rounds-line]'),roundsNow=inCard('rounds','[data-rounds-now]');
const tenth=inCard('rounds','[data-rounds-tenth]');
write(tenth,'x',rounds.tenth.toFixed(1));write(tenth,'width',(296-rounds.tenth).toFixed(1));
const stopLine=inCard('rounds','[data-rounds-stop]');
write(stopLine,'x1',rounds.stop.toFixed(1));write(stopLine,'x2',rounds.stop.toFixed(1));
write(inCard('rounds','[data-rounds-grid]'),'d',[50,75,100].map(score=>`M14,${rounds.y(score).toFixed(1)}H296`).join(''));
const roundTicks=inCard('rounds','[data-rounds-ticks]');
[1,10,20,30].forEach((round,i)=>draw(roundTicks,'text',{x:rounds.x(round).toFixed(1),y:126,'text-anchor':i===0?'start':i===3?'end':'middle'},String(round)));
const STOP_ROUND=Math.round(ROUND_COUNT*NEW_PLANS_STOP);
write(inCard('rounds','[data-stop-round]'),'text',String(STOP_ROUND));
const roundText=inCard('rounds','[data-round]');
const badges=inCardAll('rounds','[data-badge]');

// ---- 03 The junction study's cards ---------------------------------------------
// Keeps its distance: a car closing on a standing car, its gap on the road
// drawing, and its safe speed sliding down the curve to a stop.
const GAP_MOST=40,PX_PER_M=5,LEADER_X=228,CAR_W=44;
const safe=safeCurve(280,96,{most:GAP_MOST,left:4,right:4,top:8,bottom:4});
write(inCard('gap','[data-safe-line]'),'points',safe.points);
const safeLimit=inCard('gap','[data-safe-limit]');
write(safeLimit,'y1',safe.limit.toFixed(1));write(safeLimit,'y2',safe.limit.toFixed(1));
cards.gap?.style.setProperty('--limit',(safe.limit/96*100).toFixed(2)+'%');
const gapParts={follower:inCard('gap','[data-follower]'),bracket:inCard('gap','[data-gap-bracket]'),now:inCard('gap','[data-safe-now]'),gap:inCard('gap','[data-gap]'),speed:inCard('gap','[data-speed]')};
// Signals and give way: fourteen cars wait on the main road and six on the
// side street, so the main road gets the larger share of the green.
const Q1=14,Q2=6;
const cycle=mainPhases(Q1,Q2);
write(inCard('signals','[data-q="1"]'),'text',String(Q1));
write(inCard('signals','[data-q="2"]'),'text',String(Q2));
write(inCard('signals','[data-g="1"]'),'text',String(cycle.main));
write(inCard('signals','[data-g="2"]'),'text',String(cycle.side));
// The ring: the main road's cycle, red while the side street has its green,
// then green, then amber, clockwise from the top.
const ring=inCard('signals','[data-cycle-ring]'),ROUND=2*Math.PI*30;
cycle.phases.forEach(phase=>draw(ring,'circle',{class:phase.kind,cx:40,cy:40,r:30,
  'stroke-dasharray':`${((phase.to-phase.from)/CYCLE*ROUND).toFixed(2)} ${ROUND.toFixed(2)}`,
  'stroke-dashoffset':(-phase.from/CYCLE*ROUND).toFixed(2),transform:'rotate(-90 40 40)'}));
const hand=inCard('signals','[data-hand]');
// The trace: one cycle at the main road's stop line, each car a line
// climbing to it, under a strip of the lamp's colours.
const trace=signalTrace(Q1,Q2);
const traceStrip=inCard('signals','[data-trace-strip]');
trace.strip.forEach(bar=>draw(traceStrip,'rect',{class:bar.kind,x:bar.x.toFixed(1),y:6,width:Math.max(0,bar.w-1.5).toFixed(1),height:7,rx:3.5}));
write(inCard('signals','[data-trace-grid]'),'d',[30,60].map(t=>`M${trace.X(t).toFixed(1)},18V168`).join('')+[50,100].map(m=>`M${trace.left},${trace.Y(m).toFixed(1)}H${trace.right}`).join(''));
write(inCard('signals','[data-trace-wedge]'),'points',trace.wedge);
const traceStop=inCard('signals','[data-trace-stop]');
write(traceStop,'y1',trace.stopY.toFixed(1));write(traceStop,'y2',trace.stopY.toFixed(1));
for(const kind of ['moving','standing','away','forming','clearing'])write(inCard('signals',`[data-trace-${kind}]`),'d',trace[kind]);
const traceTicks=inCard('signals','[data-trace-ticks]');
[0,30,60,90].forEach((t,i)=>draw(traceTicks,'text',{x:trace.X(t).toFixed(1),y:177,'text-anchor':i===0?'start':i===3?'end':'middle'},String(t)));
[0,50,100].forEach(m=>draw(traceTicks,'text',{x:14,y:(trace.Y(m)+3).toFixed(1),'text-anchor':'end'},String(m)));
const traceNow=inCard('signals','[data-trace-now]');

// ---- The tags over the city ------------------------------------------------------
const hourTag=$('[data-hour-tag]');
const axisTags=Object.fromEntries(all('[data-axis-tag]').map(tag=>[tag.dataset.axisTag,tag]));
const veil=$('[data-veil]');
const J=plan.JUNCTION,studyMiddle=[(J.x0+J.x1)/2,0,(J.z0+J.z1)/2];
// The three ways side by side: two lines where the slices meet, a tag over
// each slice, and navy behind the quick estimate's slice, whose city is
// numbers.
const slices=$('[data-slices]');
const sliceLines=all('[data-slice-line]');
const sliceTags=Object.fromEntries(all('[data-slice-tag]').map(tag=>[tag.dataset.sliceTag,tag]));
const sliceNight=$('[data-slice-night]');
const fogWas=new THREE.Color(),navy=new THREE.Color('#000b2d');

// The weighed day runs on its own clock while its row is read: the hour
// climbs through the day and holds at midnight a moment before it starts
// again.
const DAY_SPEED=1.6,DAY_LOOP=27;
let dayStart=null,lastRound=0;
const shown={ink:''};
city.run((dt,paused)=>{
  const at=city.readScreens(paused);
  const {quick,day,junction,which,closing}=at;
  const still=reducedMotion.matches,narrow=innerWidth<760,time=hero.time;
  const turn=(closing.slide+(PACE.closing-1)*closing.sub)/PACE.closing,turned=smooth(turn);
  const field=still?0:turned;
  const leaving=1-smooth(turn/.15);

  // ---- 01 The quick estimate: a row for each of its four steps.
  const q=still?finished(quick.sub*4,4):quick.sub*4;
  const quickIn=smooth((quick.slide-.3)/.5)*(1-smooth(day.slide/.5));
  // The destination the arc and the card follow, a new one every two seconds.
  const destination=DESTINATIONS[still?0:Math.floor(time/2.2)%DESTINATIONS.length];
  // Once the car trips are on the roads, the columns and arcs step back.
  const onRoads=smooth((q-3)/.3);
  const quickState={
    columns:quickIn*(1-.65*onRoads),grow:clamp01(q/.9),
    arcs:quickIn*smooth((q-1)/.1)*(1-.85*onRoads),drawn:clamp01((q-1)/.6),split:smooth((q-2)/.5),
    lit:q>=1&&q<2?destination:-1,
    riders:quickIn*smooth((q-1.4)/.2)*(1-onRoads),
    roads:quickIn*onRoads,hour:still?8:5+18*clamp01((q-3.05)/.9),roadLit:q>=3
  };

  // ---- 02 The simulated day: a row for each of its seven steps.
  const d=still?finished(day.sub*7,7):day.sub*7;
  const dayIn=smooth((day.slide-.3)/.5)*(1-smooth(junction.slide/.5));
  // From the weighed day on, each resident's day rises over the city.
  const risen=still?(d>=3?1:0):smooth((d-2.75)/.35);
  const weighingNow=d>=2.75&&d<4&&dayIn>0;
  if(weighingNow&&dayStart===null)dayStart=time;
  if(!weighingNow)dayStart=null;
  const dayHour=still||!weighingNow?24:Math.min(24,((time-dayStart)*DAY_SPEED)%DAY_LOOP);
  // The rounds of learning run with the scroll; the tailbacks shrink as the
  // residents learn.
  const learnt=still?1:clamp01((d-5)/.85);
  const round=d>=5?Math.max(1,Math.min(ROUND_COUNT,1+Math.round((ROUND_COUNT-1)*learnt))):1;
  const dayState={
    doors:dayIn*(1-smooth((d-2)/.25)),home:dayIn*(1-smooth((d-2.75)/.25)),
    plans:dayIn>0&&d>=1&&d<2.75?clamp01((d-1)/.8)*1.1:0,
    route:dayIn*smooth((d-1)/.25)*(1-risen),drawn:clamp01((d-1.1)/.6),
    out:dayIn*smooth((d-2)/.25)*(1-risen),
    tails:dayIn*smooth((d-2)/.25),tail:clamp01((d-2.1)/.6)*(1-.7*(d>=5?learnt:0)),
    threads:dayIn*risen,upTo:d<4?dayHour:24,
    plane:dayIn*risen*(1-smooth((d-4)/.25)),planeHour:dayHour,
    tips:dayIn*risen*(1-smooth((d-4)/.25)),pointed:weighing?.pointed,
    own:dayIn*risen*(1-smooth((d-5)/.25)),
    remembered:dayIn*smooth((d-4)/.25)*(1-smooth((d-5)/.25)),
    income:smooth((d-6)/.3)
  };
  if(round!==lastRound){
    // A round in which residents still try new plans flashes the threads
    // that try something new.
    if(round>lastRound&&round<=STOP_ROUND&&!still&&d>=5)layers.flashRound(round);
    lastRound=round;
  }

  // ---- 03 The junction study: a row for each of its five steps.
  const j=still?finished(junction.sub*5,5):junction.sub*5;
  const studyIn=smooth((junction.slide-.4)/.4);
  const junctionState={
    pen:studyIn,drawn:clamp01(j/.7),
    trails:studyIn*smooth((j-1)/.2),gaps:studyIn*smooth((j-2)/.2),
    signal:studyIn*smooth((j-3)/.2),tailback:studyIn*smooth((j-4)/.2)*(1-smooth(which.slide/.5))
  };

  // ---- 04 Which one: the city in three slices. The quick estimate takes the
  // left, as flowing totals over the number city; the simulated day the
  // middle, as its residents' threads; and the junction study the right, as
  // its vehicles and their trails.
  const u=still?(which.slide>.5?1:0):clamp01((which.slide-.35)/.65);
  const cut2=.64*smooth(u/.6),cut1=.36*smooth((u-.4)/.6);
  // From the moment the three ways' screen starts to arrive, the city is drawn
  // as slices, so the quick estimate and the day, set finished here, never
  // show over the study before their slices open.
  const three=which.slide>0;
  if(three){
    Object.assign(quickState,{columns:1,grow:1,arcs:1,drawn:1,split:1,lit:-1,riders:0,roads:1,hour:8,roadLit:false});
    Object.assign(dayState,{doors:0,home:0,plans:0,route:0,out:0,tails:1,tail:.3,threads:1,upTo:24,plane:1,planeHour:17.5,tips:1,pointed:null,own:0,remembered:0,income:0});
    Object.assign(junctionState,{pen:1,drawn:1,trails:1,gaps:1,signal:1});
  }
  for(const state of [quickState,dayState,junctionState])for(const key of ['columns','arcs','riders','roads','doors','home','route','out','tails','threads','plane','tips','own','remembered','pen','trails','gaps','signal','tailback'])if(key in state)state[key]*=leaving;
  if(leaving<=0)dayState.plans=0;

  // The number skin: the quick estimate works in totals, so the city stays
  // numbers through it and turns real only with the simulated day.
  const real=clamp01((day.slide-.3)/.7);
  const numbered={streets:0,transit:0,people:0,cars:0};
  const parts=still?(day.slide<.5?numbered:undefined):{streets:real,transit:real,people:real,cars:real};

  // The camera: each part takes it over as it slides in, and the threads'
  // view stands back and low to see them rise.
  city.setPose(numbersPose);
  city.mixPose(P.quick,smooth(quick.slide));
  city.mixPose(P.day,smooth(day.slide));
  city.mixPose(P.threads,risen*smooth(day.slide));
  city.mixPose(P.junction,smooth(junction.slide));
  city.mixPose(P.threeWays,smooth(which.slide));
  city.mixPose(numbersPose,turned);
  city.shoot();
  city.live(dt,{paused});
  const dark=city.setDay(null);

  layers.update({quick:quickState,day:dayState,junction:junctionState},paused?0:dt,{paused,still});
  const fog=hero.scene.fog;
  if(three)city.paint({field,parts,night:dark,slices:[
    {to:cut1,parts:numbered,look:()=>{layers.show('quick');if(fog){fogWas.copy(fog.color);fog.color.copy(navy);}}},
    {to:cut2,look:()=>{if(fog)fog.color.copy(fogWas);layers.show('day');}},
    {to:1,look:()=>layers.show('junction')}
  ]});
  else city.paint({field,parts,night:dark});
  layers.show(null);

  // ---- The words and the cards follow.
  for(const [name,list] of Object.entries(stepRows))readRow(list,at[name]);

  // 01: the trips each zone makes over its column, then where they go, how
  // they travel and which roads.
  const estimating=quick.slide>.6&&day.slide<.3;
  write(cards.trips,'data-shown',estimating&&q<1);
  write(cards.gravity,'data-shown',estimating&&q>=1&&q<2);
  write(cards.modes,'data-shown',estimating&&q>=2&&q<3);
  write(cards.roads,'data-shown',estimating&&q>=3);
  const tagged=estimating&&q<2;
  // Every box is read before any tag moves, so the page is laid out once.
  const covers=tagged?[wordsColumn(),(q<1?cards.trips:cards.gravity)?.getBoundingClientRect()]:[];
  const sizes=tagged?zoneTags.map(tag=>({w:tag.offsetWidth,h:tag.offsetHeight})):[];
  zoneTags.forEach((tag,n)=>{
    const i=+tag.dataset.zoneTag,place=layers.zoneTag(i),at=city.project(place);
    city.placeAt(tag,place,tagged&&layers.zoneRisen(i)&&!covers.some(box=>covered(box,at,sizes[n])));
    write(tag,'data-lit',i===LIT_ZONE||(q>=1&&i===destination));
  });
  if(estimating&&q>=1&&q<2){
    const km=ZONE_KM[LIT_ZONE][destination],p=fall.at(km);
    write(fallNow,'cx',p.x.toFixed(1));write(fallNow,'cy',p.y.toFixed(1));
    write(gravityText.to,'text',String(destination+1));
    write(gravityText.km,'text',km.toFixed(1));write(gravityText.kmMath,'text',km.toFixed(1));
    write(gravityText.pull,'text',pull(km).toFixed(2));
  }
  if(estimating&&q>=3){
    const ratio=ratioAt(quickState.hour),p=road.at(Math.min(ROAD_MOST,ratio));
    write(roadNow,'cx',p.x.toFixed(1));write(roadNow,'cy',p.y.toFixed(1));
    write(roadText.clock,'text',clock(quickState.hour));
    write(roadText.cars,'text',grouped(Math.round(ratio*CAPACITY/10)*10));
    write(roadText.slower,'text',String(Math.round((travelTime(ratio)-1)*100)));
  }

  // 02: a card for each of the seven rows.
  const living=day.slide>.6&&junction.slide<.3;
  write(cards.people,'data-shown',living&&d<2);
  write(cards.people,'data-plan',d>=1);
  write(cards.crowd,'data-shown',living&&d>=2&&d<3);
  write(cards.weigh,'data-shown',living&&d>=3&&d<4);
  write(cards.memory,'data-shown',living&&d>=4&&d<5);
  write(cards.rounds,'data-shown',living&&d>=5&&d<6);
  write(cards.results,'data-shown',living&&d>=6);
  if(weighing&&living&&d>=2.75&&d<4)weighing.setHour(dayHour);
  const hourShown=living&&dayState.plane>.5;
  city.placeAt(hourTag,layers.hourTag(),hourShown);
  write(hourTag,'text',clock(dayHour));
  for(const [hour,tag] of Object.entries(axisTags))city.placeAt(tag,layers.axisTag(+hour),hourShown);
  write(roundText,'text',String(round));
  write(roundsLine,'points',roundPoints.slice(0,round).join(' '));
  write(roundsNow,'cx',rounds.x(round).toFixed(1));write(roundsNow,'cy',rounds.y(averageScore(round)).toFixed(1));
  badges.forEach(badge=>write(badge,'data-on',round>=ROUND_COUNT));

  // 03: the veil round the study's stretch and its pin, then a card for each
  // of the rows that has one, and the longest tailback.
  const studying=junction.slide>.6&&which.slide<.4;
  city.placeAt(veil,studyMiddle,studying);
  city.placePin('junctionStudy',studying&&j>=.7);
  city.placePin('longestTailback',studying&&j>=4.2&&layers.longest()>.5);
  write(cards.speed,'data-shown',studying&&j>=1&&j<2);
  write(cards.gap,'data-shown',studying&&j>=2&&j<3);
  write(cards.signals,'data-shown',studying&&j>=3);
  if(studying&&j>=2&&j<3){
    // Closing from 35 m to the least gap it keeps over seven seconds, then
    // standing a second behind it.
    const phase=still?1:(time%8)/7,gap=still?9:phase>=1?MIN_GAP:35-(35-MIN_GAP)*smooth(phase);
    const front=LEADER_X-gap*PX_PER_M;
    write(gapParts.follower,'x',(front-CAR_W).toFixed(1));
    write(gapParts.bracket,'d',`M${front.toFixed(1)},9v7M${LEADER_X},9v7M${front.toFixed(1)},12.5H${LEADER_X}`);
    const p=safe.at(gap);
    write(gapParts.now,'cx',p.x.toFixed(1));write(gapParts.now,'cy',p.y.toFixed(1));
    write(gapParts.gap,'text',gap>=10?String(Math.round(gap)):gap.toFixed(1));
    write(gapParts.speed,'text',String(Math.round(safeSpeed(gap)*3.6)));
    write(cards.gap,'data-limit',safeSpeed(gap)>=LIMIT-.01);
  }
  if(studying&&j>=3){
    // The cycle's hand and the trace's line go round together, ten seconds
    // of the cycle a second.
    const t=still?45:(time*10)%CYCLE;
    write(hand,'transform',`rotate(${(t/CYCLE*360).toFixed(1)} 40 40)`);
    const x=trace.X(t).toFixed(1);
    write(traceNow,'x1',x);write(traceNow,'x2',x);
  }

  // 04: the lines where the slices meet, the tags over them and the navy
  // behind the first slice, until the city turns back into numbers.
  const sliced=which.slide>.5&&turn<.05;
  write(slices,'--cut1',(cut1*100).toFixed(2)+'%');
  write(slices,'--cut2',(cut2*100).toFixed(2)+'%');
  write(slices,'data-shown',sliced);
  write(sliceNight,'--cut1',(cut1*100).toFixed(2)+'%');
  write(sliceNight,'data-shown',three&&cut1>.001&&turn<1);
  sliceLines.forEach((line,i)=>write(line,'data-shown',[cut1,cut2][i]>.005));
  // A tag stands once its slice is wide enough to hold it.
  const room=narrow?96:150;
  write(sliceTags.quick,'data-shown',sliced&&cut1*innerWidth>room);
  write(sliceTags.day,'data-shown',sliced&&(cut2-cut1)*innerWidth>room);
  write(sliceTags.junction,'data-shown',sliced&&(1-cut2)*innerWidth>room);

  // The header's words are white while the city is numbers. With less
  // movement the city never turns, and the solid navy of the first screens
  // and the last stands in for it.
  const wash=Math.max(field,parts?1-parts.streets:0);
  const ink=(still?day.slide<.5||closing.slide>.55:wash>.45)?'light':'dark';
  if(ink!==shown.ink){shown.ink=ink;document.body.dataset.stageInk=ink;}
  hero.canvas.dataset.screen=['closing','which','junction','day','quick'].find(name=>at[name].slide>.5)||'intro';
  hero.canvas.dataset.numbers=wash.toFixed(4);
  hero.canvas.dataset.hour=quickState.hour.toFixed(2);
  hero.canvas.dataset.day=dayHour.toFixed(2);
  hero.canvas.dataset.round=String(round);
  hero.canvas.dataset.slices=`${cut1.toFixed(4)} ${cut2.toFixed(4)}`;
});
