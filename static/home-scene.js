import { createOneCity, smooth } from './one-city.js?v=93d1433f0575';

// The homepage is one city. It is fixed to the screen and the page's five
// screens of words scroll over it; the scroll moves the camera, closes a
// street, adds a tram and prices the parking, tours six places, splits the
// city into today and the proposal, and pulls back as the city turns into
// numbers under the closing words. The city itself is one-city.js, which How
// it works and Platform stand on too; this file is the homepage's screens and
// camera.

// How slowly the drawn scroll follows the real one; smaller settles later.
const GLIDE=5;
const city=createOneCity({glide:GLIDE});
const {hero,reducedMotion,poses:P,weights}=city;

// ---- The five screens and where the camera stands for each ---------------
const heroPose=P.hero;
const rowPoses={streets:P.streets,transit:P.transit,growth:P.growth};
const outcomeKeys=['mobility','congestion','transit','parking','emissions','accessibility'];
// The pace of the page, in one place: how many screens of scrolling each tall
// section takes past the one in which its words arrive, how many each
// consequence close-up takes, the share of that scroll the camera holds still
// before it flies to the next, and whether the page rests at each close-up. A
// rest sits three quarters of the way through the held share: the page settles
// on a still camera, and the pull toward the first rest begins inside the
// consequences, never on the proposal above them. The closing's extra screens
// carry the turn to numbers, so that turn is no longer over in the one screen
// its words take to arrive.
const PACE={proposal:5,comparison:3,closing:4,screens:2,hold:.55,rests:true};
// Each close-up looks at the thing its sentence names, and the audit checks
// that nothing tall stands between that thing and its camera.
const outcomePoses={
  mobility:P.mobility,congestion:P.congestion,transit:P.transitStop,
  parking:P.parking,emissions:P.emissions,accessibility:P.accessibility
};
const comparisonPose=P.comparison;
const closingPose=P.closing;

