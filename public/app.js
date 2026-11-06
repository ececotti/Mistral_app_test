const chatEl = document.getElementById('chat');
const form = document.getElementById('composer');
const input = document.getElementById('message');
const sendBtn = document.getElementById('send');

const history = [];

function addMessage(role, text) {
  const msg = document.createElement('div');
  msg.className = `msg ${role}`;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  msg.appendChild(bubble);
  chatEl.appendChild(msg);
  chatEl.scrollTop = chatEl.scrollHeight;
  return msg;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  input.disabled = true;
  sendBtn.disabled = true;

  addMessage('user', text);
  history.push({ role: 'user', content: text });
  const pending = addMessage('assistant', '…');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    pending.querySelector('.bubble').textContent = data.reply;
    history.push({ role: 'assistant', content: data.reply });
  } catch (err) {
    pending.classList.add('error');
    pending.querySelector('.bubble').textContent = `Error: ${err.message}`;
  } finally {
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
    chatEl.scrollTop = chatEl.scrollHeight;
  }
});
