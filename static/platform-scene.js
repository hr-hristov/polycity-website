import { createOneCity, smooth, clamp01 } from './one-city.js?v=a34a2d176474';

// Platform stands on the homepage's city and walks it past what the product
// holds:
//   01 the ten kinds of change, the camera gliding from one part of the city to
//      the next while the rows are read, and the street, the tram and the
//      parking taking effect as the rows that name them are reached;
//   02 the map from above, tipping slowly while the timings are read;
//   03 the map again, lifting towards the city, for the sets of results;
//   04 the split, today beside the proposal, opening across the whole screen;
//   05 the whole city drawing back while the files a run makes are listed;
//   06 a step back for the two ways to run, then the turn to numbers.
const city=createOneCity({glide:5});
const {hero,reducedMotion,poses:P,weights}=city;

// How many screens of scrolling each tall section takes, the screen its words
// arrive in included. Every row that is read one at a time gets about two
// thirds of a screen, so no row passes too fast to read and no screen stands
// still for long after its last row. The short sections at the foot went past
// fastest of all, so they gained the most.
const PACE={changes:8,timing:5.5,results:6,compare:4,take:3.5,ways:3.5,closing:4};
for(const element of document.querySelectorAll('.screen'))if(element.dataset.screen in PACE)element.style.setProperty('--screens',String(PACE[element.dataset.screen]));

// Where the camera stands for each kind of change. Most stands are shared by
// two kinds, so the camera glides five times across the section rather than
// jumping ten, and each glide has a whole row of scrolling to make.
const groupPoses=[P.streets,P.streets,P.parking,P.parking,P.transitStop,P.mobility,P.growth,P.growth,P.day,P.day];
const timingPose=P.map;
const resultsPose=P.resultsMap;
const takePose=P.day;
const waysPose={...P.hero,dx:-4.5,dy:.4};
const closingPose=P.closing;
// Which kind of change brings which part of the proposal into the city.
const CHANGE_AT={street:0,transit:4,growth:6};
// The names of the sections with their own scroll, latest first, so the one the
// reader is on is the first that has slid in.
const SECTIONS=['closing','ways','take','compare','results','timing','changes'];

// The same stand with more or less city across the frame, for a screen whose
// camera eases back while its rows are read rather than holding one picture.
const zoomed=(p,k)=>({...p,span:p.span*k,phone:(p.phone??p.span*.8)*k});

const all=selector=>[...document.querySelectorAll(selector)];
// Every value the scene writes into the page is written only when it changes.
const written=new WeakMap();
function write(element,name,value){
  if(!element)return;
  let seen=written.get(element);if(!seen){seen={};written.set(element,seen);}
  if(seen[name]===value)return;seen[name]=value;
  if(name==='text')element.textContent=value;
  else if(typeof value==='boolean')element.toggleAttribute(name,value);
  else element.setAttribute(name,value);
}
// The rows of a section are read one after another as its scroll runs; the row
// being read stands out. A section the reader has scrolled past marks nothing,
// so the page never leaves six rows lit at once behind them.
const rowOf=(at,count)=>at.slide>.5?Math.min(count-1,Math.floor(at.sub*count)):-1;
function readRow(list,at,on){
  const current=on?rowOf(at,list.length):-1;
  list.forEach((row,i)=>write(row,'data-current',i===current));
  return current;
}

const groupRows=all('[data-group-row]');
// The examples of the kind being read: one line under the list, so the ten
// kinds keep their places however long the examples are.
const groupExamples=groupRows.map(row=>row.querySelector('em')?.textContent||'');
const examplesLine=document.querySelector('[data-examples]');
const timingRows=all('.screen[data-screen="timing"] [data-step-row]');
const goalRows=all('[data-goal-row]');
const compareColumns=all('.screen[data-screen="compare"] .three>div');
const wayColumns=all('.screen[data-screen="ways"] .three>div');

