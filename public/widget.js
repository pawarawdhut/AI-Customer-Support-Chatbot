(() => {
  const script = document.currentScript;
  const siteId = script && script.getAttribute("data-site-id");
  if (!siteId || !/^[0-9a-f-]{36}$/i.test(siteId)) {
    console.error("[Orbit] Add a valid data-site-id to the widget script.");
    return;
  }

  const root = document.createElement("div");
  root.setAttribute("data-orbit-widget", siteId);
  const shadow = root.attachShadow({ mode: "open" });
  const styles = document.createElement("style");
  styles.textContent = `
    :host { all: initial; color-scheme: light; }
    .launcher {
      align-items: center; background: var(--orbit-color, #6046e8); border: 0;
      border-radius: 999px; bottom: 22px; box-shadow: 0 8px 26px #20154a38;
      color: #fff; cursor: pointer; display: flex; font: 600 14px/1 system-ui, sans-serif;
      gap: 10px; height: 58px; justify-content: center; padding: 0 20px;
      position: fixed; right: 24px; z-index: 2147483000;
    }
    .launcher-icon { align-items: center; background: #ffffff2a; border-radius: 50%; display: flex; height: 32px; justify-content: center; width: 32px; }
    .panel {
      background: #fff; border: 1px solid #e8e7ef; border-radius: 20px;
      bottom: 94px; box-shadow: 0 20px 70px #1713312b; display: flex; flex-direction: column;
      font: 14px/1.5 system-ui, sans-serif; height: min(590px, calc(100vh - 130px));
      overflow: hidden; position: fixed; right: 24px; width: min(370px, calc(100vw - 32px));
      z-index: 2147483000;
    }
    [hidden] { display: none !important; }
    .header { align-items: center; background: var(--orbit-color, #6046e8); color: #fff; display: flex; gap: 12px; padding: 19px 18px; }
    .avatar { align-items: center; background: #ffffff27; border-radius: 13px; display: flex; font-size: 19px; height: 42px; justify-content: center; width: 42px; }
    .title { flex: 1; min-width: 0; }
    .title strong { display: block; font-size: 15px; }
    .title small { color: #ffffffc7; display: flex; align-items: center; font-size: 12px; gap: 6px; margin-top: 2px; }
    .online { background: #a4f0bf; border-radius: 50%; height: 7px; width: 7px; }
    .close { background: transparent; border: 0; color: #fff; cursor: pointer; font-size: 25px; line-height: 1; padding: 5px; }
    .messages { background: #faf9fc; flex: 1; overflow-y: auto; padding: 18px 14px; }
    .message { border-radius: 15px; font-size: 13px; margin: 0 0 10px; max-width: 85%; overflow-wrap: anywhere; padding: 11px 13px; white-space: pre-wrap; }
    .assistant { background: #fff; border: 1px solid #eeedf3; border-top-left-radius: 5px; color: #33313c; }
    .user { background: var(--orbit-color, #6046e8); border-top-right-radius: 5px; color: #fff; margin-left: auto; }
    .typing { color: #777383; font-size: 12px; padding: 3px 4px; }
    .composer { align-items: center; background: #fff; border-top: 1px solid #eeedf3; display: flex; gap: 9px; padding: 12px; }
    .input { border: 1px solid #e8e7ef; border-radius: 12px; color: #272532; flex: 1; font: 13px system-ui, sans-serif; min-width: 0; outline: none; padding: 11px 12px; }
    .input:focus { border-color: var(--orbit-color, #6046e8); }
    .send { background: var(--orbit-color, #6046e8); border: 0; border-radius: 11px; color: white; cursor: pointer; font-size: 19px; height: 42px; width: 42px; }
    .send:disabled { cursor: wait; opacity: .6; }
    .powered { color: #9895a3; font-size: 10px; padding: 0 13px 10px; text-align: center; }
    @media (max-width: 480px) {
      .launcher { bottom: 14px; right: 14px; }
      .panel { bottom: 84px; height: min(590px, calc(100vh - 102px)); right: 10px; width: calc(100vw - 20px); }
    }
  `;

  const launcher = document.createElement("button");
  launcher.className = "launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open support chat");
  launcher.innerHTML = '<span class="launcher-icon" aria-hidden="true">✳</span><span>Chat with us</span>';

  const panel = document.createElement("section");
  panel.className = "panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Customer support chat");

  const header = document.createElement("header");
  header.className = "header";
  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.textContent = "✳";
  const title = document.createElement("div");
  title.className = "title";
  const titleText = document.createElement("strong");
  titleText.textContent = "Support";
  const status = document.createElement("small");
  const online = document.createElement("span");
  online.className = "online";
  status.append(online, document.createTextNode("Here to help"));
  title.append(titleText, status);
  const close = document.createElement("button");
  close.className = "close";
  close.type = "button";
  close.setAttribute("aria-label", "Close support chat");
  close.textContent = "×";
  header.append(avatar, title, close);

  const messages = document.createElement("div");
  messages.className = "messages";
  messages.setAttribute("aria-live", "polite");
  const composer = document.createElement("form");
  composer.className = "composer";
  const input = document.createElement("input");
  input.className = "input";
  input.maxLength = 1200;
  input.autocomplete = "off";
  input.placeholder = "Write a message...";
  input.setAttribute("aria-label", "Write a message");
  const send = document.createElement("button");
  send.className = "send";
  send.type = "submit";
  send.setAttribute("aria-label", "Send message");
  send.textContent = "↑";
  composer.append(input, send);
  const powered = document.createElement("div");
  powered.className = "powered";
  powered.textContent = "Thoughtful support, powered by Orbit";
  panel.append(header, messages, composer, powered);
  shadow.append(styles, launcher, panel);
  (document.body || document.documentElement).append(root);

  let conversationId = "";
  let configured = false;
  let pending = false;

  function addMessage(text, role) {
    const bubble = document.createElement("div");
    bubble.className = `message ${role}`;
    bubble.textContent = text;
    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  }

  launcher.addEventListener("click", () => {
    const open = panel.hidden;
    setOpen(open);
    if (open && !configured) {
      configured = true;
      fetch(`${new URL(script.src).origin}/api/widget/${siteId}`, {
        mode: "cors",
        credentials: "omit",
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("This website is not authorized for the support widget.");
          return response.json();
        })
        .then((config) => {
          if (typeof config.primaryColor === "string" && /^#[\da-f]{6}$/i.test(config.primaryColor)) {
            root.style.setProperty("--orbit-color", config.primaryColor);
          }
          if (typeof config.assistantName === "string") {
            titleText.textContent = config.assistantName;
            launcher.lastElementChild.textContent = `Chat with ${config.assistantName}`;
          }
          addMessage(
            typeof config.greeting === "string"
              ? config.greeting
              : "Hi there! How can I help you today?",
            "assistant",
          );
        })
        .catch((error) => {
          addMessage(error instanceof Error ? error.message : "The chat is unavailable right now.", "assistant");
        });
    }
  });
  close.addEventListener("click", () => setOpen(false));
  composer.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || pending) return;

    pending = true;
    send.disabled = true;
    input.value = "";
    addMessage(message, "user");
    const typing = document.createElement("div");
    typing.className = "typing";
    typing.textContent = "Thinking...";
    messages.append(typing);

    try {
      const response = await fetch(`${new URL(script.src).origin}/api/widget/${siteId}/messages`, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, ...(conversationId ? { conversationId } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your message could not be sent.");
      conversationId = result.conversationId;
      addMessage(result.reply, "assistant");
    } catch (error) {
      addMessage(error instanceof Error ? error.message : "Your message could not be sent. Please try again.", "assistant");
    } finally {
      typing.remove();
      pending = false;
      send.disabled = false;
      input.focus();
    }
  });
})();
