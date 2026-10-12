// Joiner, mover, leaver: access follows group membership, so one change rewires the graph.

const STATES = {
  joiner: {
    edges: ['u-all', 'u-wh', 'all-vpn', 'all-lap', 'wh-mb'],
    nodes: ['user', 'all', 'wh', 'vpn', 'lap', 'mb'],
    note: 'Joiner: account created, licence assigned, added to groups, laptop enrolled. Access comes from group membership.'
  },
  mover: {
    edges: ['u-all', 'u-fin', 'all-vpn', 'all-lap', 'fin-sp'],
    nodes: ['user', 'all', 'fin', 'vpn', 'lap', 'sp'],
    note: 'Mover: one group swapped for another. The old mailbox access is removed when the new site access is added.'
  },
  leaver: {
    edges: [],
    nodes: [],
    note: 'Leaver: sign-in blocked, sessions revoked, groups removed, licence released, device retired. Every path to a resource is gone.'
  }
};

export function initIdentity() {
  const demo = document.getElementById('identity-demo');
  if (!demo) return;
  const note = document.getElementById('identity-note');
  const buttons = [...demo.querySelectorAll('button[data-state]')];
  const edges = [...demo.querySelectorAll('[data-edge]')];
  const nodes = [...demo.querySelectorAll('[data-node]')];

  function apply(name) {
    const state = STATES[name];
    demo.dataset.state = name;
    edges.forEach((edge) => edge.classList.toggle('on', state.edges.includes(edge.dataset.edge)));
    nodes.forEach((node) => {
      node.classList.toggle('on', state.nodes.includes(node.dataset.node));
      node.classList.toggle('gone', name === 'leaver' && node.dataset.node === 'user');
    });
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.state === name)));
    note.textContent = state.note;
  }

  buttons.forEach((button) => button.addEventListener('click', () => apply(button.dataset.state)));
}
