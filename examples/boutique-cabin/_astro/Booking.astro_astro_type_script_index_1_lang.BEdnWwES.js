import{g as x,p as J,s as C,c as de,d as y,e as Q,l as ue,b as V,h as me,i as z,j as pe,k as Y,m as W,r as ge,n as be}from"./bookingState.CZasMJlJ.js";import{b as he,d as ve,f as ye,e as K,h as P,t as fe}from"./clientI18n.BuUI1bUM.js";const O=4,H=4,$e=3;let v=!1;function xe(){const e=document.getElementById("booking-rooms-data");if(!e?.textContent)return null;try{return JSON.parse(e.textContent)}catch{return null}}function ke(){const e=document.getElementById("availability-config");if(!e?.textContent)return null;try{const t=JSON.parse(e.textContent);return{...t,...ve(),booking:xe()||t.booking}}catch{return null}}function o(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function X(e){C(e);const{checkIn:t,checkOut:n}=_();t&&n&&n>t?J(t,n,e):de()}function _(){const e=document.getElementById("booking-check-in")?.value||"",t=document.getElementById("booking-check-out")?.value||"";return{checkIn:e,checkOut:t}}function f(){const{checkIn:e,checkOut:t}=_();return!!(e&&t&&t>e)}function Z(){const e=V();return Math.max(1,Math.min(8,e.adults+e.children))}function ee(e=Z()){return Array.from({length:e},()=>'<span class="material-symbols-outlined text-[#1b1c1c] text-[22px] leading-none">person</span>').join("")}function te(){const e=document.getElementById("availability-dates-notice");e&&e.classList.toggle("hidden",v||f())}function I(e){const t=document.getElementById("selection-dates-hint");if(t){if(v){t.classList.add("hidden");return}t.classList.remove("hidden"),t.textContent=f()?e.lblSelectDatesForPrices:e.lblSidebarSelectDates}}function R(e){v=e;const t=document.getElementById("availability-results");t&&(t.dataset.pricesVisible=e?"true":"false"),te()}function _e(e,t){const n=[],i=e.rate;if(i.inclusions?.length){const s=i.inclusions.map(a=>P(a)).join(" + ");n.push({icon:"check_circle",text:t.lblIncludesPrefix.replace("{{items}}",s),kind:"positive"})}if(i.cancellation==="non_refundable"?n.push({icon:"cancel",text:t.lblNonRefundable,kind:"negative"}):i.cancellation==="free"?n.push({icon:"check_circle",text:t.lblFreeCancellation,kind:"positive"}):i.cancellation==="flexible"&&n.push({icon:"check_circle",text:t.lblFlexibleCancellation,kind:"positive"}),i.reschedule==="flexible"&&n.push({icon:"event_available",text:t.lblFlexibleReschedule,kind:"positive"}),i.breakfastLabel&&i.breakfastPrice!=null){const s=i.breakfastCurrency||e.currency,a=P(i.breakfastLabel);n.push({icon:"restaurant",text:t.lblBreakfastOptionalPrice.replace("{{label}}",a).replace("{{price}}",String(Math.round(i.breakfastPrice))).replace("{{currency}}",s),kind:"neutral"})}else i.breakfast==="included"?n.push({icon:"restaurant",text:t.lblBreakfastIncluded,kind:"neutral"}):i.breakfast==="paid"&&n.push({icon:"restaurant",text:t.lblBreakfastPaid,kind:"neutral"});return i.payment==="online"?n.push({icon:"credit_card",text:t.lblPayOnline,kind:"neutral"}):i.payment==="pay_at_property"&&n.push({icon:"credit_card",text:t.lblPayAtProperty,kind:"neutral"}),n}function j(e,t,n){return`<div class="rate-policy-badge rate-policy-badge--${t}">
      <span class="material-symbols-outlined rate-policy-badge__icon" aria-hidden="true">${e.icon}</span>
      <div class="rate-policy-badge__body">
        <span class="rate-policy-badge__text">${o(e.text)}</span>
        <button type="button" class="rate-policy-badge__toggle hidden" aria-expanded="false">${o(n.lblPolicyMore)}</button>
      </div>
    </div>`}function Ie(e,t){return e.kind==="positive"?j(e,"positive",t):e.kind==="negative"?j(e,"negative",t):`<p class="rate-policy-line">
    <span class="material-symbols-outlined rate-policy-line__icon" aria-hidden="true">${e.icon}</span>
    <span>${o(e.text)}</span>
  </p>`}function we(e,t){const n=ge(e),i=[];if(n.some(r=>/mountain view/i.test(r)))i.push(`<span class="room-highlights-teaser__line"><span class="material-symbols-outlined room-highlights-teaser__icon" aria-hidden="true">landscape</span>${o(t.lblHighlightsMountain)}</span>`);else{const r=be(n).find(l=>/view/i.test(l.concept));if(r){const l=fe(r.concept,r.label);i.push(`<span class="room-highlights-teaser__line"><span class="material-symbols-outlined room-highlights-teaser__icon" aria-hidden="true">visibility</span>${o(l)}</span>`)}}const s=[];if(n.some(r=>/fireplace/i.test(r))&&s.push(t.lblHighlightsFireplace),n.some(r=>/private garden|garden/i.test(r))?s.push(t.lblHighlightsPrivateGarden):n.some(r=>/^terrace$/i.test(r))&&s.push(t.lblHighlightsTerrace),s.length){const r=n.some(l=>/fireplace/i.test(l))?"local_fire_department":"deck";i.push(`<span class="room-highlights-teaser__line"><span class="material-symbols-outlined room-highlights-teaser__icon" aria-hidden="true">${r}</span>${o(s.join(" · "))}</span>`)}const a=[];return e.sizeM2!=null&&a.push(`${e.sizeM2} m²`),e.maxGuests!=null&&a.push(t.lblGuestsUpTo.replace("{{count}}",String(e.maxGuests))),a.length&&i.push(`<span class="room-highlights-teaser__line"><span class="material-symbols-outlined room-highlights-teaser__icon" aria-hidden="true">groups</span>${o(a.join(" · "))}</span>`),i.length?`<div class="room-highlights-teaser">${i.join("")}</div>`:""}function Se(e){if(e.beds.length)return e.beds.map(n=>{const i=ye(n.area,n.beds);return`<p class="text-sm text-[#414844] flex items-center gap-2 mt-1">
          <span class="material-symbols-outlined text-base text-[#717973]">bed</span>
          <span>${o(i)}</span>
        </p>`}).join("");const t=e.beds.map(n=>K(n.beds)).filter(Boolean).join(", ");return t?`<p class="text-sm text-[#414844] flex items-center gap-2 mt-1">
    <span class="material-symbols-outlined text-base text-[#717973]">bed</span>
    <span>${o(t)}</span>
  </p>`:""}function ne(e){const t=pe(e);if(t==null)return null;const n=e.rates.find(i=>i.price===t)?.currency||"EUR";return{price:t,currency:n}}function B(e,t="catalog"){const n=e.photos[0],i=t==="priced"?"room-thumbnail room-thumbnail--priced w-24 h-[4.5rem] md:w-32 md:h-24 rounded-lg":"w-24 h-[4.5rem] md:w-28 md:h-[5.25rem] rounded-lg";if(!n)return`<div class="${i} bg-[#e4e2e1] flex items-center justify-center shrink-0" aria-hidden="true">
      <span class="material-symbols-outlined text-[#717973]">image</span>
    </div>`;const s=t==="priced"?'width="128" height="96"':'width="112" height="84"';return`<img src="${o(n)}" alt="${o(e.name)}" class="${i} object-cover shrink-0" loading="lazy" ${s} />`}function ie(e){return e.rate.guests!=null&&Number.isFinite(e.rate.guests)?e.rate.guests:Z()}function Le(e,t){const n=ie(e);return t.lblGuestsCount.replace("{{count}}",String(n))}function Ee(e){const t=Math.max(1,Math.min(8,e));return`<div class="rate-row__guest-icons" aria-hidden="true">${Array.from({length:t},()=>'<span class="material-symbols-outlined text-[#414844] text-lg leading-none">person</span>').join("")}</div>`}function Pe(e,t,n,i){const s=t.originalPrice!=null&&t.price!=null&&t.originalPrice>t.price?` data-original-price="${t.originalPrice}"`:"";return`
    <div
      class="rate-qty-stepper${n>0?" rate-qty-stepper--selected":""}"
      data-room-id="${e.id}"
      data-rate-id="${t.id}"
      data-price="${t.price??0}"
      data-currency="${t.currency}"
      data-room-name="${o(e.name)}"${s}
      data-qty="${n}"
    >
      <button type="button" class="qty-minus" aria-label="${o(i.lblQtyDecrease)}" ${n<=0?"disabled":""}>
        <span class="material-symbols-outlined" aria-hidden="true">remove</span>
      </button>
      <span class="qty-value" aria-live="polite">${n}</span>
      <button type="button" class="qty-plus" aria-label="${o(i.lblQtyIncrease)}" ${n>=1?"disabled":""}>
        <span class="material-symbols-outlined" aria-hidden="true">add</span>
      </button>
    </div>
  `}function se(){const{checkIn:e,checkOut:t}=_();if(!e||!t||t<=e)return 0;const n=new Date(`${e}T12:00:00`),i=new Date(`${t}T12:00:00`);return Math.round((i.getTime()-n.getTime())/(1e3*60*60*24))}function Be(e,t){const n=y(e.price,e.currency);return`<div class="catalog-price-cell">
    <span class="catalog-price catalog-price--indicative" tabindex="0">
      <span class="catalog-price-from">${o(t.lblPriceFromPrefix)}</span>
      <span class="catalog-price-amount catalog-price-amount--dotted">${o(n)}</span>
      <span class="catalog-price-suffix">${o(t.lblPricePerNightShort)}</span>
      <span class="catalog-price-tooltip" role="tooltip">${o(t.lblPriceTooltip)}</span>
    </span>
  </div>`}function Ce(e,t){const n=ne(e);return n?Be(n,t):f()?z(e)?`<div class="catalog-price-cell">
      <span class="text-sm font-semibold text-[#ba1a1a] font-[Plus_Jakarta_Sans,sans-serif]">${o(t.lblNotAvailable)}</span>
    </div>`:'<div class="catalog-price-cell"><span class="text-sm text-[#717973]">—</span></div>':`<div class="catalog-price-cell">
      <span class="text-sm text-[#414844] font-medium font-[Plus_Jakarta_Sans,sans-serif]">${o(t.lblSelectDates)}</span>
    </div>`}function ae(e){return ne(e)?`<div class="guest-count-icons">${ee()}</div>`:""}function Re(e,t){const n=ae(e);return n?`<div class="catalog-guest-cell catalog-guest-cell--desktop" aria-label="${o(t.lblNumberOfGuests)}">${n}</div>`:'<div class="catalog-guest-cell catalog-guest-cell--empty catalog-guest-cell--desktop" aria-hidden="true"></div>'}function Me(e,t){const n=ae(e);return n?`<div class="catalog-guest-cell catalog-guest-cell--mobile" aria-label="${o(t.lblNumberOfGuests)}">${n}</div>`:""}function Te(e,t){const n=Ce(e,t),i=Re(e,t);return`
    <div class="catalog-room-row grid grid-cols-1 md:grid-cols-[112px_minmax(0,1.4fr)_minmax(72px,0.7fr)_minmax(110px,auto)] lg:grid-cols-[112px_minmax(0,1fr)_100px_minmax(140px,auto)] gap-3 md:gap-3 lg:gap-4 px-4 md:px-5 lg:px-6 py-5 border-t border-[#c1c8c2]/30 items-center" data-room-row="${e.id}">
      <div class="hidden md:block">${B(e)}</div>
      <div class="catalog-room-main min-w-0 flex gap-3 items-start">
        <div class="md:hidden shrink-0">${B(e)}</div>
        <div class="min-w-0">
          <button
            type="button"
            class="room-detail-trigger room-detail-trigger--catalog"
            data-room-id="${e.id}"
          >${o(e.name)}</button>
          ${Se(e)}
          ${Me(e,t)}
        </div>
      </div>
      ${i}
      ${n}
    </div>
  `}function Ae(e,t){const n=e.map(i=>Te(i,t)).join("");return`
    <div class="glass rounded-xl border border-[#c1c8c2]/40 overflow-hidden">
      <div class="hidden md:grid md:grid-cols-[112px_minmax(0,1.4fr)_minmax(72px,0.7fr)_minmax(110px,auto)] lg:grid-cols-[112px_minmax(0,1fr)_100px_minmax(140px,auto)] gap-3 lg:gap-4 px-5 lg:px-6 py-3 bg-[#012d1d] text-white text-sm font-semibold font-[Plus_Jakarta_Sans,sans-serif]">
        <span></span>
        <span>${o(t.lblRoomType)}</span>
        <span class="text-center leading-snug">${o(t.lblNumberOfGuests)}</span>
        <span class="text-right min-w-0 leading-snug">${o(t.lblPricePerNight)}</span>
      </div>
      ${n}
    </div>
  `}function qe(e,t,n){const i=_e(t,n),s=[t.discount].filter(Boolean),a=Le(t,n),r=ie(t),l=i.map(p=>Ie(p,n)).join(""),d=s.map(p=>`<span class="rate-discount-badge">${o(P(p))}</span>`).join(""),c=t.originalPrice!=null&&t.price!=null&&t.originalPrice>t.price?`<span class="rate-price-original">${y(t.originalPrice,t.currency)}</span>`:"",u=x().find(p=>p.roomId===e.id&&p.rateId===t.id)?.qty??0;return`
    <div class="rate-row" data-rate-row="${e.id}:${t.id}">
      <div class="rate-row__occupancy hidden md:flex md:flex-col md:w-36 md:shrink-0">
        <p class="rate-row__guest-label">${o(a)}</p>
        ${Ee(r)}
      </div>
      <div class="rate-row__body">
        <p class="rate-row__guest-label rate-row__guest-label--mobile md:hidden">${o(a)}</p>
        <div class="rate-row__price-block">
          ${c}
          <div class="rate-row__price">${y(t.price,t.currency)}</div>
          <p class="rate-row__tax-note">${o(n.lblIncludesTaxes)}</p>
          <div class="rate-row__book-controls">
            ${d?`<div class="rate-row__discounts">${d}</div>`:""}
            <div class="rate-row__stepper">${Pe(e,t,u,n)}</div>
          </div>
        </div>
        ${l?`<div class="rate-row__policies">${l}</div>`:""}
      </div>
    </div>
  `}function Ne(e,t){const n=Y(e);return n.length?`
    <div class="room-amenities-block">
      <div class="room-amenities-chips">${n.slice(0,$e).map(s=>W(o(s.label),s.icon)).join("")}</div>
      <button type="button" class="room-amenities-more room-amenities-more--mobile room-detail-trigger" data-room-id="${e.id}">
        ${o(t.lblShowAllAmenities)}
      </button>
    </div>
  `:""}function De(e,t,n){const i=Y(e);if(!i.length)return"";const s=i.map((g,h)=>{const b=h>=H?" room-amenity-chip--hide-mobile":"",k=h>=O?" room-amenity-chip--hide-desktop":"";return W(o(g.label),g.icon,`${b}${k}`.trim())}).join(""),a=Math.max(0,i.length-O),r=Math.max(0,i.length-H),l=a>0?t.lblMoreAmenitiesCount.replace("{{count}}",String(a)):"",d=a>0?`<button type="button" class="room-amenities-more room-amenities-more--desktop room-detail-trigger" data-room-id="${e.id}">
          ${o(l)}
        </button>`:"",c=r>0?`<button type="button" class="room-amenities-more room-amenities-more--mobile room-detail-trigger" data-room-id="${e.id}">
          ${o(t.lblShowAllAmenities)}
        </button>`:"",u=we(e,t);return`
      <div class="room-amenities-priced-desktop hidden md:block">${`
    <div class="room-amenities-block">
      <div class="room-amenities-chips">${s}</div>
      ${d}
      ${c}
      ${u?`<div class="room-amenities-highlights">${u}</div>`:""}
    </div>
  `}</div>
      <div class="room-amenities-priced-mobile md:hidden">${Ne(e,t)}</div>
    `}function Oe(e,t,n=!1){const i=e.beds.map(a=>K(a.beds)).filter(Boolean).join(", "),s=n?"room-detail-trigger room-detail-trigger--card line-through":"room-detail-trigger room-detail-trigger--card";return`
    <div class="room-card__header">
      <button
        type="button"
        class="room-card__thumbnail-trigger room-photo-trigger shrink-0"
        data-room-id="${e.id}"
        aria-label="${o(e.name)}"
      >${B(e,"priced")}</button>
      <div class="room-card__header-text min-w-0">
        <button type="button" class="${s}" data-room-id="${e.id}">${o(e.name)}</button>
        ${i?`<p class="room-card__beds">${o(i)}</p>`:""}
      </div>
    </div>
    ${De(e,t)}
  `}function He(e,t){const n=z(e),i=Oe(e,t,n);if(n)return`
    <div class="room-card glass rounded-xl overflow-hidden border border-[#c1c8c2]/40 room-card--unavailable opacity-50" data-room-card="${e.id}" data-unavailable="true" data-rate-count="1">
      <div class="room-card__summary">
        <div class="room-card__summary-top">${i}</div>
      </div>
      <div class="room-card__rates room-card__rates--unavailable">
        <p class="room-card__unavailable-msg">${o(t.lblUnavailable)}</p>
      </div>
    </div>
  `;const s=e.rates.length,a=e.rates.map(r=>qe(e,r,t)).join("");return`
    <div class="room-card glass rounded-xl overflow-hidden border border-[#c1c8c2]/40" data-room-card="${e.id}" data-rate-count="${s}">
      <div class="room-card__summary">
        <div class="room-card__summary-top">${i}</div>
      </div>
      <div class="room-card__rates">${a}</div>
    </div>
  `}function je(e,t,n,i,s){const a=Math.max(1,t)*n,r=y(i,s);return n>1&&t>1?`${n} × ${t} × ${r}`:e.lblNightsTimesPrice.replace("{{nights}}",String(a)).replace("{{price}}",r)}function S(e){const t=x(),n=t.reduce((m,$)=>m+$.qty,0),i=se(),s=i>0?i:1,a=t.reduce((m,$)=>m+$.price*$.qty*s,0),r=t[0]?.currency||"EUR",l=document.getElementById("selection-dates-hint"),d=document.getElementById("selection-empty"),c=document.getElementById("selection-pricing"),u=document.getElementById("selection-count"),p=document.getElementById("selection-breakdown"),g=document.getElementById("selection-savings"),h=document.getElementById("selection-total"),b=document.getElementById("reserve-now-btn"),k=document.getElementById("selection-sidebar-panel");v?(l?.classList.add("hidden"),n>0?(d?.classList.add("hidden"),c?.classList.remove("hidden"),c?.classList.add("selection-pricing--visible"),k?.classList.add("selection-sidebar-panel--active")):(d?.classList.remove("hidden"),c?.classList.add("hidden"),c?.classList.remove("selection-pricing--visible"),k?.classList.remove("selection-sidebar-panel--active"))):(l?.classList.remove("hidden"),d?.classList.add("hidden"),c?.classList.add("hidden"),c?.classList.remove("selection-pricing--visible"),k?.classList.remove("selection-sidebar-panel--active")),u&&(u.textContent=n===1?e.lblRoomsSelectedOne:e.lblRoomsSelected.replace("{{count}}",String(n)));let L=0;p&&(n?p.innerHTML=t.map(m=>{const $=m.price*m.qty*s,le=je(e,s,m.qty,m.price,m.currency),ce=e.lblSelectionLine.replace("{{room}}",m.roomName).replace("{{formula}}",le);return m.originalPrice!=null&&m.originalPrice>m.price&&(L+=(m.originalPrice-m.price)*m.qty*s),`<div class="flex justify-between items-start gap-3">
            <span class="text-[#414844] leading-snug">${o(ce)}</span>
            <span class="font-semibold text-[#1b1c1c] shrink-0">${o(y($,m.currency))}</span>
          </div>`}).join(""):p.innerHTML=""),g&&(L>0?(g.classList.remove("hidden"),g.textContent=e.lblYouSave.replace("{{amount}}",y(L,r))):(g.classList.add("hidden"),g.textContent="")),h&&(h.textContent=y(n?a:0,r));const w=v&&n>0;b&&(b.disabled=!w,b.classList.toggle("opacity-50",!w),b.classList.toggle("cursor-not-allowed",!w),b.classList.toggle("pointer-events-none",!w)),Je();const T=document.getElementById("booking-selections"),A=document.getElementById("booking-total-price"),q=document.getElementById("booking-currency"),N=document.getElementById("booking-unit-id"),D=document.getElementById("booking-rate-id");T&&(T.value=JSON.stringify(t)),A&&(A.value=n?String(a):""),q&&(q.value=r),N&&(N.value=t[0]?.roomId||""),D&&(D.value=t[0]?.rateId||"")}function Fe(){return window.matchMedia("(max-width: 1023px)").matches}function Ge(){if(!Fe())return;const e=document.getElementById("selection-sidebar-panel");e?.classList.contains("selection-sidebar-panel--active")&&(e.classList.remove("selection-sidebar-panel--reveal"),e.offsetWidth,e.classList.add("selection-sidebar-panel--reveal"),window.setTimeout(()=>e.classList.remove("selection-sidebar-panel--reveal"),500))}function Ue(e,t){e.dataset.qty=String(t),e.classList.toggle("rate-qty-stepper--selected",t>0);const n=e.querySelector(".qty-value"),i=e.querySelector(".qty-minus"),s=e.querySelector(".qty-plus");n&&(n.textContent=String(t)),i&&(i.disabled=t<=0),s&&(s.disabled=t>=1)}function Je(){document.querySelectorAll(".rate-row--selected").forEach(e=>e.classList.remove("rate-row--selected")),document.querySelectorAll(".room-card--selected").forEach(e=>e.classList.remove("room-card--selected"));for(const e of x())e.qty<=0||(document.querySelector(`[data-rate-row="${e.roomId}:${e.rateId}"]`)?.classList.add("rate-row--selected"),document.querySelector(`[data-room-card="${e.roomId}"]`)?.classList.add("room-card--selected"))}function F(e,t,n,i,s,a,r,l){let d=x().filter(c=>!(c.roomId===e&&c.rateId===t));if(a>0){d=d.filter(u=>u.roomId!==e);const c={roomId:e,roomName:n,rateId:t,qty:a,price:i,currency:s};l!=null&&l>i&&(c.originalPrice=l),d.push(c)}document.querySelectorAll(`.rate-qty-stepper[data-room-id="${e}"]`).forEach(c=>{const u=c,g=(u.dataset.rateId||"")===t&&a>0;Ue(u,g?a:0)}),X(d),S(r),a>0&&Ge()}function Qe(e){document.querySelectorAll(".rate-policy-badge").forEach(t=>{const n=t.querySelector(".rate-policy-badge__text"),i=t.querySelector(".rate-policy-badge__toggle");if(!n||!i)return;const s=()=>{if(t.classList.contains("rate-policy-badge--expanded"))return;const a=n.scrollHeight>n.clientHeight+1;i.classList.toggle("hidden",!a)};s(),i.addEventListener("click",()=>{const a=t.classList.toggle("rate-policy-badge--expanded");i.setAttribute("aria-expanded",a?"true":"false"),i.textContent=a?e.lblPolicyLess:e.lblPolicyMore,a||s()})})}function Ve(e){document.querySelectorAll(".rate-qty-stepper").forEach(t=>{const n=t,i=n.querySelector(".qty-minus"),s=n.querySelector(".qty-plus");i?.addEventListener("click",()=>{const a=n.dataset.roomId||"",r=n.dataset.rateId||"",l=n.dataset.roomName||"",d=parseFloat(n.dataset.price||"0")||0,c=n.dataset.currency||"EUR";F(a,r,l,d,c,0,e)}),s?.addEventListener("click",()=>{const a=n.dataset.roomId||"",r=n.dataset.rateId||"",l=n.dataset.roomName||"",d=parseFloat(n.dataset.price||"0")||0,c=n.dataset.currency||"EUR",u=parseFloat(n.dataset.originalPrice||"0")||void 0;F(a,r,l,d,c,1,e,u&&u>d?u:void 0)})})}async function ze(e){if(!f()){window.dispatchEvent(new CustomEvent("booking:open-date-picker"));return}await M(e)}function Ye(){const e=ee();document.querySelectorAll(".catalog-guest-cell:not(.catalog-guest-cell--empty) .guest-count-icons, .catalog-guest-cell--mobile .guest-count-icons").forEach(t=>{t.innerHTML=e})}function oe(e,t){const n=document.getElementById("availability-room-list");if(!n)return;const i=Q(e);R(!1),re(),document.getElementById("availability-loading")?.classList.add("hidden"),n.innerHTML=Ae(i,t),C([]),I(t),S(t)}function We(e,t){const n=document.getElementById("availability-room-list");if(!n)return;const i=Q(e);n.innerHTML=i.map(s=>He(s,t)).join(""),Ve(t),Qe(t),I(t),S(t),window.dispatchEvent(new CustomEvent("booking:prices-shown"))}function E(e){const t=e.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!t)return e;const[,n,i,s]=t;return`${s}.${i}.${n}`}function Ke(e,t,n){const i=document.getElementById("availability-fallback-notice");if(!i)return;const s=e.lblPricesForDates||e.lblFallbackNotice;i.textContent=s.replace("{{checkIn}}",E(t)).replace("{{checkOut}}",E(n)).replace("{{date}}",E(t)),i.classList.remove("hidden")}function re(){document.getElementById("availability-fallback-notice")?.classList.add("hidden")}function Xe(e){const t=x();if(!t.length)return;const{checkIn:n,checkOut:i}=_();if(!n||!i||i<=n)return;const s=V(),a=se(),r=a>0?a:1,l=t.reduce((h,b)=>h+b.price*b.qty*r,0),d=t[0]?.currency||"EUR",u=e.booking.rooms.find(h=>h.id===t[0].roomId)?.photos?.[0]||"",p=new URLSearchParams({checkIn:n,checkOut:i,nights:String(a),adults:String(s.adults),children:String(s.children),rooms:String(s.rooms),totalPrice:String(Math.round(l)),currency:d,unitId:t[0].roomId,rateId:t[0].rateId,selections:JSON.stringify(t)});u&&p.set("photo",u);J(n,i,t),window.location.href=`/booking?${p.toString()}`}async function M(e){const{checkIn:t,checkOut:n}=_();if(!t||!n||n<=t)return!1;const i=document.getElementById("availability-results"),s=document.getElementById("availability-loading");i?.classList.remove("hidden"),s?.classList.remove("hidden"),C(ue(t,n));const a=e.booking.rooms;return Ke(e,t,n),s?.classList.add("hidden"),R(!0),I(e),We(a,e),!0}function Ze(e){if(!f()){R(!1),X([]),re(),I(e),S(e),oe(e.booking.rooms,e);return}M(e)}function et(e){const t=e.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!t)return e;const n=(document.documentElement.lang||"en").split("-")[0].toLowerCase(),[,i,s,a]=t;return n==="ro"||n==="de"?`${a}.${s}.${i}`:`${s}/${a}/${i}`}function G(e,t){const n=document.getElementById(e);if(!n)return;const i=n.querySelector(".drp-trigger-text");n.dataset.empty="false",i&&(i.textContent=et(t),i.classList.remove("text-[#717973]"),i.classList.add("text-[#1b1c1c]"))}function tt(){if(f())return;const e=me();if(!e?.selections.length)return;const t=document.getElementById("booking-check-in"),n=document.getElementById("booking-check-out");!t||!n||(t.value=e.checkIn,n.value=e.checkOut,G("booking-check-in-trigger",e.checkIn),G("booking-check-out-trigger",e.checkOut))}function U(){const e=ke();if(!e?.booking?.rooms?.length)return;he(),window.addEventListener("booking:dates-changed",()=>{Ze(e)}),window.addEventListener("booking:guests-changed",()=>{v||Ye()}),document.getElementById("availability-search-btn")?.addEventListener("click",()=>{ze(e)}),document.getElementById("reserve-now-btn")?.addEventListener("click",()=>{x().reduce((s,a)=>s+a.qty,0)!==0&&Xe(e)});const i=()=>{if(tt(),te(),I(e),f()){v||M(e);return}v||oe(e.booking.rooms,e)};i(),requestAnimationFrame(i)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",U):U();
