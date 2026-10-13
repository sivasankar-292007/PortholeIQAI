/**
 * Pre-rendered SVG Data URLs representing realistic road test scenarios:
 * 1. Severe pothole on two-lane road (matching the presentation & video)
 * 2. Medium road surface crater
 * 3. Repaired fresh asphalt patch (for after-repair proof)
 * 4. Normal smooth road (for testing AI rejection of non-damaged roads)
 * 5. Clean highway (for testing normal road detection)
 */

export const SAMPLE_IMAGES = {
  // Severe pothole on road matching the presentation slide 1, 7 & video
  severePothole: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#70b4e0"/>
          <stop offset="100%" stop-color="#b8e2f2"/>
        </linearGradient>
        <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#488c42"/>
          <stop offset="100%" stop-color="#3b7436"/>
        </linearGradient>
        <radialGradient id="crater" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#0a0a0c"/>
          <stop offset="65%" stop-color="#18191e"/>
          <stop offset="85%" stop-color="#2d2f36"/>
          <stop offset="100%" stop-color="#474a52"/>
        </radialGradient>
        <radialGradient id="shadow" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.95"/>
          <stop offset="70%" stop-color="#141416" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#33353c" stop-opacity="0.2"/>
        </radialGradient>
      </defs>
      
      <!-- Sky -->
      <rect width="800" height="260" fill="url(#sky)" />
      <!-- Landscape background -->
      <rect y="240" width="800" height="360" fill="url(#grass)" />
      <circle cx="120" cy="245" r="45" fill="#32632e" />
      <circle cx="160" cy="240" r="35" fill="#3f7c3a" />
      <circle cx="680" cy="245" r="50" fill="#32632e" />
      <circle cx="730" cy="240" r="40" fill="#3f7c3a" />

      <!-- Road perspective -->
      <polygon points="340,250 460,250 780,600 20,600" fill="#333742" />

      <!-- Road lane stripes -->
      <polygon points="396,250 404,250 405,280 395,280" fill="#eab308" />
      <polygon points="395,300 405,300 407,340 393,340" fill="#eab308" />
      <polygon points="393,365 407,365 410,420 390,420" fill="#eab308" />
      <polygon points="389,455 411,455 415,530 385,530" fill="#eab308" />

      <!-- Road cracks leading to pothole -->
      <path d="M 430 420 Q 470 410 490 430 T 520 440" stroke="#1f2229" stroke-width="4" fill="none" />
      <path d="M 330 460 Q 360 470 380 460 T 410 480" stroke="#1f2229" stroke-width="4" fill="none" />
      <path d="M 460 520 Q 490 530 510 510" stroke="#22252c" stroke-width="3" fill="none" />

      <!-- Pothole crater outer rim -->
      <ellipse cx="450" cy="475" rx="145" ry="58" fill="#1f222a" />
      <!-- Deep cavity -->
      <ellipse cx="445" cy="478" rx="130" ry="48" fill="url(#crater)" />
      <ellipse cx="440" cy="482" rx="105" ry="36" fill="url(#shadow)" />
      <!-- Jagged fractured edge highlights -->
      <path d="M 320 472 Q 360 450 420 452 T 510 455 Q 570 465 580 482 Q 570 515 510 525 T 390 522 Q 330 505 320 472 Z" 
            stroke="#5c606b" stroke-width="2.5" fill="none" stroke-dasharray="8,4" />
      <!-- Broken asphalt rubble chunks -->
      <circle cx="560" cy="470" r="5" fill="#585c66" />
      <circle cx="545" cy="460" r="4" fill="#42454e" />
      <circle cx="340" cy="490" r="6" fill="#585c66" />
      <circle cx="330" cy="475" r="4" fill="#6d727f" />
    </svg>
  `)}`,

  // Moderate pothole
  moderatePothole: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <radialGradient id="mod-crater" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#111215"/>
          <stop offset="80%" stop-color="#2a2c33"/>
          <stop offset="100%" stop-color="#4a4d57"/>
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="#3b3f49" />
      <!-- White line markings -->
      <line x1="120" y1="0" x2="120" y2="600" stroke="#f1f5f9" stroke-width="14" stroke-dasharray="40 30" />
      <!-- Asphalt texture spots -->
      <circle cx="300" cy="200" r="3" fill="#2d3038" />
      <circle cx="550" cy="180" r="4" fill="#2d3038" />
      <circle cx="620" cy="420" r="3" fill="#2d3038" />
      
      <!-- Moderate crater -->
      <ellipse cx="420" cy="320" rx="95" ry="50" fill="#22242a" />
      <ellipse cx="415" cy="322" rx="80" ry="40" fill="url(#mod-crater)" />
      <!-- Cracks -->
      <path d="M 330 315 L 290 300 L 260 310" stroke="#1c1d22" stroke-width="3" fill="none" />
      <path d="M 500 325 L 540 340 L 580 330" stroke="#1c1d22" stroke-width="3" fill="none" />
      <path d="M 430 365 L 440 410" stroke="#1c1d22" stroke-width="2.5" fill="none" />
    </svg>
  `)}`,

  // Clean normal road (AI should reject as NORMAL ROAD)
  normalRoad: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <linearGradient id="sky-norm" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#60a5fa"/>
          <stop offset="100%" stop-color="#bae6fd"/>
        </linearGradient>
      </defs>
      <rect width="800" height="260" fill="url(#sky-norm)" />
      <rect y="240" width="800" height="360" fill="#22c55e" />
      <!-- Pristine highway -->
      <polygon points="340,250 460,250 780,600 20,600" fill="#374151" />
      <!-- Crisp yellow dashed lines -->
      <polygon points="397,250 403,250 404,280 396,280" fill="#facc15" />
      <polygon points="396,300 404,300 406,340 394,340" fill="#facc15" />
      <polygon points="394,365 406,365 408,420 392,420" fill="#facc15" />
      <polygon points="391,455 409,455 412,530 388,530" fill="#facc15" />
      <!-- White boundary shoulder lines -->
      <polygon points="345,250 348,250 40,600 34,600" fill="#ffffff" />
      <polygon points="452,250 455,250 766,600 760,600" fill="#ffffff" />
    </svg>
  `)}`,

  // Clean concrete street
  cleanStreet: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <rect width="800" height="600" fill="#64748b" />
      <!-- Pavement blocks and road markings -->
      <line x1="0" y1="300" x2="800" y2="300" stroke="#cbd5e1" stroke-width="12" stroke-dasharray="60 40" />
      <line x1="0" y1="50" x2="800" y2="50" stroke="#94a3b8" stroke-width="4" />
      <line x1="0" y1="550" x2="800" y2="550" stroke="#94a3b8" stroke-width="4" />
      <text x="400" y="450" fill="#475569" font-family="sans-serif" font-size="22" text-anchor="middle" font-weight="600">SMOOTH RESIDENTIAL PAVEMENT (NO DAMAGE)</text>
    </svg>
  `)}`,

  // Repaired road (Fresh dark bitumen asphalt patch + sealed edges)
  repairedRoad: `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <linearGradient id="sky-rep" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#70b4e0"/>
          <stop offset="100%" stop-color="#b8e2f2"/>
        </linearGradient>
      </defs>
      <rect width="800" height="260" fill="url(#sky-rep)" />
      <rect y="240" width="800" height="360" fill="#3b7436" />
      <polygon points="340,250 460,250 780,600 20,600" fill="#333742" />

      <!-- Yellow road markings repainted -->
      <polygon points="396,250 404,250 405,280 395,280" fill="#eab308" />
      <polygon points="395,300 405,300 407,340 393,340" fill="#eab308" />
      <polygon points="393,365 407,365 410,420 390,420" fill="#eab308" />
      <polygon points="389,455 411,455 415,530 385,530" fill="#eab308" />

      <!-- Professional freshly hot-mixed asphalt patch with rubberized bitumen seam sealant -->
      <polygon points="310,450 590,440 610,530 290,545" fill="#18191e" />
      <!-- Seam outline -->
      <polygon points="310,450 590,440 610,530 290,545" stroke="#000000" stroke-width="6" fill="none" />
      <!-- Fresh compact roller lines -->
      <line x1="320" y1="480" x2="590" y2="470" stroke="#252830" stroke-width="8" stroke-opacity="0.7" />
      <line x1="310" y1="510" x2="600" y2="500" stroke="#252830" stroke-width="8" stroke-opacity="0.7" />
      <!-- Repainted yellow lane directly over the new patch -->
      <polygon points="389,455 411,455 415,530 385,530" fill="#fbbf24" />
      <!-- Official municipal verification stamp -->
      <circle cx="520" cy="485" r="28" fill="#15803d" stroke="#ffffff" stroke-width="2"/>
      <path d="M 508 485 L 516 493 L 532 477" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `)}`
};