const rows=[...document.querySelectorAll('[data-camera-place]')];
const rail=[...document.querySelectorAll('[data-outcome]')];
const outcomeCopy=[...document.querySelectorAll('[data-outcome-copy]')];
const outcomesScreen=document.querySelector('.screen[data-screen="outcomes"]');
outcomesScreen.style.setProperty('--outcome-screens',String(PACE.screens));
for(const element of document.querySelectorAll('.screen'))if(element.dataset.screen in PACE)element.style.setProperty('--screens',String(PACE[element.dataset.screen]));
// The resting points are the scene's own and not the browser's. A browser's
// snapping pulls a single notch of a mouse wheel straight back to the rest it
// left, so a slow reader never gets away, and it lets a wheel flick run past
// every rest. Here a rest never pulls back somebody who is moving away from
// it, a scroll that ends within REST_REACH of a rest settles onto it, and a
// wheel or trackpad flick that would pass a rest is taken to it and held there
// until the flick has died down, or REST_HOLD at the longest.
// A phone's flick is its own momentum, which no script can stop part way: it
// ran past the next close-up and the page then drifted back up to it. So where
// the screen is worked by a finger, the scene's rests stand aside and the
// browser's snapping takes over, only while the page rests among the
// close-ups: every flick or drag there comes to rest on the next close-up in
// its direction. Two more stops, the proposal's last view above the first
// close-up and the comparison's arrival below the last, let a reader out; once
// the page rests on either, the snapping is off and the page scrolls freely.
const REST_REACH=.3,REST_HOLD=900,REST_GAP=160;
const fingers=matchMedia('(pointer: coarse)');
const restTops=()=>{
  const box=outcomesScreen.getBoundingClientRect(),span=(box.height-innerHeight)/outcomeKeys.length;
  return outcomeKeys.map((key,i)=>Math.round(box.top+scrollY+(i+PACE.hold*.75)*span));
};
const moving=()=>PACE.rests&&!reducedMotion.matches&&document.documentElement.dataset.motion==='on';
const resting=()=>moving()&&!fingers.matches;
const snapping=()=>moving()&&fingers.matches;
if(PACE.rests){
  const marks=[...outcomeKeys,'above','below'].map(()=>{
    const mark=document.createElement('i');
    mark.className='rest-mark';mark.setAttribute('aria-hidden','true');
    outcomesScreen.append(mark);return mark;
  });
  const say=()=>{
    const tops=restTops(),box=outcomesScreen.getBoundingClientRect(),top=box.top+scrollY;
    outcomesScreen.dataset.rests=tops.join(' ');
    // A snap point comes to rest under the page's scroll padding, so each
    // mark stands that far below its stop.
    const padding=parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)||0;
    [...tops,top-innerHeight,top+box.height].forEach((stop,i)=>{marks[i].style.top=(stop-top+padding)+'px';});
  };
  // Where a finger's scroll came to rest: among the close-ups the snapping
  // comes on, and a page it caught between two of them goes to the nearer.
  const place=()=>{
    if(!snapping()){document.documentElement.removeAttribute('data-snap-rests');return;}
    if(touching)return;
    const tops=restTops(),among=scrollY>=tops[0]-2&&scrollY<=tops.at(-1)+2;
    if(among===document.documentElement.hasAttribute('data-snap-rests'))return;
    document.documentElement.toggleAttribute('data-snap-rests',among);
    const near=tops.reduce((best,top)=>Math.abs(top-scrollY)<Math.abs(best-scrollY)?top:best);
    if(among&&Math.abs(near-scrollY)>=2)scrollTo({top:near,behavior:'smooth'});
  };
  const change=()=>{say();place();};
  addEventListener('resize',say,{passive:true});
  reducedMotion.addEventListener('change',change);fingers.addEventListener('change',change);
  let left=-1,way=0,seenY=scrollY,movedAt=0,touching=false,idle=0;
  let aim=0,from=0,lastWheel=-1e9,caught=-1e9,held=false;
  const settle=()=>{
    if(!resting())return;
    // A hold ends by the clock even when no further push arrives to end it.
    if(held&&performance.now()-caught>REST_HOLD)held=false;
    const tops=restTops(),reach=REST_REACH*(tops[1]-tops[0]);
    const near=tops.reduce((best,top)=>Math.abs(top-scrollY)<Math.abs(best-scrollY)?top:best);
    const off=scrollY-near;
    if(Math.abs(off)<2){left=near;return;}
    if(touching||held||Math.abs(off)>reach)return;
    if(near===left&&Math.sign(off)===way)return;
    scrollTo({top:near,behavior:'smooth'});
  };
  const ended=()=>{settle();place();};
  change();
  addEventListener('scroll',()=>{
    movedAt=performance.now();
    if(scrollY!==seenY){way=Math.sign(scrollY-seenY);seenY=scrollY;}
    if(!('onscrollend' in window)){clearTimeout(idle);idle=setTimeout(ended,200);}
  },{passive:true});
  addEventListener('scrollend',ended,{passive:true});
  addEventListener('touchstart',()=>{touching=true;},{passive:true});
  // A lifted finger whose flick is still running is settled when the flick
  // ends, and not part way through it.
  const lifted=()=>{touching=false;clearTimeout(idle);idle=setTimeout(()=>{if(performance.now()-movedAt>150)ended();},200);};
  addEventListener('touchend',lifted,{passive:true});addEventListener('touchcancel',lifted,{passive:true});
  addEventListener('wheel',event=>{
    if(!resting()||event.ctrlKey||!event.deltaY)return;
    const now=event.timeStamp;
    if(held){
      if(now-lastWheel<REST_GAP&&now-caught<REST_HOLD){lastWheel=now;event.preventDefault();return;}
      held=false;lastWheel=-1e9;
    }
    if(now-lastWheel>REST_GAP){from=scrollY;aim=scrollY;}
    lastWheel=now;
    aim+=event.deltaY*(event.deltaMode===1?40:event.deltaMode===2?innerHeight:1);
    const going=Math.sign(aim-from);
    if(!going)return;
    const tops=going>0?restTops():restTops().reverse();
    const stop=tops.find(top=>(top-from)*going>8&&(aim-top)*going>0);
    if(stop===undefined)return;
    event.preventDefault();held=true;caught=now;
    scrollTo({top:stop,behavior:'smooth'});
  },{passive:false});
}

