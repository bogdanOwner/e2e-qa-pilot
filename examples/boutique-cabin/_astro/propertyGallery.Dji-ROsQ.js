function u(t){return t.startsWith("http://")||t.startsWith("https://")}function y(t){return u(t)||t.startsWith("/")?t:`/gallery/${t}`}function b(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function d(){document.querySelector(".property-photo-lightbox")?.remove(),document.body.classList.remove("property-photo-lightbox-open")}function g(t,r){let e=0;const i=t.querySelector(".property-photo-lightbox__hero-image"),p=t.querySelector(".property-photo-lightbox__nav--prev"),l=t.querySelector(".property-photo-lightbox__nav--next"),s=t.querySelector(".property-photo-lightbox__dots"),n=t.querySelectorAll(".property-photo-lightbox__thumb"),c=o=>{e=(o+r.length)%r.length,i&&(i.removeAttribute("width"),i.removeAttribute("height"),i.src=y(r[e]),i.alt=`Photo ${e+1} of ${r.length}`),n.forEach((a,h)=>{a.classList.toggle("property-photo-lightbox__thumb--active",h===e),h===e&&a.scrollIntoView({behavior:"smooth",block:"nearest",inline:"center"})}),s?.querySelectorAll(".property-photo-lightbox__dot").forEach((a,h)=>{a.classList.toggle("property-photo-lightbox__dot--active",h===e)}),p&&(p.disabled=r.length<=1),l&&(l.disabled=r.length<=1)};p?.addEventListener("click",()=>c(e-1)),l?.addEventListener("click",()=>c(e+1)),n.forEach(o=>{o.addEventListener("click",()=>{const a=Number(o.dataset.index);Number.isFinite(a)&&c(a)})}),t.addEventListener("keydown",o=>{o.key==="Escape"?(o.preventDefault(),d()):o.key==="ArrowLeft"?(o.preventDefault(),c(e-1)):o.key==="ArrowRight"&&(o.preventDefault(),c(e+1))}),t.addEventListener("click",o=>{o.target===t.querySelector(".property-photo-lightbox__backdrop")&&d()}),c(0)}function _(t,r){if(t.length===0)return;d();const e=document.createElement("div");e.className="property-photo-lightbox",e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.setAttribute("aria-label",r),e.tabIndex=-1;const i=t.map((s,n)=>`<button type="button" class="property-photo-lightbox__thumb${n===0?" property-photo-lightbox__thumb--active":""}" data-index="${n}" aria-label="Photo ${n+1}">
          <img src="${b(y(s))}" alt="" loading="lazy" referrerpolicy="no-referrer" />
        </button>`).join(""),p=t.map((s,n)=>`<span class="property-photo-lightbox__dot${n===0?" property-photo-lightbox__dot--active":""}" aria-hidden="true"></span>`).join(""),l=t.length>1;e.innerHTML=`
    <div class="property-photo-lightbox__backdrop" aria-hidden="true"></div>
    <div class="property-photo-lightbox__panel">
      <div class="property-photo-lightbox__header">
        <h3 class="property-photo-lightbox__title">${b(r)}</h3>
        <button type="button" class="property-photo-lightbox__close material-symbols-outlined" aria-label="Close">close</button>
      </div>
      <div class="property-photo-lightbox__body">
        <div class="property-photo-lightbox__hero">
          ${l?'<button type="button" class="property-photo-lightbox__nav property-photo-lightbox__nav--prev material-symbols-outlined" aria-label="Previous photo">chevron_left</button>':""}
          <img class="property-photo-lightbox__hero-image" src="${b(y(t[0]))}" alt="Photo 1 of ${t.length}" referrerpolicy="no-referrer" />
          ${l?'<button type="button" class="property-photo-lightbox__nav property-photo-lightbox__nav--next material-symbols-outlined" aria-label="Next photo">chevron_right</button>':""}
          ${l?`<div class="property-photo-lightbox__dots">${p}</div>`:""}
        </div>
        ${l?`<div class="property-photo-lightbox__thumbs">${i}</div>`:""}
      </div>
    </div>
  `,document.body.appendChild(e),document.body.classList.add("property-photo-lightbox-open"),e.querySelector(".property-photo-lightbox__close")?.addEventListener("click",d),g(e,t),e.focus()}function v(t,r,e){if(!t||r.length===0)return;const i=()=>_(r,e);t.querySelectorAll(".property-gallery-more").forEach(p=>{p.addEventListener("click",l=>{l.preventDefault(),i()})})}export{v as w};
