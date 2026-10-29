import{o as F,q as R}from"./bookingState.BnExeiNd.js";import{i as z,f as G,j as O,k as N}from"./clientI18n.THOsu3xY.js";function V(t){const e=String(t??"").trim();if(!e)return"";try{const o=new URL(e),i=o.pathname.replace(/-\d+x\d+(?=\.(?:jpe?g|png|webp|gif)$)/i,"").replace(/-scaled(?=\.(?:jpe?g|png|webp|gif)$)/i,"");return`${o.hostname}${i}`.toLowerCase()}catch{return e.split("?")[0].toLowerCase()}}function E(t){const e=new Set,o=[];for(const i of t??[]){const n=String(i??"").trim();if(!n)continue;const r=V(n);!r||e.has(r)||(e.add(r),o.push(n))}return o}const A=5;let p=null,s=null,d=null,b=null,S="",L=null,v=null;const J='a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';function K(){return!s||s.classList.contains("hidden")?[]:Array.from(s.querySelectorAll(J))}function I(){T(),v=t=>{if(t.key!=="Tab"||!s||s.classList.contains("hidden")||document.querySelector(".room-photo-lightbox"))return;const e=K();if(e.length===0)return;const o=e[0],i=e[e.length-1],n=document.activeElement;t.shiftKey?(n===o||!s.contains(n))&&(t.preventDefault(),i.focus()):(n===i||!s.contains(n))&&(t.preventDefault(),o.focus())},document.addEventListener("keydown",v)}function T(){v&&(document.removeEventListener("keydown",v),v=null)}function l(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function P(){const t=document.getElementById("availability-config");if(!t?.textContent)return null;try{const e=JSON.parse(t.textContent);return!e.phone||!e.booking?null:{...e,...z()}}catch{return null}}function U(t){let e=0;for(const o of t){const i=o.beds.match(/^(\d+)/);i?e+=parseInt(i[1],10):o.beds.trim()&&(e+=1)}return e||t.length||null}function w(t,e){return`
    <div class="flex flex-col gap-1 text-center md:text-left min-w-[80px]">
      <span class="font-[Manrope,sans-serif] text-xl font-semibold text-[#012d1d]">${l(t)}</span>
      <span class="font-[Plus_Jakarta_Sans,sans-serif] text-xs font-semibold uppercase tracking-wider text-[#414844]">${l(e)}</span>
    </div>
  `}function $(t,e){return l(t.lblShowPhotos.replace("{{count}}",String(e)))}function Y(t,e){const o=E(t.photos);if(!o.length)return"";const i=o[0],n=o.slice(1,5),r=o.length,m=r>5,u=n.map((c,h)=>{const _=h===n.length-1&&m?`<button type="button" class="room-detail-gallery-more" aria-label="${$(e,r)}">
            <span class="font-[Plus_Jakarta_Sans,sans-serif] text-sm font-semibold flex items-center gap-2">
              <span class="material-symbols-outlined text-base">grid_view</span>
              ${$(e,r)}
            </span>
          </button>`:"";return`<div class="relative group overflow-hidden min-h-[120px]">
        <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="${l(c)}" alt="${l(t.name)}" loading="lazy" />
        ${_}
      </div>`}).join(""),a=r>1?`<button type="button" class="room-detail-gallery-more room-detail-gallery-more--mobile md:hidden w-full mt-3 py-3 rounded-lg border border-[#c1c8c2] bg-white font-[Plus_Jakarta_Sans,sans-serif] text-sm font-semibold text-[#012d1d] flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-base">grid_view</span>
          ${$(e,r)}
        </button>`:"";return`
    <section class="room-detail-section room-detail-section--gallery">
      <div class="room-detail-gallery grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-1.5 rounded-xl overflow-hidden h-[220px] md:h-[320px]">
        <div class="col-span-2 row-span-2 relative group overflow-hidden">
          <img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="${l(i)}" alt="${l(t.name)}" loading="lazy" />
        </div>
        ${u}
      </div>
      ${a}
    </section>
  `}function y(){document.querySelector(".room-photo-lightbox")?.remove()}function C(){!g||!s||(g=!1,y(),b&&(b.innerHTML=""),s.classList.add("hidden"),s.classList.remove("flex"),s.setAttribute("aria-hidden","true"),document.body.style.overflow=S)}function W(t,e){let o=0;const i=t.querySelector(".room-photo-lightbox__hero-image"),n=t.querySelector(".room-photo-lightbox__nav--prev"),r=t.querySelector(".room-photo-lightbox__nav--next"),m=t.querySelector(".room-photo-lightbox__dots"),u=t.querySelectorAll(".room-photo-lightbox__thumb"),a=c=>{o=(c+e.length)%e.length,i&&(i.src=e[o],i.alt=`Photo ${o+1} of ${e.length}`),u.forEach((h,f)=>{h.classList.toggle("room-photo-lightbox__thumb--active",f===o),f===o&&h.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"})}),m?.querySelectorAll(".room-photo-lightbox__dot").forEach((h,f)=>{h.classList.toggle("room-photo-lightbox__dot--active",f===o)}),n&&(n.disabled=e.length<=1),r&&(r.disabled=e.length<=1)};n?.addEventListener("click",()=>a(o-1)),r?.addEventListener("click",()=>a(o+1)),u.forEach(c=>{c.addEventListener("click",()=>{const h=Number(c.dataset.index);Number.isFinite(h)&&a(h)})}),t.addEventListener("keydown",c=>{c.key==="ArrowLeft"?(c.preventDefault(),a(o-1)):c.key==="ArrowRight"&&(c.preventDefault(),a(o+1))}),a(0)}let g=!1;function Q(t){const e=p||P();if(!e||!s||!d)return;const o=e.booking.rooms.find(n=>n.id===t),i=E(o?.photos);i.length&&(s.classList.contains("hidden")&&(g=!0,L=document.activeElement,d.innerHTML="",b&&(b.innerHTML=""),s.classList.remove("hidden"),s.classList.add("flex"),s.setAttribute("aria-hidden","false"),S=document.body.style.overflow,document.body.style.overflow="hidden",I()),M(i,e))}function M(t,e){if(!s||t.length===0)return;y();const o=s.querySelector(".room-detail-shell");if(!o)return;const i=document.createElement("div");i.className="room-photo-lightbox",i.setAttribute("role","dialog"),i.setAttribute("aria-modal","true"),i.setAttribute("aria-label",e.lblShowPhotos.replace("{{count}}",String(t.length))),i.tabIndex=-1;const n=t.map((u,a)=>`<button type="button" class="room-photo-lightbox__thumb${a===0?" room-photo-lightbox__thumb--active":""}" data-index="${a}" aria-label="Photo ${a+1}">
          <img src="${l(u)}" alt="" loading="lazy" />
        </button>`).join(""),r=t.map((u,a)=>`<span class="room-photo-lightbox__dot${a===0?" room-photo-lightbox__dot--active":""}" aria-hidden="true"></span>`).join(""),m=t.length>1;i.innerHTML=`
    <div class="room-photo-lightbox__header flex items-center justify-between gap-4 px-5 py-4 border-b border-[#c1c8c2]/30 bg-[#fbf9f8] shrink-0">
      <h3 class="font-[Manrope,sans-serif] text-lg font-semibold text-[#012d1d]">${$(e,t.length)}</h3>
      <button type="button" class="room-photo-lightbox__close material-symbols-outlined text-[#717973] hover:text-[#012d1d] p-1 rounded-full hover:bg-[#e4e2e1] transition-colors" aria-label="Close">close</button>
    </div>
    <div class="room-photo-lightbox__body flex-1 min-h-0 flex flex-col bg-[#1b1c1c]">
      <div class="room-photo-lightbox__hero relative flex-1 min-h-[220px] md:min-h-[360px] flex items-center justify-center">
        ${m?'<button type="button" class="room-photo-lightbox__nav room-photo-lightbox__nav--prev material-symbols-outlined" aria-label="Previous photo">chevron_left</button>':""}
        <img class="room-photo-lightbox__hero-image max-h-full max-w-full w-full h-full object-contain" src="${l(t[0])}" alt="Photo 1 of ${t.length}" />
        ${m?'<button type="button" class="room-photo-lightbox__nav room-photo-lightbox__nav--next material-symbols-outlined" aria-label="Next photo">chevron_right</button>':""}
        ${m?`<div class="room-photo-lightbox__dots">${r}</div>`:""}
      </div>
      ${m?`<div class="room-photo-lightbox__thumbs shrink-0 bg-[#fbf9f8] border-t border-[#c1c8c2]/30 px-4 py-3 overflow-x-auto">${n}</div>`:""}
    </div>
  `,o.appendChild(i),i.querySelector(".room-photo-lightbox__close")?.addEventListener("click",()=>{if(g){C();return}y()}),W(i,t),i.focus()}function X(t,e){const o=E(t.photos);if(!o.length)return;const i=()=>M(o,e);d?.querySelectorAll(".room-detail-gallery-more").forEach(n=>{n.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),i()})})}function Z(t,e){const o=[];t.sizeM2!=null&&o.push(w(`${t.sizeM2} m²`,e.lblSize));for(const n of t.beds)if(n.area?.trim()){const r=n.beds.match(/^(\d+)/)?.[1]||"1";o.push(w(r,O(n.area)))}t.maxGuests!=null&&o.push(w(String(t.maxGuests),e.lblMaxGuests));const i=U(t.beds);return i!=null&&t.beds.length>1&&o.push(w(String(i),e.lblBedsTotal)),o.length?`
    <section class="room-detail-section room-detail-section--stats">
      <div class="room-detail-stats">${o.join('<div class="room-detail-stats__divider" aria-hidden="true"></div>')}</div>
    </section>
  `:""}function ee(t,e){switch(t){case"essentials":return e.lblAmenityEssentials;case"kitchen":return e.lblAmenityKitchen;case"comfort":return e.lblAmenityComfort;case"outdoor":return e.lblAmenityOutdoor}}function te(t,e){const{groups:o}=F(t);if(!o.length)return"";let i=0;const n=o.map(m=>{const u=m.items.map((a,c)=>{const h=c>=A?" room-detail-amenity-item--extra":"";return c>=A&&(i+=1),R(l(a.label),a.icon,h)}).join("");return`
        <div class="room-detail-amenity-group">
          <h4 class="room-detail-amenity-group__title">${l(ee(m.id,e))}</h4>
          <ul class="room-detail-amenity-group__list">${u}</ul>
        </div>
      `}).join(""),r=i>0?`<button type="button" id="room-detail-amenities-toggle" class="room-detail-amenities-toggle" aria-expanded="true" data-label-more="${l(e.lblShowAllAmenities)}" data-label-less="${l(e.lblHideAmenities)}">
          <span class="room-detail-amenities-toggle__label">${l(e.lblHideAmenities)}</span>
          <span class="material-symbols-outlined room-detail-amenities-toggle__icon" aria-hidden="true">expand_more</span>
        </button>`:"";return`
    <section class="room-detail-section room-detail-section--amenities">
      <div class="room-detail-amenities">
        <div class="room-detail-section__header">
          <h3 class="room-detail-section__title">${l(e.lblAmenities)}</h3>
          <p class="room-detail-section__intro">${l(e.lblAmenitiesIntro)}</p>
        </div>
        <div class="room-detail-amenities__groups">${n}</div>
        ${r}
      </div>
    </section>
  `}function j(t){return t.replace(/\bBoasting\b/gi,"With").replace(/\bGuests will find\b/gi,"You'll find").replace(/\bThe chalet also (features|comes with|provides)\b/gi,"Outside, enjoy").replace(/\bthis air-conditioned chalet (includes|comprises|features)\b/gi,"this inviting chalet offers").replace(/\bwell-equipped kitchenette\b/gi,"thoughtfully equipped kitchenette").replace(/\bwell-fitted kitchenette\b/gi,"thoughtfully equipped kitchenette").replace(/\bfully equipped kitchenette\b/gi,"fully equipped kitchenette").replace(/\bFeaturing a terrace with mountain views, this chalet also offers\b/gi,"From the private terrace, take in mountain views while you enjoy").replace(/\bflat-screen TV with streaming services\b/gi,"a flat-screen TV with streaming").replace(/\s+/g," ").trim()}function oe(t){let e=j(t);return/fireplace/i.test(e)&&(e=e.replace(/this chalet'?s?\s+(?:standout|special)\s+feature\s+is\s+the\s+fireplace\.?/i,"At the heart of the chalet is a cozy fireplace."),e=e.replace(/this chalet'?s?\s+heart\s+is\s+a\s+warming\s+fireplace\.?/i,"At the heart of the chalet is a cozy fireplace.")),e.replace(/^this chalet'?s?\s+/i,"This chalet ").replace(/\s+/g," ").trim()}function B(t){const e=t.filter(n=>!/^the unit has \d+ beds?\.?$/i.test(n.trim()));if(!e.length)return[];if(e.length<=2)return e;const o=Math.ceil(e.length/3),i=[];for(let n=0;n<e.length;n+=o)i.push(e.slice(n,n+o).join(" "));return i.slice(0,3)}function ie(t,e){const o=t.maxGuests;return o==null?null:o<=2?e.lblPerfectForCouples:o<=4?e.lblPerfectForSmall:e.lblPerfectForFamilies}function D(t){return String(t.shortDescription||t.headline||"").trim()}function ne(t){const e=D(t);return e?`<p class="room-detail-lead">${l(e)}</p>`:""}function le(t,e){const o=N(),n=(t.descriptionI18n?.[o]??t.description?.trim()??"").trim(),r=D(t),m=!!(t.siteSlug||t.shortDescription),u=ie(t,e);if(m&&(r||n)){const x=r||n,H=!!n&&n.toLowerCase()!==x.toLowerCase()?`<div class="room-detail-about__body"><p class="room-detail-about__paragraph">${l(n)}</p></div>`:"";return`
    <section class="room-detail-section room-detail-section--about">
      <div class="room-detail-about">
        <div class="room-detail-section__header">
          <h3 class="room-detail-section__title">${l(e.lblAbout)}</h3>
          ${u?`<span class="room-detail-about__badge">${l(u)}</span>`:""}
        </div>
        <div class="room-detail-about__content">
          <p class="room-detail-about__intro">${l(x)}</p>
          ${H}
        </div>
      </div>
    </section>
  `}const a=o==="en"?se(n):n;if(!a)return"";const c=o==="en"?a.split(/(?<=[.!?])\s+/).map(j).filter(Boolean):a.split(/(?<=[.!?])\s+/).filter(Boolean);if(!c.length)return"";const h=o==="en"?oe(c[0]):c[0],_=B(c.slice(1)).map(x=>`<p class="room-detail-about__paragraph">${l(x)}</p>`).join("");return`
    <section class="room-detail-section room-detail-section--about">
      <div class="room-detail-about">
        <div class="room-detail-section__header">
          <h3 class="room-detail-section__title">${l(e.lblAbout)}</h3>
          ${u?`<span class="room-detail-about__badge">${l(u)}</span>`:""}
        </div>
        <div class="room-detail-about__content">
          <p class="room-detail-about__intro">${l(h)}</p>
          ${_?`<div class="room-detail-about__body">${_}</div>`:""}
        </div>
      </div>
    </section>
  `}function se(t){return t.replace(/^this (?:chalet|room|unit)\.\s*/i,"").trim()}function re(t,e){const o=`tel:${e.phone.replace(/\s/g,"")}`;return`
    <div class="room-detail-footer__inner">
      <div class="room-detail-footer__actions">
        <button type="button" id="room-detail-check-availability" class="room-detail-cta room-detail-cta--primary" data-room-id="${l(t.id)}">
          ${l(e.lblCheckAvailability)}
        </button>
        <a href="${l(o)}" class="room-detail-cta room-detail-cta--secondary">
          <span class="material-symbols-outlined room-detail-cta__icon" aria-hidden="true">call</span>
          ${l(e.lblCall)}
        </a>
      </div>
      <p class="room-detail-footer__trust">${l(e.lblTrustLine)}</p>
    </div>
  `}function ae(t){return t.beds.length?t.beds.map(e=>{const o=G(e.area,e.beds);return`<p class="room-detail-bed-line">
        <span class="material-symbols-outlined room-detail-bed-line__icon" aria-hidden="true">bed</span>
        <span>${l(o)}</span>
      </p>`}).join(""):""}function ce(t,e){return`
    <div class="room-detail-inner">
      <header class="room-detail-header">
        <div class="room-detail-header__main">
          <h2 id="room-detail-title" class="room-detail-header__title">${l(t.name)}</h2>
          ${ne(t)}
          ${ae(t)}
        </div>
        <button type="button" id="room-detail-close" class="room-detail-header__close material-symbols-outlined" aria-label="${l(e.lblClose)}">close</button>
      </header>
      ${Y(t,e)}
      ${Z(t,e)}
      ${te(t,e)}
      ${le(t,e)}
    </div>
  `}function de(){const t=d?.querySelector("#room-detail-amenities-toggle"),e=d?.querySelector(".room-detail-amenities");!t||!e||t.addEventListener("click",()=>{const o=e.classList.toggle("room-detail-amenities--collapsed");t.setAttribute("aria-expanded",o?"false":"true");const i=t.querySelector(".room-detail-amenities-toggle__label");i&&(i.textContent=o?t.dataset.labelMore||"":t.dataset.labelLess||"")})}function ue(t){k(),document.getElementById("booking")?.scrollIntoView({behavior:"smooth",block:"start"}),window.setTimeout(()=>{const o=document.querySelector(`[data-room-card="${t}"]`);o&&(o.scrollIntoView({behavior:"smooth",block:"center"}),o.classList.add("room-card--focus-pulse"),window.setTimeout(()=>o.classList.remove("room-card--focus-pulse"),1800)),document.getElementById("booking-check-in")?.value||document.getElementById("booking-check-in-trigger")?.focus()},320)}function me(t){b?.querySelector("#room-detail-check-availability")?.addEventListener("click",()=>{ue(t.id)})}function he(t){if(!p||!s||!d)return;const e=p.booking.rooms.find(i=>i.id===t);if(!e)return;L=document.activeElement,d.innerHTML=ce(e,p),b&&(b.innerHTML=re(e,p)),d.querySelector("#room-detail-close")?.addEventListener("click",k),X(e,p),de(),me(e),be(),s.classList.remove("hidden"),s.classList.add("flex"),s.setAttribute("aria-hidden","false"),S=document.body.style.overflow,document.body.style.overflow="hidden",I(),d.querySelector("#room-detail-close")?.focus()}function be(){const t=s?.querySelector(".room-detail-shell"),o=s?.querySelector(".room-detail-body")||t;if(!d||!o)return;const i=()=>{const n=d.scrollHeight-d.scrollTop-d.clientHeight;o.dataset.scrolledEnd=n<=8?"true":"false",t&&t!==o&&(t.dataset.scrolledEnd=o.dataset.scrolledEnd)};d.addEventListener("scroll",i,{passive:!0}),requestAnimationFrame(i)}function k(){s&&(g=!1,y(),T(),b&&(b.innerHTML=""),s.classList.add("hidden"),s.classList.remove("flex"),s.setAttribute("aria-hidden","true"),document.body.style.overflow=S,L?.focus?.(),L=null)}function q(){if(p=P(),!p?.booking?.rooms?.length||(s=document.getElementById("room-detail-modal"),d=document.getElementById("room-detail-content"),b=document.getElementById("room-detail-footer"),!s||!d))return;document.getElementById("room-detail-backdrop")?.addEventListener("click",k),document.addEventListener("keydown",e=>{if(!(e.key!=="Escape"||!s||s.classList.contains("hidden"))){if(document.querySelector(".room-photo-lightbox")){g?C():y();return}k()}}),document.getElementById("availability-room-list")?.addEventListener("click",e=>{const o=e.target.closest(".room-photo-trigger");if(o){e.preventDefault(),e.stopPropagation();const i=o.dataset.roomId;i&&Q(i)}}),document.addEventListener("click",e=>{const o=e.target.closest(".room-detail-trigger");if(!o)return;e.preventDefault();const i=o.dataset.roomId;i&&he(i)})}typeof document<"u"&&(document.readyState==="loading"?document.addEventListener("DOMContentLoaded",q):q());