const rowWeight=(sub,start)=>smooth((sub-start)/.14);
let shown={row:'',outcome:'',ink:''};
city.run((dt,paused)=>{
  const at=city.readScreens(paused);
  const proposal=at.proposal,outcomes=at.outcomes,comparison=at.comparison,closing=at.closing;
  // The closing's turn to numbers: one part of it while its words arrive,
  // the rest over the screens the words stay pinned for.
  const turn=(closing.slide+(PACE.closing-1)*closing.sub)/PACE.closing,turned=smooth(turn);
  // The proposal's rows, read in turn; each change stays once its row is read.
  const sub=proposal.sub*proposal.slide;
  weights.street=rowWeight(sub,.04);weights.transit=rowWeight(sub,.37);weights.growth=rowWeight(sub,.7);
  city.applyProposal(weights);
  const row=sub<.37?'streets':sub<.7?'transit':'growth';
  // The six outcomes, one after another down the list.
  const place=Math.min(5,Math.floor(outcomes.sub*6)),within=outcomes.sub*6-place;
  const outcome=outcomeKeys[place],nextOutcome=outcomeKeys[Math.min(5,place+1)];
  const step=smooth((within-PACE.hold)/(1-PACE.hold));
  // The rings of reach belong to their close-up and leave with it.
  city.showReach(outcome==='accessibility'&&outcomes.slide>.5&&comparison.slide<.5);
  city.showModes(outcome==='mobility'&&outcomes.slide>.5&&proposal.slide>.9);
  // The camera: each screen takes it over as it slides in.
  city.setPose(heroPose);
  const [toTransit,toGrowth]=[smooth((sub-.3)/.12),smooth((sub-.63)/.12)];
  const proposalPose=city.blendPoses([rowPoses.streets,rowPoses.transit,rowPoses.growth],[1-toTransit,toTransit*(1-toGrowth),toTransit*toGrowth]);
  city.mixPose(proposalPose,smooth(proposal.slide));
  city.mixPose(city.blendPoses([outcomePoses[outcome],outcomePoses[nextOutcome]],[1-step,step]),smooth(outcomes.slide));
  city.mixPose(comparisonPose,smooth(comparison.slide));
  city.mixPose(closingPose,turned);
  city.shoot();
  // The streets move on by the time that passed. While the reader looks at
  // the tram stop, a tram hurries to it and stands a little longer.
  city.live(dt,{paused,nearStop:outcome==='transit'&&outcomes.slide>.5,quietExhaust:outcome==='parking'&&outcomes.slide>.5});

  // The split, the numbers and the wash. The split opens over the first
  // part of the comparison's pinned screen, once its words stand still, and
  // closes as the closing begins its turn.
  const opened=smooth(comparison.sub/.6)*smooth(comparison.slide)*(1-smooth(turn/.1));
  const field=reducedMotion.matches?0:turned;
  const cut=city.paint({field,opened});
  // The words follow: which row, which outcome, which pins, which ink.
  if(row!==shown.row){shown.row=row;city.mark(rows,'cameraPlace',row);hero.host.dataset.choice=row;}
  if(outcome!==shown.outcome){shown.outcome=outcome;city.mark(rail,'outcome',outcome);city.mark(outcomeCopy,'outcomeCopy',outcome);}
  // A wide screen keeps every pin of a row already read; a narrow one has
  // room for the pin of the row being read.
  const inProposal=proposal.slide>.6&&outcomes.slide<.4,narrow=innerWidth<760;
  city.placePin('streets',inProposal&&weights.street>.5&&(!narrow||row==='streets'));
  city.placePin('transit',inProposal&&weights.transit>.5&&(!narrow||row==='transit'));
  city.placePin('growth',inProposal&&weights.growth>.5&&(!narrow||row==='growth'));
  city.placePin('congestion',outcome==='congestion'&&outcomes.slide>.6&&comparison.slide<.4&&within>.15);
  // The header's words go white once the city under them has half turned;
  // with less movement the city never turns, and the closing's solid navy
  // stands in for it.
  const ink=(reducedMotion.matches?closing.slide>.55:turned>.45)?'light':'dark';
  if(ink!==shown.ink){shown.ink=ink;document.body.dataset.stageInk=ink;}
  hero.canvas.dataset.screen=closing.slide>.5?'closing':comparison.slide>.5?'comparison':outcomes.slide>.5?'outcomes':proposal.slide>.5?'proposal':'hero';
  hero.canvas.dataset.numbers=field.toFixed(4);
  hero.canvas.dataset.split=cut.toFixed(4);
});
