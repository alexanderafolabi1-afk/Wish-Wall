(function(){
window.SPG={};

SPG.COUNTRIES=[
{flag:'🇬🇧',name:'United Kingdom',code:'GB',currency:'GBP'},
{flag:'🇺🇸',name:'United States',code:'US',currency:'USD'},
{flag:'🇨🇦',name:'Canada',code:'CA',currency:'CAD'},
{flag:'🇦🇺',name:'Australia',code:'AU',currency:'AUD'},
{flag:'🇫🇷',name:'France',code:'FR',currency:'EUR'},
{flag:'🇩🇪',name:'Germany',code:'DE',currency:'EUR'},
{flag:'🇪🇸',name:'Spain',code:'ES',currency:'EUR'},
{flag:'🇮🇹',name:'Italy',code:'IT',currency:'EUR'},
{flag:'🇵🇹',name:'Portugal',code:'PT',currency:'EUR'},
{flag:'🇧🇪',name:'Belgium',code:'BE',currency:'EUR'},
{flag:'🇳🇬',name:'Nigeria',code:'NG',currency:'NGN'},
{flag:'🇬🇭',name:'Ghana',code:'GH',currency:'GHS'},
{flag:'🇰🇪',name:'Kenya',code:'KE',currency:'KES'},
{flag:'🇿🇦',name:'South Africa',code:'ZA',currency:'ZAR'},
{flag:'🇺🇬',name:'Uganda',code:'UG',currency:'UGX'},
{flag:'🇷🇼',name:'Rwanda',code:'RW',currency:'RWF'},
{flag:'🇮🇳',name:'India',code:'IN',currency:'INR'},
{flag:'🇸🇬',name:'Singapore',code:'SG',currency:'SGD'},
{flag:'🇧🇷',name:'Brazil',code:'BR',currency:'BRL'},
{flag:'🇲🇽',name:'Mexico',code:'MX',currency:'MXN'},
{flag:'🇦🇪',name:'UAE',code:'AE',currency:'AED'},
{flag:'🇯🇵',name:'Japan',code:'JP',currency:'JPY'},
{flag:'🇰🇷',name:'South Korea',code:'KR',currency:'KRW'}
];

SPG.PRICES={
GBP:{sym:'£',solo_monthly:15,pro_monthly:30,agency_monthly:120,creator_starter_monthly:10,creator_pro_monthly:20,creator_growth_monthly:35},
USD:{sym:'$',solo_monthly:19,pro_monthly:38,agency_monthly:150,creator_starter_monthly:13,creator_pro_monthly:25,creator_growth_monthly:44},
EUR:{sym:'€',solo_monthly:17,pro_monthly:34,agency_monthly:138,creator_starter_monthly:12,creator_pro_monthly:23,creator_growth_monthly:41},
CAD:{sym:'C$',solo_monthly:26,pro_monthly:52,agency_monthly:207,creator_starter_monthly:17,creator_pro_monthly:34,creator_growth_monthly:60},
AUD:{sym:'A$',solo_monthly:29,pro_monthly:58,agency_monthly:233,creator_starter_monthly:19,creator_pro_monthly:38,creator_growth_monthly:67},
NGN:{sym:'₦',solo_monthly:1500,pro_monthly:2800,agency_monthly:8400,creator_starter_monthly:1100,creator_pro_monthly:2000,creator_growth_monthly:3500},
GHS:{sym:'GH₵',solo_monthly:28,pro_monthly:52,agency_monthly:156,creator_starter_monthly:20,creator_pro_monthly:37,creator_growth_monthly:65},
ZAR:{sym:'R',solo_monthly:43,pro_monthly:80,agency_monthly:240,creator_starter_monthly:30,creator_pro_monthly:57,creator_growth_monthly:100},
KES:{sym:'KSh',solo_monthly:365,pro_monthly:685,agency_monthly:2055,creator_starter_monthly:260,creator_pro_monthly:490,creator_growth_monthly:850},
BRL:{sym:'R$',solo_monthly:79,pro_monthly:149,agency_monthly:449,creator_starter_monthly:49,creator_pro_monthly:99,creator_growth_monthly:179},
INR:{sym:'₹',solo_monthly:999,pro_monthly:1899,agency_monthly:5699,creator_starter_monthly:649,creator_pro_monthly:1199,creator_growth_monthly:2199},
AED:{sym:'AED',solo_monthly:70,pro_monthly:139,agency_monthly:440,creator_starter_monthly:48,creator_pro_monthly:92,creator_growth_monthly:161},
MXN:{sym:'MX$',solo_monthly:249,pro_monthly:469,agency_monthly:1399,creator_starter_monthly:159,creator_pro_monthly:299,creator_growth_monthly:549},
SGD:{sym:'S$',solo_monthly:21,pro_monthly:41,agency_monthly:162,creator_starter_monthly:14,creator_pro_monthly:27,creator_growth_monthly:47},
JPY:{sym:'¥',solo_monthly:1499,pro_monthly:2999,agency_monthly:9499,creator_starter_monthly:999,creator_pro_monthly:1999,creator_growth_monthly:3499}
};

SPG.TESTIMONIALS={
GB:[{name:'Sarah M.',profession:'Solicitor',location:'Manchester, UK',text:'I have been qualified for 11 years and never managed to post consistently. Three weeks in and my LinkedIn has more engagement than all of last year.'},{name:'James T.',profession:'Estate Agent',location:'London, UK',text:'Three new instructions came in from people who said they had been following me online. That has never happened before.'},{name:'Amelia R.',profession:'Personal Trainer',location:'Birmingham, UK',text:'I used to spend Sunday evenings writing posts. Now I spend them with my family.'}],
US:[{name:'Sarah M.',profession:'Attorney',location:'New York, USA',text:'I have been qualified for 11 years and never managed to post consistently. Three weeks in and my LinkedIn has more engagement than all of last year.'},{name:'Daniel W.',profession:'Graphic Designer',location:'Los Angeles, USA',text:'Designers are supposed to be creative. I am. Just not at writing captions at 11pm. This solved that.'},{name:'Fatima H.',profession:'Mortgage Broker',location:'Houston, USA',text:'My referral business doubled. People kept saying they felt like they knew me before we even spoke.'}],
CA:[{name:'Daniel W.',profession:'Graphic Designer',location:'Toronto, Canada',text:'Designers are supposed to be creative. I am. Just not at writing captions at 11pm. This solved that.'},{name:'Sophie L.',profession:'Yoga Instructor',location:'Vancouver, Canada',text:'My students started tagging me in shares of my own posts. The content resonated in a way I could never have written myself.'},{name:'Ravi K.',profession:'Financial Advisor',location:'Toronto, Canada',text:'LinkedIn always felt like a chore. Now it feels like an asset. Three new clients in 60 days.'}],
AU:[{name:'Amelia R.',profession:'Personal Trainer',location:'Sydney, Australia',text:'I used to spend Sunday evenings writing posts. Now I spend them with my family.'},{name:'Emma J.',profession:'Wedding Planner',location:'Melbourne, Australia',text:'Booked out for 18 months. The enquiries started the same week I started posting.'},{name:'Jack T.',profession:'Real Estate Agent',location:'Brisbane, Australia',text:'My listings get more attention than any of my competitors. Vendors notice that.'}],
NG:[{name:'Blessing N.',profession:'Baker',location:'Abuja, Nigeria',text:'Custom orders tripled in two months. People said they had been watching my posts for weeks before reaching out.'},{name:'James O.',profession:'Estate Agent',location:'Lagos, Nigeria',text:'Posted every day for a month. Three new clients came in from people who said they had been following me. That has never happened before.'},{name:'Kofi A.',profession:'Accountant',location:'Lagos, Nigeria',text:'My clients started asking where I found a copywriter. I told them the truth. They all signed up.'}],
GH:[{name:'Kofi A.',profession:'Accountant',location:'Accra, Ghana',text:'My clients started asking where I found a copywriter. I told them the truth. They all signed up.'},{name:'Ama S.',profession:'Nutritionist',location:'Kumasi, Ghana',text:'The posts sound exactly like how I speak to clients. That is the part I did not expect.'},{name:'Kweku M.',profession:'Financial Advisor',location:'Accra, Ghana',text:'Three new clients in 60 days. LinkedIn finally feels like an asset not a chore.'}],
KE:[{name:'Marcus T.',profession:'Music Artist',location:'Nairobi, Kenya',text:'My TikTok went from 200 followers to over 4,000 in six weeks. The content just kept coming.'},{name:'Wanjiru K.',profession:'Personal Trainer',location:'Nairobi, Kenya',text:'I used to spend Sunday evenings writing posts. Now I spend them with my family.'},{name:'David M.',profession:'Mortgage Broker',location:'Nairobi, Kenya',text:'Referral business doubled. People kept saying they felt like they knew me before we even spoke.'}],
ZA:[{name:'Thabo M.',profession:'Estate Agent',location:'Johannesburg, South Africa',text:'Consistent posting for two months changed everything. Enquiries I never expected started coming through.'},{name:'Lerato N.',profession:'Hair Stylist',location:'Cape Town, South Africa',text:'Bookings are full three weeks ahead. The content brings people in before they even call.'},{name:'Sipho D.',profession:'Accountant',location:'Durban, South Africa',text:'My competitors post once a month. I post every day. The difference in enquiries is significant.'}],
IN:[{name:'Ravi K.',profession:'Financial Advisor',location:'Mumbai, India',text:'LinkedIn always felt like a chore. Now it feels like an asset. Three new clients in 60 days.'},{name:'Priya S.',profession:'Nutritionist',location:'Bangalore, India',text:'The posts sound exactly like how I speak to clients. That is the part I did not expect.'},{name:'Arjun M.',profession:'Business Coach',location:'Delhi, India',text:'My LinkedIn following grew by 2,000 in 8 weeks. Consistent posting is everything.'}],
PT:[{name:'Carlos M.',profession:'Consultor Financeiro',location:'Lisboa, Portugal',text:'O LinkedIn sempre pareceu uma obrigação. Agora parece um ativo. Três novos clientes em 60 dias.'},{name:'Ana S.',profession:'Personal Trainer',location:'Porto, Portugal',text:'Costumava passar os domingos a escrever posts. Agora passo com a minha família.'},{name:'Pedro L.',profession:'Designer Gráfico',location:'Lisboa, Portugal',text:'Os posts soam exatamente como eu falo com os clientes. Essa foi a parte que não esperava.'}],
FR:[{name:'Marie L.',profession:'Coach de vie',location:'Paris, France',text:'Je passais mes dimanches à écrire des posts. Maintenant je les passe avec ma famille.'},{name:'Pierre D.',profession:'Consultant',location:'Lyon, France',text:'LinkedIn me semblait une corvée. Maintenant cela ressemble à un atout. Trois nouveaux clients en 60 jours.'},{name:'Sophie M.',profession:'Photographe',location:'Marseille, France',text:'Les posts sonnent exactement comme je parle à mes clients.'}],
AE:[{name:'Fatima H.',profession:'Mortgage Broker',location:'Dubai, UAE',text:'My referral business doubled. People kept saying they felt like they knew me before we even spoke.'},{name:'Ahmed K.',profession:'Financial Advisor',location:'Abu Dhabi, UAE',text:'LinkedIn always felt like a chore. Now it feels like an asset. Three new clients in 60 days.'},{name:'Sara M.',profession:'Business Coach',location:'Dubai, UAE',text:'My following grew by 3,000 in 8 weeks. Consistent posting is everything.'}],
DEFAULT:[{name:'Sarah M.',profession:'Solicitor',location:'Manchester, UK',text:'I have been qualified for 11 years and never managed to post consistently. Three weeks in and my LinkedIn has more engagement than all of last year.'},{name:'James O.',profession:'Estate Agent',location:'Lagos, Nigeria',text:'Posted every day for a month. Three new clients came in from people who said they had been following me. That has never happened before.'},{name:'Amelia R.',profession:'Personal Trainer',location:'Sydney, Australia',text:'I used to spend Sunday evenings writing posts. Now I spend them with my family.'}]
};

SPG.country=function(){return localStorage.getItem('spg_country')||'GB';};
SPG.currency=function(){return localStorage.getItem('spg_currency')||'GBP';};
SPG.countryData=function(){return SPG.COUNTRIES.find(c=>c.code===SPG.country())||SPG.COUNTRIES[0];};

SPG.updatePrices=function(){
var cur=SPG.currency();
var d=SPG.PRICES[cur]||SPG.PRICES.GBP;
document.querySelectorAll('[data-plan]').forEach(function(el){
var p=el.getAttribute('data-plan');
if(p==='free'){el.textContent='Free';return;}
if(d[p]!==undefined){el.textContent=d.sym+d[p].toLocaleString();}
});
};

SPG.updateTestimonials=function(){
var code=SPG.country();
var list=SPG.TESTIMONIALS[code]||SPG.TESTIMONIALS.DEFAULT;
var sel='[class*="testi-grid"],[class*="testimonials-grid"],#testimonials-container,.s9-grid';
var container=document.querySelector(sel);
if(!container)return;
container.innerHTML=list.map(function(t){
return '<div class="testi-card"><p class="testi-text">&#8220;'+t.text+'&#8221;</p><p class="testi-name">'+t.name+'</p><p class="testi-role">'+t.profession+' &bull; '+t.location+'</p></div>';
}).join('');
};

SPG.updateButton=function(){
var c=SPG.countryData();
var lang=localStorage.getItem('spg_language')||'en';
var f=document.getElementById('locale-flag');
var l=document.getElementById('locale-label');
if(f)f.textContent=c.flag;
if(l)l.textContent=lang.toUpperCase();
};

SPG.updateInfoBar=function(){
var c=SPG.countryData();
var cur=SPG.currency();
var f=document.getElementById('pib-flag');
var n=document.getElementById('pib-country');
var u=document.getElementById('pib-currency');
if(f)f.textContent=c.flag;
if(n)n.textContent=c.name;
if(u)u.textContent=cur;
};

SPG.updateFromPrice=function(){
var d=SPG.PRICES[SPG.currency()]||SPG.PRICES.GBP;
var el=document.getElementById('stats-from-price');
if(el)el.textContent='From '+d.sym+(d.solo_monthly||15).toLocaleString()+' per month';
};

SPG.save=function(code,cur,lang){
localStorage.setItem('spg_country',code);
localStorage.setItem('spg_currency',cur);
localStorage.setItem('spg_language',lang||'en');
SPG.updateButton();
SPG.updatePrices();
SPG.updateTestimonials();
SPG.updateInfoBar();
SPG.updateFromPrice();
};

SPG.init=function(){
SPG.updateButton();
SPG.updatePrices();
SPG.updateTestimonials();
SPG.updateInfoBar();
SPG.updateFromPrice();
};

document.addEventListener('DOMContentLoaded',SPG.init);
})();
