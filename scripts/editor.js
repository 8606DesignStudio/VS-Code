// editor.js - lazy loaded editor for SVG overlays
(function(){
  // create a simple floating panel
  const panel = document.createElement('div');
  panel.id = 'editorPanel';
  panel.style.position = 'fixed';
  panel.style.top = '12px';
  panel.style.right = '12px';
  panel.style.zIndex = '10000';
  panel.style.background = 'rgba(0,0,0,0.85)';
  panel.style.color = '#fff';
  panel.style.padding = '10px';
  panel.style.borderRadius = '6px';
  panel.style.width = '300px';
  panel.style.fontFamily = 'sans-serif';

  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <strong>Overlay Editor</strong>
      <button id="closeEditor" style="background:#fff;color:#000;border:none;padding:4px 8px;cursor:pointer">Close</button>
    </div>
  <div id="pickHint" style="font-size:13px;margin-bottom:8px">Click "Pick" then click the image to set points A → D in order.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
      <label>Point A X<input id="p0x" type="number"></label>
      <label>Point A Y<input id="p0y" type="number"></label>
      <label>Point B X<input id="p1x" type="number"></label>
      <label>Point B Y<input id="p1y" type="number"></label>
      <label>Point C X<input id="p2x" type="number"></label>
      <label>Point C Y<input id="p2y" type="number"></label>
      <label>Point D X<input id="p3x" type="number"></label>
      <label>Point D Y<input id="p3y" type="number"></label>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <button id="pickPoint">Pick</button>
      <button id="saveOverlay">Save</button>
      <button id="resetOverlay">Reset</button>
    </div>
    <div style="margin-bottom:6px">Button label: <input id="btnLabel" type="text" style="width:100%"></div>
    <div style="font-size:12px;opacity:0.8">Changes are saved to localStorage.</div>
  `;

  document.body.appendChild(panel);

  const img = document.getElementById('cockpitImg');
  const svgContainer = document.getElementById('svgContainer');

  // fetch external svg and insert into container as inline SVG so we can edit its nodes
  async function loadSvg(){
    if(document.getElementById('overlaySvg')) return document.getElementById('overlaySvg');
    const res = await fetch('assets/overlay.svg');
    const text = await res.text();
    svgContainer.innerHTML = text; // now svg nodes are in DOM
    return document.getElementById('overlaySvg');
  }

  // defaults
  let trapezoid = [ [400,50], [1500,50], [1400,950], [500,950] ];
  let btnAnchor = { x: 950, y: 500 };

  try{
    const saved = JSON.parse(localStorage.getItem('cockpitSvgCfg') || 'null');
    if(saved){ if(saved.trapezoid) trapezoid = saved.trapezoid; if(saved.btnAnchor) btnAnchor = saved.btnAnchor; }
  }catch(e){}

  // helpers to update inputs
  function writeInputs(){
    trapezoid.forEach((p,i)=>{
      document.getElementById('p'+i+'x').value = p[0];
      document.getElementById('p'+i+'y').value = p[1];
    });
  }

  function readInputs(){
    trapezoid = [0,1,2,3].map(i=>[
      Number(document.getElementById('p'+i+'x').value)||0,
      Number(document.getElementById('p'+i+'y').value)||0
    ]);
  }

  // wire up events after svg is loaded
  loadSvg().then(svg=>{
    const poly = document.getElementById('overlayPoly');
    const fo = document.getElementById('svgButtonFO');
    const btn = fo.querySelector('button');
    const labelInput = document.getElementById('btnLabel');

    // set initial values
    writeInputs();
    labelInput.value = btn.textContent || 'Start Engine';

    function updateOverlay(){
      if(!img.naturalWidth) return;
      svg.setAttribute('viewBox', `0 0 ${img.naturalWidth} ${img.naturalHeight}`);
      poly.setAttribute('points', trapezoid.map(p=>p.join(',')).join(' '));
      const foW = Math.max(80, Math.round(img.naturalWidth * 0.08));
      const foH = Math.max(32, Math.round(foW * 0.36));
      fo.setAttribute('width', foW);
      fo.setAttribute('height', foH);
      fo.setAttribute('x', btnAnchor.x - foW/2);
      fo.setAttribute('y', btnAnchor.y - foH/2);
      svg.style.pointerEvents = 'auto';
      fo.style.pointerEvents = 'auto';
    }

    // click pick handler — require exactly 4 clicks in order (A->D)
    let pickIndex = null;
    const pickBtn = document.getElementById('pickPoint');
    const pickHint = document.getElementById('pickHint');
    pickBtn.addEventListener('click', ()=>{
      pickIndex = 0; // start with point A
      pickHint.textContent = 'Picking mode: click image for Point A';
      pickBtn.disabled = true;
    });

    img.addEventListener('click', function(e){
      if(pickIndex === null) return; // not picking
      const r = img.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * img.naturalWidth;
      const py = (e.clientY - r.top)  / r.height * img.naturalHeight;
      trapezoid[pickIndex] = [Math.round(px), Math.round(py)];
      writeInputs();
      updateOverlay();
      pickIndex++;
      if(pickIndex <= 3){
        const name = ['A','B','C','D'][pickIndex];
        pickHint.textContent = `Picking mode: click image for Point ${name}`;
      } else {
        // finished
        pickIndex = null;
        pickHint.textContent = 'Pick complete — saved to localStorage';
        pickBtn.disabled = false;
        localStorage.setItem('cockpitSvgCfg', JSON.stringify({ trapezoid, btnAnchor }));
      }
    });

    document.getElementById('saveOverlay').addEventListener('click', ()=>{
      readInputs();
      trapezoid.forEach((p,i)=>{ document.getElementById('p'+i+'x').value = p[0]; document.getElementById('p'+i+'y').value = p[1]; });
      localStorage.setItem('cockpitSvgCfg', JSON.stringify({ trapezoid, btnAnchor }));
      alert('Saved');
      updateOverlay();
    });

    document.getElementById('resetOverlay').addEventListener('click', ()=>{
      trapezoid = [ [400,50], [1500,50], [1400,950], [500,950] ];
      btnAnchor = { x: 950, y: 500 };
      writeInputs();
      localStorage.removeItem('cockpitSvgCfg');
      updateOverlay();
    });

    // label change
    labelInput.addEventListener('input', ()=>{
      btn.textContent = labelInput.value || 'Start Engine';
      localStorage.setItem('cockpitSvgCfg', JSON.stringify({ trapezoid, btnAnchor }));
    });

    // allow moving button by ctrl+click on image
    img.addEventListener('click', function(e){
      if(!e.ctrlKey) return; // ctrl+click moves the button
      const r = img.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width * img.naturalWidth;
      const py = (e.clientY - r.top)  / r.height * img.naturalHeight;
      btnAnchor = { x: Math.round(px), y: Math.round(py) };
      localStorage.setItem('cockpitSvgCfg', JSON.stringify({ trapezoid, btnAnchor }));
      updateOverlay();
    });

    img.addEventListener('load', updateOverlay);
    window.addEventListener('resize', updateOverlay);
    if(img.complete) updateOverlay();

    document.getElementById('closeEditor').addEventListener('click', ()=>panel.remove());
  });
})();
