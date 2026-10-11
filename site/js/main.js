import { initMesh } from './mesh.js';
import { initSearch } from './search.js';
import { initMcp } from './mcp.js';
import { initGuardrail } from './guardrail.js';
import { initIdentity } from './identity.js';
import { initCertificates } from './certificates.js';
import { initStamp } from './stamp.js';

document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Each piece is independent: one failing must not take the others down.
const pieces = [initMesh, initSearch, initMcp, initGuardrail, initIdentity, initCertificates, initStamp];
for (const init of pieces) {
  try {
    init({ reducedMotion });
  } catch (error) {
    console.error(`${init.name} failed`, error);
  }
}
