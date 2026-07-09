/**
 * Beacon embed loader. Partners paste:
 *
 *   <script src="https://YOUR-BEACON-HOST/embed.js"
 *           data-condition="lupus" data-limit="5" async></script>
 *
 * It replaces itself with an auto-sizing iframe. Zero cookies, zero tracking:
 * the iframe talks only to the public ClinicalTrials.gov registry.
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var condition = script.getAttribute("data-condition") || "";
  var limit = script.getAttribute("data-limit") || "5";
  var base = script.src.replace(/embed\.js.*$/, "");
  var iframe = document.createElement("iframe");
  iframe.src =
    base + "widget.html?cond=" + encodeURIComponent(condition) + "&limit=" + encodeURIComponent(limit);
  iframe.style.width = "100%";
  iframe.style.border = "0";
  iframe.style.minHeight = "220px";
  iframe.title = "Clinical trial finder — Beacon";
  iframe.loading = "lazy";
  window.addEventListener("message", function (e) {
    if (
      e.source === iframe.contentWindow &&
      e.data &&
      e.data.type === "beacon-widget-height" &&
      typeof e.data.height === "number"
    ) {
      iframe.style.height = Math.min(e.data.height + 8, 2000) + "px";
    }
  });
  script.parentNode.insertBefore(iframe, script);
})();
