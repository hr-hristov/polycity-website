// One resident's day, weighed the way the simulated day weighs every
// resident's: hours at a place earn points, hours travelling and money spent
// cost them. The card on the Technical page shows this day, and every number
// on it is worked out here from the weights below; none is typed into the page.
//
// S = Σa β·t*a·ln(ta/t0) + Σk (Cm + βm·tk + βc·ck), with t0 = t*a/e, so a stay
// of its usual length earns β·t*a and a longer one earns a little more.

// An hour at a place, and each place's usual hours.
export const AT_PLACE=6;
export const USUAL={home:12,work:8,shop:1};
// The day: at work from eight for eight and a half hours, then an hour at a
// shop, then home. Three trips: home to work, work to the shop, the shop home.
const AT_WORK=8,WORK_HOURS=8.5,SHOP_HOURS=1;
// Each trip's length along the streets, and in a straight line for walking.
export const TRIP_KM=[9,3,3.5];
const STRAIGHT_M=[8680,2890,3380];
// An hour travelling by each way, a public transport trip's own cost, and
// the money a kilometre costs by car or public transport.
export const WAYS={
  car:{perHour:-12,perTrip:0,perKm:-.2,minutes:[25,10,12]},
  transit:{perHour:-12,perTrip:-1,perKm:-.2,minutes:[40,18,20]},
  bike:{perHour:-18,perTrip:0,perKm:0,minutes:TRIP_KM.map(km=>km*1000/4.17/60)},
  foot:{perHour:-24,perTrip:0,perKm:0,minutes:STRAIGHT_M.map(m=>m/1.34/60)}
};
// The day the resident kept, and the other four they remember.
export const REMEMBERED=[
  {key:'car',way:'car'},
  {key:'route',way:'car',minutes:[30,10,12],km:[9.5,3,3.5]},
  {key:'bike',way:'bike'},
  {key:'transit',way:'transit'},
  {key:'foot',way:'foot'}
];

const stay=(place,hours)=>AT_PLACE*USUAL[place]*(Math.log(hours/USUAL[place])+1);

// Weighs the day by one way of travelling. Returns every part the card shows:
// when each stay and trip starts and ends, what each earns or costs, and the
// totals.
export function weigh(way,{minutes=WAYS[way].minutes,km=TRIP_KM}={}){
  const w=WAYS[way],hours=minutes.map(m=>m/60);
  const leave=AT_WORK-hours[0];
  const workEnd=AT_WORK+WORK_HOURS,atShop=workEnd+hours[1],shopEnd=atShop+SHOP_HOURS,atHome=shopEnd+hours[2];
  // The evening at home and the morning before leaving are one stay.
  const home=stay('home',leave+24-atHome),work=stay('work',WORK_HOURS),shop=stay('shop',SHOP_HOURS);
  const trips=hours.map((h,i)=>w.perTrip+w.perHour*h+w.perKm*km[i]);
  const parts=[
    {kind:'place',place:'home',from:0,to:leave},
    {kind:'trip',trip:0,from:leave,to:AT_WORK},
    {kind:'place',place:'work',from:AT_WORK,to:workEnd},
    {kind:'trip',trip:1,from:workEnd,to:atShop},
    {kind:'place',place:'shop',from:atShop,to:shopEnd},
    {kind:'trip',trip:2,from:shopEnd,to:atHome},
    {kind:'place',place:'home',from:atHome,to:24}
  ];
  const places=home+work+shop,travel=trips.reduce((a,b)=>a+b,0);
  // What each part adds to the score as the day goes by: a stay's points and a
  // trip's cost are spread evenly over its own hours, so the score counts up
  // behind the marker and reaches the day's score at midnight. Home is one
  // stay split round midnight, so its points spread over both halves.
  const homeHours=leave+24-atHome;
  const value=p=>p.kind==='trip'?trips[p.trip]:p.place==='home'?home*(p.to-p.from)/homeHours:p.place==='work'?work:shop;
  return {way,minutes,km,leave,parts,byPlace:{home,work,shop},trips,places,travel,score:places+travel,
    scoreAt:hour=>parts.reduce((sum,p)=>sum+value(p)*Math.min(1,Math.max(0,(hour-p.from)/(p.to-p.from))),0)};
}

export const clock=hour=>{const total=Math.round(hour*60),h=Math.floor(total/60)%24,m=total%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;};
const signed=value=>(value<0?'−':'+')+Math.abs(value).toFixed(1);
const fixed=value=>(value<0?'−':'')+Math.abs(value).toFixed(1);

