const items = document.querySelectorAll('.nav-item');

items.forEach(item => {
  item.addEventListener('click', () => {
    // Удаляем класс active у всех
    items.forEach(i => i.classList.remove('active'));
    // Добавляем текущему
    item.classList.add('active');
  });
});



// Находим все кнопки быстрых действий
const quickActionBtns = document.querySelectorAll('.quick-action-btn');

quickActionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.textContent.trim(); // Получаем текст кнопки
        if (chatInput) {
            chatInput.value = text; // Вставляем текст в поле
            
            // --- ДОБАВЬТЕ ЭТИ СТРОКИ НИЖЕ ---
            const chatForm = document.getElementById('chat-form');
            if (chatForm) {
                // Создаем и вызываем событие отправки
                const event = new Event('submit', { cancelable: true });
                chatForm.dispatchEvent(event);
            }
            // -------------------------------
        }
    });
});



(() => {





  
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const messages = document.getElementById("chat-messages");
  const sendButton = document.getElementById("chat-send");
  const stopButton = document.getElementById("chat-stop");
  const botIndicator = document.getElementById("bot-indicator");
  const scrollLatest = document.getElementById("scroll-latest");
  const quickChips = document.querySelectorAll(".quick-chip");

  if (!form || !input || !messages || !sendButton || !stopButton || !botIndicator || !scrollLatest) return;

  const replies = [
    "Отлично, вижу задачу. Предлагаю сначала определить MVP, затем приоритизировать функции по влиянию на бизнес.",
    "Можно сделать так: готовим четкую структуру интерфейса, добавляем интерактив и проверяем на мобильных экранах.",
    "Соберем решение в современном стиле: минимализм, воздух, строгая сетка и акцентные CTA-элементы.",
    "Предлагаю разбить работу на этапы: дизайн-система, основной сценарий, интеграции и финальная оптимизация.",
  ];

  let isBusy = false;
  let activeController = null;
  let stickToBottom = true;
  const INPUT_MIN_HEIGHT = 44;
  const INPUT_MAX_HEIGHT = 160;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const autoResizeInput = () => {
    input.style.height = "auto";
    const nextHeight = Math.min(input.scrollHeight, INPUT_MAX_HEIGHT);
    input.style.height = `${Math.max(nextHeight, INPUT_MIN_HEIGHT)}px`;
    input.style.overflowY = input.scrollHeight > INPUT_MAX_HEIGHT ? "auto" : "hidden";
  };

  const clearInput = () => {
    input.value = "";
    input.style.height = `${INPUT_MIN_HEIGHT}px`;
    input.style.overflowY = "hidden";
  };

  const formatTime = (date = new Date()) => {
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const distanceFromBottom = () => messages.scrollHeight - messages.scrollTop - messages.clientHeight;

  const updateScrollState = () => {
    const distance = distanceFromBottom();
    stickToBottom = distance < 56;
    scrollLatest.hidden = distance < 140;
  };

  const scrollToBottom = (force = false, smooth = true) => {
    if (!force && !stickToBottom) {
      updateScrollState();
      return;
    }

    try {
      messages.scrollTo({
        top: messages.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    } catch {
      messages.scrollTop = messages.scrollHeight;
    }

    setTimeout(updateScrollState, 0);
  };

  const setBusy = (busy) => {
    isBusy = busy;
    sendButton.disabled = busy;
    stopButton.hidden = !busy;
    botIndicator.hidden = !busy;

    quickChips.forEach((chip) => {
      chip.disabled = busy;
      chip.style.opacity = busy ? "0.62" : "1";
      chip.style.pointerEvents = busy ? "none" : "auto";
    });
  };

  const copyToClipboard = async (text) => {
    if (!text) return false;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const copied = document.execCommand("copy");
        area.remove();
        return copied;
      } catch {
        return false;
      }
    }
  };

  const getTypeDelay = (char) => {
    if (char === " ") return 22;
    if (char === "," || char === ".") return 130;
    if (char === "—" || char === ":" || char === "!" || char === "?") return 170;
    return 28 + Math.random() * 24;
  };

  const createMeta = (role, messageText, timeText) => {
    const meta = document.createElement("div");
    meta.className = "message__meta";

    const time = document.createElement("time");
    time.className = "message__time";
    time.textContent = timeText;
    meta.appendChild(time);

    if (role === "bot") {
      const copy = document.createElement("button");
      copy.type = "button";
      copy.className = "message__copy";
      copy.textContent = "Копировать";
      copy.dataset.copyText = messageText;
      meta.appendChild(copy);
    }

    return meta;
  };

  const buildMessage = (role, text = "", forceScroll = false) => {
    const node = document.createElement("article");
    node.className = `message message--${role} message--enter`;

    if (role === "bot") {
      const avatar = document.createElement("img");
      avatar.className = "message__avatar";
      avatar.src = "./assets/mascot.png";
      avatar.alt = "Маскот";
      node.appendChild(avatar);
    }

    const content = document.createElement("div");
    content.className = "message__content";

    const bubble = document.createElement("div");
    bubble.className = "message__bubble";
    bubble.textContent = text;
    content.appendChild(bubble);

    const meta = createMeta(role, text, formatTime());
    content.appendChild(meta);

    node.appendChild(content);
    node.dataset.copyText = text;

    messages.appendChild(node);

    setTimeout(() => {
      node.classList.remove("message--enter");
    }, 360);

    scrollToBottom(forceScroll);

    return { node, bubble, meta };
  };

  const createTyping = () => {
    const typing = document.createElement("article");
    typing.className = "message message--bot message--typing message--enter";

    const avatar = document.createElement("img");
    avatar.className = "message__avatar";
    avatar.src = "./assets/mascot.png";
    avatar.alt = "Маскот";

    const content = document.createElement("div");
    content.className = "message__content";

    const bubble = document.createElement("div");
    bubble.className = "message__bubble";
    bubble.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';

    const meta = createMeta("bot", "", formatTime());
    const copy = meta.querySelector(".message__copy");
    if (copy) copy.remove();

    content.append(bubble, meta);
    typing.append(avatar, content);

    messages.appendChild(typing);

    setTimeout(() => typing.classList.remove("message--enter"), 360);

    scrollToBottom();

    return typing;
  };

  const delayWithAbort = async (ms, controller) => {
    const step = 34;
    let elapsed = 0;

    while (elapsed < ms) {
      if (controller.stopRequested) return false;
      await sleep(step);
      elapsed += step;
    }

    return !controller.stopRequested;
  };

  const typeBotMessage = async (bubble, text, controller) => {
    if (!text) {
      bubble.textContent = "";
      return "";
    }

    bubble.innerHTML = '<span class="typed-text"></span><span class="type-cursor"></span>';
    const typed = bubble.querySelector(".typed-text");
    const cursor = bubble.querySelector(".type-cursor");

    if (!typed || !cursor) {
      bubble.textContent = text;
      return text;
    }

    bubble.classList.add("is-typing");

    const chars = Array.from(text);

    for (let index = 0; index < chars.length; index += 1) {
      if (controller.stopRequested) break;

      const char = chars[index];

      if (char === " ") {
        typed.appendChild(document.createTextNode(" "));
      } else {
        const charNode = document.createElement("span");
        charNode.className = "typed-char";
        charNode.textContent = char;
        typed.appendChild(charNode);
      }

      scrollToBottom();
      await sleep(getTypeDelay(char));
    }

    bubble.classList.remove("is-typing");
    if (cursor && cursor.parentNode) cursor.remove();

    const finalText = typed.textContent || "";

    if (controller.stopRequested) {
      if (!finalText.trim()) {
        bubble.textContent = "Остановлено.";
        return "Остановлено.";
      }
      return finalText;
    }

    return finalText;
  };

  const generateReply = (text) => {
    const value = text.toLowerCase();

    if (value.includes("цена") || value.includes("стоимость")) {
      return "Чтобы оценить стоимость, напиши сроки, объем и стек. Я сразу предложу реалистичный диапазон и этапы работ.";
    }

    if (value.includes("сайт") || value.includes("лендинг")) {
      return "Сделаем. Предлагаю современный лендинг в фирменном стиле: четкая сетка, акцент на CTA, плюс адаптив и быстрая загрузка.";
    }

    if (value.includes("чат") || value.includes("бот")) {
      return "Отлично, можно развить этот чат до прод-версии: подключить API, историю диалогов, роли пользователей и аналитику.";
    }

    return replies[Math.floor(Math.random() * replies.length)];
  };

  const finalizeBotMeta = (node, text) => {
    node.dataset.copyText = text;
    const copy = node.querySelector(".message__copy");
    if (copy) copy.dataset.copyText = text;

    const time = node.querySelector(".message__time");
    if (time) time.textContent = formatTime();
  };

  const sendUserMessage = async (rawText) => {
    const value = (rawText || "").trim();
    if (!value || isBusy) return;

    const controller = { stopRequested: false };
    activeController = controller;

    setBusy(true);

    try {
      buildMessage("user", value, true);

      const typing = createTyping();
      const replyText = generateReply(value);

      const canContinue = await delayWithAbort(650, controller);

      if (!canContinue) {
        if (typing.parentNode) typing.remove();
        return;
      }

      if (typing.parentNode) typing.remove();

      const { node, bubble } = buildMessage("bot", "");
      const finalText = await typeBotMessage(bubble, replyText, controller);
      finalizeBotMeta(node, finalText);
      scrollToBottom();
    } finally {
      activeController = null;
      setBusy(false);
      input.focus();
      updateScrollState();
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value;
    clearInput();
    await sendUserMessage(text);
  });

  input.addEventListener("input", autoResizeInput);

  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    event.preventDefault();

    if (isBusy || !input.value.trim()) return;

    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }
  });

  quickChips.forEach((chip) => {
    chip.addEventListener("click", async () => {
      if (isBusy) return;
      const prompt = chip.dataset.prompt || "";
      clearInput();
      await sendUserMessage(prompt);
    });
  });

  stopButton.addEventListener("click", () => {
    if (!activeController) return;
    activeController.stopRequested = true;
  });

  messages.addEventListener("scroll", updateScrollState);

  scrollLatest.addEventListener("click", () => {
    stickToBottom = true;
    scrollToBottom(true);
  });

  messages.addEventListener("click", async (event) => {
    const button = event.target.closest(".message__copy");
    if (!button) return;

    const text = button.dataset.copyText || button.closest(".message")?.dataset.copyText || "";
    const ok = await copyToClipboard(text);

    if (!ok) return;

    const prev = button.textContent;
    button.textContent = "Скопировано";
    button.classList.add("is-copied");

    setTimeout(() => {
      button.textContent = prev;
      button.classList.remove("is-copied");
    }, 1200);
  });

  const initialMessages = messages.querySelectorAll(".message");
  initialMessages.forEach((node) => {
    const bubble = node.querySelector(".message__bubble");
    const text = bubble ? bubble.textContent.trim() : "";
    if (text) node.dataset.copyText = text;

    const time = node.querySelector(".message__time");
    if (time && (time.textContent || "").trim().toLowerCase() === "сейчас") {
      time.textContent = formatTime();
    }

    const copy = node.querySelector(".message__copy");
    if (copy && text) copy.dataset.copyText = text;
  });

  setBusy(false);
  updateScrollState();
  clearInput();
  scrollToBottom(true, false);
})();
