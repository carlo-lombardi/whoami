// The JSON-RPC conversation between an MCP client and server, one message at a time.
// Names and payloads are synthetic.

const FRAMES = [
  {
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-06-18', clientInfo: { name: 'it-desk-client', version: '1.0.0' } }
  },
  {
    jsonrpc: '2.0', id: 1,
    result: { protocolVersion: '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'it-knowledge', version: '1.0.0' } }
  },
  { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  {
    jsonrpc: '2.0', id: 2,
    result: {
      tools: [{
        name: 'search_knowledge',
        description: 'Hybrid search over resolved incidents and documentation',
        inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
      }]
    }
  },
  {
    jsonrpc: '2.0', id: 3, method: 'tools/call',
    params: { name: 'search_knowledge', arguments: { query: 'vpn sign-in fails after certificate renewal' } }
  },
  {
    jsonrpc: '2.0', id: 3,
    result: { content: [{ type: 'text', text: '3 passages, ranked with BM25 + vector similarity and fused (synthetic example)' }] }
  }
];

export function initMcp({ reducedMotion }) {
  const steps = [...document.querySelectorAll('#mcp-steps li')];
  const frame = document.getElementById('mcp-frame');
  const next = document.getElementById('mcp-next');
  const reset = document.getElementById('mcp-reset');
  if (!steps.length || !frame || !next || !reset) return;

  let current = -1;

  function show(index) {
    current = index;
    steps.forEach((step, i) => {
      step.classList.toggle('done', i < current);
      step.classList.toggle('current', i === current);
    });
    if (current < 0) {
      frame.textContent = 'Press “Next message” to open the connection.';
      next.textContent = 'Next message';
    } else {
      const direction = steps[current].dataset.dir === 'out' ? 'client → server' : 'server → client';
      frame.textContent = `// ${direction}\n${JSON.stringify(FRAMES[current], null, 2)}`;
      next.textContent = current === FRAMES.length - 1 ? 'Start again' : 'Next message';
    }
  }

  next.addEventListener('click', () => show(current === FRAMES.length - 1 ? 0 : current + 1));
  reset.addEventListener('click', () => show(-1));
  show(-1);

  // Open the first message by itself the first time the piece scrolls into view.
  if (reducedMotion) return;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && current < 0) {
      show(0);
      observer.disconnect();
    }
  }, { threshold: 0.6 });
  observer.observe(frame);
}
