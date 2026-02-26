document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', e => {
  if (["F12", "u"].includes(e.key) || (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key))) {
    e.preventDefault();
    alert("Developer tools are disabled.");
    if (e.key === "u") {
      window.open("https://live.eaglestv.vip/", "_blank", "noopener,noreferrer");
    }
    return false;
  }
});

if (window.top !== window.self) {
  window.top.location = window.self.location;
}

const video = document.getElementById("videoPlayer");
const iframe = document.getElementById("iframePlayer");
const categorySelect = document.getElementById("categorySelect");
const streamSelect = document.getElementById("streamSelect");
const loading = document.getElementById("loading");
let hls, channels = {};

async function loadChannels() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/T0picx/TV/main/chan/channels.json');
    channels = await res.json();
    populateChannels(categorySelect.value);
  } catch (err) {
    console.error("Error loading channels:", err);
    alert("Failed to load channel list.");
  }
}

function populateChannels(category) {
  streamSelect.innerHTML = '';
  if (!channels[category]) return;

  channels[category].forEach(ch => {
    const option = document.createElement("option");
    option.value = ch.url;
    option.dataset.type = ch.type;
    option.textContent = "🔹 " + ch.name;
    streamSelect.appendChild(option);
  });

  if (channels[category].length > 0) {
    streamSelect.selectedIndex = 0;
    playSelected();
  }
}

function playSelected() {
  const url = streamSelect.value;
  const type = streamSelect.options[streamSelect.selectedIndex]?.dataset.type;

  if (!url) return;

  video.classList.add("hidden");
  iframe.classList.add("hidden");
  loading.classList.remove("hidden");

  if (hls) {
    hls.destroy();
    hls = null;
  }

  video.pause();
  video.removeAttribute('src');
  video.load();
  iframe.src = 'about:blank';

  if (type === "iframe") {
    iframe.src = url;
    iframe.classList.remove("hidden");
    loading.classList.add("hidden");
  } else {
    video.classList.remove("hidden");

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(err => console.error("Autoplay failed:", err));
      });
      hls.on(Hls.Events.ERROR, (evt, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
            case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
            default: alert("Stream failed to load.");
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch(err => console.error("Autoplay failed:", err));
      });
    } else {
      alert("Your browser does not support HLS.");
    }

    video.addEventListener("canplay", () => {
      loading.classList.add("hidden");
    }, { once: true });
  }
}

categorySelect.addEventListener("change", () => populateChannels(categorySelect.value));
streamSelect.addEventListener("change", playSelected);
window.addEventListener("load", loadChannels);
