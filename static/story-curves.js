// The Technical page's charts, each drawn from the rule the product runs, so
// the picture beside a formula is that formula at work. Every function returns
// SVG path data or numbers for the page's own <svg> elements; nothing here
// touches the page.

// ---- The quick estimate --------------------------------------------------------
// Where they go: the further apart two zones are, the fewer trips. The product
// weighs every pair of zones by e^(−β·d), with d the straight-line kilometres
// between them and β = 0.12 a kilometre, and balances the table so every
// zone's trips out and trips in add up (Furness, up to 500 passes, to 1e-6).
export const BETA=.12;
export const pull=km=>Math.exp(-BETA*km);
// The invented city's scale: its board is about ten kilometres across.
export const KM_PER_UNIT=.39;
export function tripTable(zones,made,{passes=500,tolerance=1e-6}={}){
  const n=zones.length;
  const km=zones.map(a=>zones.map(b=>a===b?.5:Math.hypot(a.x-b.x,a.z-b.z)*KM_PER_UNIT));
  const weight=km.map(row=>row.map(pull));
  // Trips arriving are taken as trips leaving: over a day every trip out comes back.
  const out=made,into=made;
  const A=new Array(n).fill(1),B=new Array(n).fill(1);
  for(let pass=0;pass<passes;pass++){
    let moved=0;
    for(let i=0;i<n;i++){let s=0;for(let j=0;j<n;j++)s+=B[j]*into[j]*weight[i][j];const next=1/s;moved=Math.max(moved,Math.abs(next-A[i])/next);A[i]=next;}
    for(let j=0;j<n;j++){let s=0;for(let i=0;i<n;i++)s+=A[i]*out[i]*weight[i][j];const next=1/s;moved=Math.max(moved,Math.abs(next-B[j])/next);B[j]=next;}
    if(moved<tolerance)break;
  }
  const trips=km.map((row,i)=>row.map((_,j)=>A[i]*out[i]*B[j]*into[j]*weight[i][j]));
  return {km,trips};
}
// The pull of distance as a curve, 0 to 16 km, in a box w by h.
export function pullCurve(w,h,{top=4,left=5,bottom=4,most=16}={}){
  const x=km=>left+km/most*(w-left-2),y=v=>top+(1-v)*(h-top-bottom);
  const points=[];for(let km=0;km<=most;km+=.5)points.push(`${x(km).toFixed(1)},${y(pull(km)).toFixed(1)}`);
  return {points:points.join(' '),at:km=>({x:x(km),y:y(pull(km))})};
}

// Which roads: a road near full slows sharply. The product's road loading
// uses t = t0·(1 + 0.15·(v/c)^4).
export const travelTime=ratio=>1+.15*ratio**4;
export function roadCurve(w,h,{most=1.5}={}){
  // Up the box: from an empty road to twice as slow.
  const x=ratio=>ratio/most*w,y=slow=>h-2-(slow-1)/1*(h-4);
  const points=[];for(let r=0;r<=most+1e-9;r+=.05)points.push(`${x(r).toFixed(1)},${y(travelTime(r)).toFixed(1)}`);
  return {points:points.join(' '),full:x(1),at:ratio=>({x:x(ratio),y:y(travelTime(ratio))})};
}

// ---- The simulated day: the rounds of learning ----------------------------------
// An illustration of one run of thirty rounds: the average score climbs as the
// residents find better days, and once new plans stop, after 80 % of the
// rounds, everyone keeps their best and it steps up once more and settles.
export const ROUND_COUNT=30,NEW_PLANS_STOP=.8;
export function averageScore(round){
  const stop=ROUND_COUNT*NEW_PLANS_STOP;
  const climb=96-58*Math.exp(-(round-1)/3.1);
  return round<=stop?climb:climb+2.6*(1-Math.exp(-(round-stop)/1.2));
}
export function roundsChart(w,h,{left=20,right=6,top=14,bottom=20}={}){
  const x=round=>left+(round-1)/(ROUND_COUNT-1)*(w-left-right);
  const low=36,high=102,y=score=>top+(high-score)/(high-low)*(h-top-bottom);
  const points=[];for(let r=1;r<=ROUND_COUNT;r++)points.push(`${x(r).toFixed(1)},${y(averageScore(r)).toFixed(1)}`);
  // The settling check reads the last tenth of the rounds.
  const tenth=ROUND_COUNT-Math.max(1,Math.round(ROUND_COUNT/10));
  return {points:points.join(' '),x,y,stop:x(ROUND_COUNT*NEW_PLANS_STOP),tenth:x(tenth+.5),end:{x:x(ROUND_COUNT),y:y(averageScore(ROUND_COUNT))}};
}

// ---- The junction study ---------------------------------------------------------
// Keeps its distance: each car's safe speed behind the car ahead, the rule the
// product's car-following runs, vs = vl + (g − vl·τ)/(v̄/b + τ), with a
// reaction time τ of one second, braking b of 4.5 m/s² and v̄ the two cars'
// mean speed. Behind a standing car vl = 0 and v̄ = vs/2, which solves to
// vs = b·(−τ + √(τ² + 2g/b)).
export const TAU=1,BRAKE=4.5,MIN_GAP=2.5,LIMIT=50/3.6;
export const safeSpeed=gap=>Math.min(LIMIT,BRAKE*(-TAU+Math.sqrt(TAU*TAU+2*Math.max(0,gap)/BRAKE)));
export function safeCurve(w,h,{most=40,left=4,right=4,top=8,bottom=4}={}){
  const x=gap=>left+Math.min(gap,most)/most*(w-left-right),y=speed=>h-bottom-speed/LIMIT*(h-top-bottom);
  const points=[];for(let g=0;g<=most+1e-9;g+=.5)points.push(`${x(g).toFixed(1)},${y(safeSpeed(g)).toFixed(1)}`);
  return {points:points.join(' '),limit:y(LIMIT),x,y,at:gap=>({x:x(gap),y:y(safeSpeed(gap))})};
}