const shown={ink:''};
city.run((dt,paused)=>{
  const at=city.readScreens(paused);
  const {changes,timing,results,compare,take,ways,closing}=at;
  const still=reducedMotion.matches,narrow=innerWidth<760;
  const front=SECTIONS.find(name=>at[name].slide>.5)||'hero';
  const turn=(closing.slide+(PACE.closing-1)*closing.sub)/PACE.closing,turned=smooth(turn);
  const field=still?0:turned;

  // ---- 01 The ten kinds of change. The camera eases from the stand of the
  // kind being read to the stand of the next one across that kind's whole
  // share of the scroll, so it is always gliding and never lurching.
  const count=groupPoses.length;
  const g=changes.sub*count,kind=Math.min(count-1,Math.floor(g)),within=clamp01(g-kind);
  const step=smooth((within-.1)/.8);
  const nextKind=Math.min(count-1,kind+1);
  // The proposal arrives as the kinds that carry it are read, and stays.
  for(const [name,row] of Object.entries(CHANGE_AT))weights[name]=still?(changes.slide>.5?1:0):smooth((g-row-.25)/.35);
  city.applyProposal(weights);
  // The rings of reach belong to the last kind, and leave with the section.
  city.showReach(kind===9&&front==='changes');
  city.showModes(kind===5&&front==='changes');

  // ---- 04 The split keeps opening the whole way down the comparison, rather
  // than standing open over two screens of unchanging city, and closes as the
  // closing begins its turn.
  const opened=(still?1:smooth(compare.sub*1.25))*smooth(compare.slide)*(1-smooth(turn/.1));

  // The camera: each section takes it over as it slides in, and keeps easing
  // back while its rows are read, so no screen holds one picture for its whole
  // scroll. The comparison needs none, because its split is sliding.
  const ease=(sub,by)=>1+(still?0:smooth(sub)*by);
  city.setPose(P.hero);
  city.mixPose(city.blendPoses([groupPoses[kind],groupPoses[nextKind]],[1-step,step]),smooth(changes.slide));
  city.mixPose(zoomed(timingPose,ease(timing.sub,.16)),smooth(timing.slide));
  city.mixPose(zoomed(resultsPose,ease(results.sub,.18)),smooth(results.slide));
  city.mixPose(P.comparison,smooth(compare.slide));
  city.mixPose(zoomed(takePose,ease(take.sub,.22)),smooth(take.slide));
  city.mixPose(zoomed(waysPose,ease(ways.sub,.14)),smooth(ways.slide));
  city.mixPose(closingPose,turned);
  city.shoot();
  city.live(dt,{paused,nearStop:kind===4&&front==='changes',quietExhaust:kind===2&&front==='changes'});
  const cut=city.paint({field,opened});

  // ---- The words follow: the row being read in the section the reader is on.
  const lit=readRow(groupRows,changes,front==='changes');
  write(examplesLine,'text',lit>=0?groupExamples[lit]:'');
  readRow(timingRows,timing,front==='timing');
  readRow(goalRows,results,front==='results');
  readRow(compareColumns,compare,front==='compare');
  readRow(wayColumns,ways,front==='ways');

  // A pin stands by the change a kind brought, while that kind is read. A
  // narrow screen has room for one at a time.
  const naming=front==='changes'&&changes.slide>.6;
  city.placePin('streets',naming&&weights.street>.5&&(!narrow||kind<4));
  city.placePin('transit',naming&&weights.transit>.5&&(!narrow||(kind>=4&&kind<6)));
  city.placePin('growth',naming&&weights.growth>.5&&(!narrow||kind>=6));

  // The header's words go white once the city under them has half turned.
  const ink=(still?closing.slide>.55:turned>.45)?'light':'dark';
  if(ink!==shown.ink){shown.ink=ink;document.body.dataset.stageInk=ink;}
  hero.canvas.dataset.screen=front;
  hero.canvas.dataset.numbers=field.toFixed(4);
  hero.canvas.dataset.split=cut.toFixed(4);
});
