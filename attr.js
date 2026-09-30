/* DistroFi link attribution (distrofi.org pages).
 * 1. Remembers which link brought a visitor: campaign tags (utm_*), a referral code (ref)
 *    and the referring website. Stored in this browser only, under "distrofi_attr";
 *    the app on the same site reads it at sign-up and checkout.
 *    first = the first visit we saw, last = the most recent tagged or referred visit.
 * 2. Adds the tags plus the button's name (cta) to every link marked data-cta, so the
 *    source survives the click even if browser storage is blocked.
 */
(function () {
  var KEY = 'distrofi_attr';
  var TAGS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'];
  function clip(v) { return String(v).slice(0, 100); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || {}; } catch (e) { return {}; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }

  var q = new URLSearchParams(location.search), visit = {}, tagged = false;
  TAGS.forEach(function (k) { var v = q.get(k); if (v) { visit[k] = clip(v); tagged = true; } });
  var ref = '';
  try { if (document.referrer && new URL(document.referrer).host !== location.host) ref = new URL(document.referrer).host; } catch (e) {}
  if (ref) visit.referrer = clip(ref);
  visit.landing = clip(location.pathname);
  visit.at = new Date().toISOString();

  var a = load();
  if (!a.first) a.first = visit;
  if (tagged || ref || !a.last) a.last = visit;
  save(a);

  // Tags to carry on outgoing app links: this visit's, else the last tagged visit's.
  var carry = {};
  var src = tagged ? visit : (a.last || {});
  TAGS.forEach(function (k) { if (src[k]) carry[k] = src[k]; });

  function decorate() {
    var links = document.querySelectorAll('a[data-cta]');
    for (var i = 0; i < links.length; i++) {
      try {
        var u = new URL(links[i].getAttribute('href'), location.href);
        Object.keys(carry).forEach(function (k) { if (!u.searchParams.has(k)) u.searchParams.set(k, carry[k]); });
        u.searchParams.set('cta', links[i].getAttribute('data-cta'));
        links[i].setAttribute('href', u.toString());
      } catch (e) {}
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorate); else decorate();
})();