// Signals and give way: the product's signal plan gives each street its share
// of the green in a 90-second cycle, in step with the cars a lane on each
// street's busiest lane: g1 = clip(80·q1/(q1 + q2), 15, 65), with 3 s of amber
// and 2 s of all-red.
export const CYCLE=90,GREEN=80,AMBER=3,ALL_RED=2,MIN_GREEN=15,MAX_GREEN=65;
export const greenSplit=(q1,q2)=>{const g=Math.min(MAX_GREEN,Math.max(MIN_GREEN,Math.round(GREEN*q1/(q1+q2))));return [g,GREEN-g];};
// The main road's phases over one cycle, in seconds from its start: red while
// the side street has its green, then green, then amber.
export function mainPhases(q1,q2){
  const [main,side]=greenSplit(q1,q2);
  const red=ALL_RED+side+AMBER+ALL_RED;
  return {main,side,red,phases:[{kind:'red',from:0,to:red},{kind:'green',from:red,to:red+main},{kind:'amber',from:red+main,to:CYCLE}]};
}
// One cycle at the main road's stop line as distance against seconds. Cars
// arrive every five seconds at 50 km/h, stand in line 7 m apart while the
// light is red, and pull away at 2.6 m/s² one and a half seconds after the
// car ahead. Each car's path is split into moving, standing and pulling away.
export function signalTrace(q1,q2,{w=300,h=178,left=24,right=8,top=24,metres=100,after=36}={}){
  const {phases,red}=mainPhases(q1,q2);
  const perSecond=(w-left-right)/CYCLE;
  const stopY=top+after,perMetre=(h-stopY-20)/metres;
  const X=t=>left+t*perSecond,Y=m=>stopY+m*perMetre;
  const clampT=t=>Math.min(CYCLE,Math.max(0,t));
  const v0=LIMIT,accel=2.6,spacing=7,react=1.5,firstAway=red+2;
  const moving=[],standing=[],away=[];let formed=null,cleared=null;
  // Each car's path, in parts.
  for(let k=0;k<24;k++){
    const arrive=-5.2+5*k,spot=1+spacing*k,depart=firstAway+react*k;
    const reach=arrive+(metres-spot)/v0;
    const path=[];
    if(reach<depart){
      // Joins the line: in, stands, pulls away.
      path.push(['moving',{t:arrive,m:metres},{t:reach,m:spot}]);
      path.push(['standing',{t:reach,m:spot},{t:depart,m:spot}]);
      const tUp=v0/accel,up=v0*v0/(2*accel);
      const steps=10;for(let i=0;i<steps;i++){const a=i/steps*tUp,b=(i+1)/steps*tUp;path.push(['away',{t:depart+a,m:spot-accel*a*a/2},{t:depart+b,m:spot-accel*b*b/2}]);}
      path.push(['moving',{t:depart+tUp,m:spot-up},{t:depart+tUp+(spot-up+after)/v0,m:-after}]);
      if(!formed)formed={t:reach,m:spot};formed.last={t:reach,m:spot};
      cleared??={t:depart,m:spot};cleared.last={t:depart,m:spot};
    }
    else path.push(['moving',{t:arrive,m:metres},{t:arrive+(metres+after)/v0,m:-after}]);
    for(const [kind,a,b] of path){
      // Keep each part inside the cycle.
      const cut=(p,q,t)=>({t,m:p.m+(q.m-p.m)*(t-p.t)/(q.t-p.t)});
      let p=a,q=b;
      if(q.t<=0||p.t>=CYCLE)continue;
      if(p.t<0)p=cut(a,b,0);if(q.t>CYCLE)q=cut(a,b,CYCLE);
      ({moving,standing,away})[kind].push([p,q]);
    }
  }
  const d=list=>list.map(([p,q])=>`M${X(p.t).toFixed(1)},${Y(p.m).toFixed(1)}L${X(q.t).toFixed(1)},${Y(q.m).toFixed(1)}`).join('');
  // The line forms from the stop line back, and clears the same way.
  const wedge=formed?[formed,formed.last,{t:cleared.last.t,m:cleared.last.m},cleared].map(p=>`${X(clampT(p.t)).toFixed(1)},${Y(p.m).toFixed(1)}`).join(' '):'';
  const stripBars=phases.map(p=>({kind:p.kind,x:X(p.from),w:X(p.to)-X(p.from)}));
  return {moving:d(moving),standing:d(standing),away:d(away),wedge,
    forming:formed?`M${X(formed.t).toFixed(1)},${Y(formed.m).toFixed(1)}L${X(formed.last.t).toFixed(1)},${Y(formed.last.m).toFixed(1)}`:'',
    clearing:cleared?`M${X(cleared.t).toFixed(1)},${Y(cleared.m).toFixed(1)}L${X(cleared.last.t).toFixed(1)},${Y(cleared.last.m).toFixed(1)}`:'',
    strip:stripBars,stopY,X,Y,top,bottom:h-20,left,right:w-right};
}