// The weighing card: four buttons weigh the same day by car, public
// transport, bike or on foot; a strip shows the day hour by hour with a marker
// the scene moves in step with the hour over the city, and the score counts
// up behind it. Pointing at either half of the formula, or at its total,
// lights that half's hours on the strip and says which half the scene lights.
export function createWeighingCard(card){
  if(!card)return null;
  const days=Object.fromEntries(Object.keys(WAYS).map(way=>[way,weigh(way)]));
  const $=selector=>card.querySelector(selector);
  const all=selector=>[...card.querySelectorAll(selector)];
  const segments=all('[data-part]');
  const buttons=all('[data-way]');
  const score=$('[data-weigh-score]'),marker=$('[data-weigh-now]');
  const barScore=$('[data-bar=score]'),barTrips=$('[data-bar=trips]');
  const sumPlaces=$('[data-sum=places]'),sumTrips=$('[data-sum=trips]');
  const byPlace=Object.fromEntries(all('[data-place-score]').map(el=>[el.dataset.placeScore,el]));
  const tripMinutes=all('[data-trip-minutes]');
  // The bar holds the day's score and, after it, what the trips took off it,
  // on one scale for every way.
  const SCALE=140;
  buttons.forEach(button=>{button.querySelector('[data-way-score]').textContent=days[button.dataset.way].score.toFixed(1);});
  let way='car',hour=24,pointed=null,shownScore='';
  function show(){
    const day=days[way];
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.way===way)));
    card.dataset.way=way;
    // Each part of the strip is as wide as its hours; a trip keeps a sliver
    // wide enough to see.
    card.style.setProperty('--strip',day.parts.map(p=>`minmax(3px,${(p.to-p.from).toFixed(3)}fr)`).join(' '));
    barScore.style.width=(day.score/SCALE*100).toFixed(2)+'%';
    barTrips.style.left=(day.score/SCALE*100).toFixed(2)+'%';
    barTrips.style.width=(-day.travel/SCALE*100).toFixed(2)+'%';
    sumPlaces.textContent=signed(day.places);
    sumTrips.textContent=signed(day.travel);
    for(const place of ['home','work','shop'])if(byPlace[place])byPlace[place].textContent=day.byPlace[place].toFixed(1);
    tripMinutes.forEach((el,i)=>{el.textContent=String(Math.round(day.minutes[i]));});
    shownScore='';setHour(hour);
  }
  function setHour(h){
    hour=Math.min(24,Math.max(0,h));
    marker.style.left=(hour/24*100).toFixed(2)+'%';
    const text=fixed(days[way].scoreAt(hour));
    if(text!==shownScore){shownScore=text;score.textContent=text;}
    segments.forEach(el=>{const part=days[way].parts[+el.dataset.part];el.toggleAttribute('data-now',hour>=part.from&&hour<part.to);});
  }
  function point(half){
    pointed=half;
    if(half)card.dataset.pointed=half;else delete card.dataset.pointed;
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{way=button.dataset.way;show();}));
  all('[data-half]').forEach(el=>{
    el.addEventListener('pointerenter',()=>point(el.dataset.half));
    el.addEventListener('pointerleave',()=>point(null));
    el.addEventListener('focus',()=>point(el.dataset.half));
    el.addEventListener('blur',()=>point(null));
  });
  show();
  return {setHour,get way(){return way;},get pointed(){return pointed;},days};
}

// The five days the resident remembers, each weighed, best first. The card's
// rows are in the page; this writes each row's leaving time, score and bar,
// and marks the best as kept.
export function fillRemembered(card){
  if(!card)return [];
  const days=REMEMBERED.map(r=>({...r,day:weigh(r.way,{minutes:r.minutes,km:r.km})})).sort((a,b)=>b.day.score-a.day.score);
  days.forEach((r,rank)=>{
    const row=card.querySelector(`[data-remembered="${r.key}"]`);if(!row)return;
    row.style.order=String(rank);
    row.toggleAttribute('data-kept',rank===0);
    row.querySelector('[data-leaves]').textContent=clock(r.day.leave);
    row.querySelector('[data-score]').textContent=r.day.score.toFixed(1);
    row.style.setProperty('--w',(r.day.score/130*100).toFixed(1)+'%');
  });
  return days;
}
