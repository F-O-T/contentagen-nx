globalThis.__nitro_main__ = import.meta.url;
import { N as NodeResponse, s as serve } from "./_libs/srvx.mjs";
import { d as defineHandler, H as HTTPError, t as toEventHandler, a as defineLazyEventHandler, b as H3Core, c as toRequest } from "./_libs/h3.mjs";
import { d as decodePath, w as withLeadingSlash, a as withoutTrailingSlash, j as joinURL } from "./_libs/ufo.mjs";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import "node:http";
import "node:stream";
import "node:https";
import "node:http2";
import "./_libs/rou3.mjs";
function lazyService(loader) {
  let promise, mod;
  return {
    fetch(req) {
      if (mod) {
        return mod.fetch(req);
      }
      if (!promise) {
        promise = loader().then((_mod) => mod = _mod.default || _mod);
      }
      return promise.then((mod2) => mod2.fetch(req));
    }
  };
}
const services = {
  ["ssr"]: lazyService(() => import("./_ssr/server-CQvioJOX.mjs").then(function(n) {
    return n.i;
  }))
};
globalThis.__nitro_vite_envs__ = services;
const errorHandler$1 = (error, event) => {
  const res = defaultHandler(error, event);
  return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled;
  const status = error.status || 500;
  const url = event.url || new URL(event.req.url);
  if (status === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.req.method}] ${url}
`, error);
  }
  const headers2 = {
    "content-type": "application/json",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  if (status === 404 || !event.res.headers.has("cache-control")) {
    headers2["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    status,
    statusText: error.statusText,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status,
    statusText: error.statusText,
    headers: headers2,
    body
  };
}
const errorHandlers = [errorHandler$1];
async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      const response = await handler(error, event, { defaultHandler });
      if (response) {
        return response;
      }
    } catch (error2) {
      console.error(error2);
    }
  }
}
const headers = ((m) => function headersRouteRule(event) {
  for (const [key2, value] of Object.entries(m.options || {})) {
    event.res.headers.set(key2, value);
  }
});
const assets = {
  "/favicon.svg": {
    "type": "image/svg+xml",
    "etag": '"18ff-KVejRcMLBqyaSFg72vxlxyHoWLU"',
    "mtime": "2026-01-24T01:14:58.211Z",
    "size": 6399,
    "path": "../public/favicon.svg"
  },
  "/robots.txt": {
    "type": "text/plain; charset=utf-8",
    "etag": '"43-BEzmj4PuhUNHX+oW9uOnPSihxtU"',
    "mtime": "2026-01-24T01:14:58.211Z",
    "size": 67,
    "path": "../public/robots.txt"
  },
  "/assets/_authenticated-CTXRNsO0.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"23a-ehWWmPtdYswUA4vF8uX5fxtyE8M"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 570,
    "path": "../public/assets/_authenticated-CTXRNsO0.js"
  },
  "/assets/_dashboard-kYw2nwiS.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b04e-wQs29sfjoZkLwBJN6FwmqpwTyOc"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 45134,
    "path": "../public/assets/_dashboard-kYw2nwiS.js"
  },
  "/assets/_slug-CEe2KYr4.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"240-PocZYa7DUm/Cafggf8jolvhcN0g"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 576,
    "path": "../public/assets/_slug-CEe2KYr4.js"
  },
  "/assets/activity-BY_K_E9t.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f6-8YsRlLhENg4Vr02QLLZ72vwCbMg"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 246,
    "path": "../public/assets/activity-BY_K_E9t.js"
  },
  "/assets/alert-8NImGWAv.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c75-rwEiKMUtcXP90MIA6gRGGnDABHE"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 3189,
    "path": "../public/assets/alert-8NImGWAv.js"
  },
  "/assets/anonymous-COvqN4DW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1feb-ahhvQ8SVA7xYPfSraJtCgMZqmVA"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 8171,
    "path": "../public/assets/anonymous-COvqN4DW.js"
  },
  "/assets/arrow-left-CvC2C4my.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b1-1vrMLx4+ZcNtFu5ivA9MESBtilo"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 177,
    "path": "../public/assets/arrow-left-CvC2C4my.js"
  },
  "/assets/archive-CO0pjH3U.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"109-QNPBmS926khBFhBnw9yqEv0FlO0"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 265,
    "path": "../public/assets/archive-CO0pjH3U.js"
  },
  "/assets/arrow-right-HiMz91gf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b1-o6YeodPGk/kq1O3TC82hl1iOJUY"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 177,
    "path": "../public/assets/arrow-right-HiMz91gf.js"
  },
  "/assets/auth-Cd7BE74x.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3ba6-C2PoskxpZX/g2vHCYcCf2F3LH5w"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 15270,
    "path": "../public/assets/auth-Cd7BE74x.js"
  },
  "/assets/auth-client-CfFkGvc2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"797f-tSommQAw8UJjUgbfvMJf4PcGSMc"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 31103,
    "path": "../public/assets/auth-client-CfFkGvc2.js"
  },
  "/assets/avatar-C4w9lrcW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"13b8-6EWux1YEYIbOehg+BhLkG1T1Duk"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 5048,
    "path": "../public/assets/avatar-C4w9lrcW.js"
  },
  "/assets/badge-BqZNWw4a.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6e5-dd0CowW6GhrzlNdUfvIKPkSaSJM"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 1765,
    "path": "../public/assets/badge-BqZNWw4a.js"
  },
  "/assets/_contentId-00LeUhqP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6a96e-aBQFbjrMwm01YeUbCPpyOVgUkF0"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 436590,
    "path": "../public/assets/_contentId-00LeUhqP.js"
  },
  "/assets/callback-DtqBFgK5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"29-crG9x4dYeQi7xsfEfaRvCOejUcg"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 41,
    "path": "../public/assets/callback-DtqBFgK5.js"
  },
  "/assets/card-B-EASlk1.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1091-ExMRu6mQ8X8bpd/TQ6MLcVdawBg"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 4241,
    "path": "../public/assets/card-B-EASlk1.js"
  },
  "/assets/billing-ixwgtCSl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"169f1-Khg4gf4aww5ijhtNNHOttDB8wjQ"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 92657,
    "path": "../public/assets/billing-ixwgtCSl.js"
  },
  "/assets/check-DkxdjfRB.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"83-Kk8IldULJV16vS/ObbvaOEz7STI"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 131,
    "path": "../public/assets/check-DkxdjfRB.js"
  },
  "/assets/chevron-right-CfHoqx49.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8e-SXzyM9l0XCfnGSfNao8NZ/yxp/k"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 142,
    "path": "../public/assets/chevron-right-CfHoqx49.js"
  },
  "/assets/clock-CER2GytZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"b0-5dNj7zhLvedE7mylHocud3iHgbk"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 176,
    "path": "../public/assets/clock-CER2GytZ.js"
  },
  "/assets/constants-DmJ3fodH.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"39a-nWbCSG5tgqBjHS4kvPsSXjlfDjk"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 922,
    "path": "../public/assets/constants-DmJ3fodH.js"
  },
  "/assets/createLucideIcon-_j4ZO49h.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"490-E6QtOahTQvowPPk6qHjs/n292y0"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 1168,
    "path": "../public/assets/createLucideIcon-_j4ZO49h.js"
  },
  "/assets/chart-BOwTiEqh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"66872-q8gUoGKbflMXwLdp8vU2k0Ie5x0"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 419954,
    "path": "../public/assets/chart-BOwTiEqh.js"
  },
  "/assets/credit-card-XlK0k4C_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"db-+CHI5E0sL1RYuZM7nBqzILVbEMI"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 219,
    "path": "../public/assets/credit-card-XlK0k4C_.js"
  },
  "/assets/dropdown-menu-DjJ4Y3Vx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5efd-5UlUYN4+p5X1Af3QxriBSxK3lE4"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 24317,
    "path": "../public/assets/dropdown-menu-DjJ4Y3Vx.js"
  },
  "/assets/crown-Cz-y6Frp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"176-8roWcoFl+dYliAt4jAeCJ2/OS7w"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 374,
    "path": "../public/assets/crown-Cz-y6Frp.js"
  },
  "/assets/email-Bdy9JNbf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"22f0-u178a7SnzcNl9L5MdY1H4/8MUPU"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 8944,
    "path": "../public/assets/email-Bdy9JNbf.js"
  },
  "/assets/email-verification-Cc_kNpSn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1c99-ruR0HMrhXxF3gkN78k2UYOyxQQY"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 7321,
    "path": "../public/assets/email-verification-Cc_kNpSn.js"
  },
  "/assets/error-fallback-CVBiTKXr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1cc8-xy/SGZJX7Qtie6PPZcHEjDybPmM"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 7368,
    "path": "../public/assets/error-fallback-CVBiTKXr.js"
  },
  "/assets/field-B7jyWHmL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"16b1-TPn9UcVqQfuL5ASfdmutAXrSbuE"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 5809,
    "path": "../public/assets/field-B7jyWHmL.js"
  },
  "/assets/file-text-Ctld0ETl.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"18d-9v61jH7ygiTdZxkeaA2q4mrAwRI"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 397,
    "path": "../public/assets/file-text-Ctld0ETl.js"
  },
  "/assets/forgot-password-DJnDEZSR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3f59-VdoQ5GprF8WCQC9dVHjkiCggf7M"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 16217,
    "path": "../public/assets/forgot-password-DJnDEZSR.js"
  },
  "/assets/globe-BuiwILAW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f9-ThoIk1zB3Uyt6gsmglHXYnHV7os"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 249,
    "path": "../public/assets/globe-BuiwILAW.js"
  },
  "/assets/index-BEL9YN3E.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e64-ghtd/GYG4DGYmQUdgWLINA3A33g"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 3684,
    "path": "../public/assets/index-BEL9YN3E.js"
  },
  "/assets/globals-4FDkpF52.css": {
    "type": "text/css; charset=utf-8",
    "etag": '"1e595-RNhupQ+EAs3mRsI3V6UHGAGvASo"',
    "mtime": "2026-01-24T01:14:59.530Z",
    "size": 124309,
    "path": "../public/assets/globals-4FDkpF52.css"
  },
  "/assets/index-BjOts-fe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"57f-Y4qzMfZJwpx2FeiwNqyMFHXSY8g"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 1407,
    "path": "../public/assets/index-BjOts-fe.js"
  },
  "/assets/index-CF3ST1Nr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a46-SJPADtx63tw25p8w4SGiTTgaRLI"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 2630,
    "path": "../public/assets/index-CF3ST1Nr.js"
  },
  "/assets/index-DAK3VwuU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6a6e-ma6zdYCVjSund9NXRwMPoBN6wHE"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 27246,
    "path": "../public/assets/index-DAK3VwuU.js"
  },
  "/assets/index-DJdnAD6N.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"876-OOGtnF2Ug+hBL0D/kvvimWXtiCs"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 2166,
    "path": "../public/assets/index-DJdnAD6N.js"
  },
  "/assets/index-DiC9NNDj.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"3c17-2oX4uScRyvhuwNP+sYxBLilJsdo"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 15383,
    "path": "../public/assets/index-DiC9NNDj.js"
  },
  "/assets/index-Dm2Bdr_p.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4ac2-0Y65XqZS17LMxDAqfgQjjF7ySJE"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 19138,
    "path": "../public/assets/index-Dm2Bdr_p.js"
  },
  "/assets/input-C7nQrTm-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"561-8cPP/o4tcucT6miGTgob0idmeUg"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 1377,
    "path": "../public/assets/input-C7nQrTm-.js"
  },
  "/assets/index-Eg1BBzY_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"10b20-1nP8dNVcE6n1CAuEbS5uFmF9dGk"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 68384,
    "path": "../public/assets/index-Eg1BBzY_.js"
  },
  "/assets/input-otp-DfpD3iQP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"35c0-WYtyjXCyh4ipr94h20xe9R92kSM"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 13760,
    "path": "../public/assets/input-otp-DfpD3iQP.js"
  },
  "/assets/item-BXGpuQYv.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1b03-haaYwdl7myw7rLgcyXvcUZ+O+M0"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 6915,
    "path": "../public/assets/item-BXGpuQYv.js"
  },
  "/assets/label-MtjkoVuD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"5e2-fdXm173B8RYGfZ2laUrbHMyNhL0"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 1506,
    "path": "../public/assets/label-MtjkoVuD.js"
  },
  "/assets/loader-circle-C2s2tkv_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"97-dANjw0oY8347Q5poMtVkH/p+wyI"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 151,
    "path": "../public/assets/loader-circle-C2s2tkv_.js"
  },
  "/assets/magic-link-Xg6e5ZLG.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2931-XLoUI09KvSmJQDh9uZN7dEwqNRI"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 10545,
    "path": "../public/assets/magic-link-Xg6e5ZLG.js"
  },
  "/assets/mail-Cs4gZwHx.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"e1-ODx9Mq4PKiZKyTQJwAYJX77Wq/s"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 225,
    "path": "../public/assets/mail-Cs4gZwHx.js"
  },
  "/assets/message-square-DsYb0V_U.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"f5-Np+W6O52AlAB7FKiW2tIRTGuDYY"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 245,
    "path": "../public/assets/message-square-DsYb0V_U.js"
  },
  "/assets/minus-BEfdI589.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"75-dOcSxVaP/HFyo997FNPWCYykjig"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 117,
    "path": "../public/assets/minus-BEfdI589.js"
  },
  "/assets/monitor-BYb4g0FY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"10f-9uVF3EstjfWZ5I1XToVmIHHV6Zo"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 271,
    "path": "../public/assets/monitor-BYb4g0FY.js"
  },
  "/assets/password-input-CMCgG9xc.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"bfa-Z5DCRUyykA95UqBn+ncFRuI8MUs"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 3066,
    "path": "../public/assets/password-input-CMCgG9xc.js"
  },
  "/assets/pen-line-Bhu4wV7b.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"121-rUYHZh1zlWlF7t9/T1UaLcI/OAA"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 289,
    "path": "../public/assets/pen-line-Bhu4wV7b.js"
  },
  "/assets/pencil-LrCzqTme.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"120-yAWXwp7SPsbXd2LCiNiDsNAn6R8"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 288,
    "path": "../public/assets/pencil-LrCzqTme.js"
  },
  "/assets/preferences-CsAqGkB5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a34a-0USFYySGOtScFwkSCMv5PXsxJxo"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 41802,
    "path": "../public/assets/preferences-CsAqGkB5.js"
  },
  "/assets/plans-CHi3-4ta.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"adcd-78FhAb5JXO7S9Dq6i5/rHHvngi8"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 44493,
    "path": "../public/assets/plans-CHi3-4ta.js"
  },
  "/assets/profile-DMfOxswL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"d281-F7wB9rTLuNqXk62mcPk3vJ5UdhM"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 53889,
    "path": "../public/assets/profile-DMfOxswL.js"
  },
  "/assets/react-error-boundary.development-C-CjJcHg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"8e5-lPiwvdASQ84OXz89zgW5PLyO8xY"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 2277,
    "path": "../public/assets/react-error-boundary.development-C-CjJcHg.js"
  },
  "/assets/security-Bsc4ibAd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9b94-VcDfwjwuExQCjdi45VrrvSsGUks"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 39828,
    "path": "../public/assets/security-Bsc4ibAd.js"
  },
  "/assets/separator-DTz7CZVF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"6d3-9n4gDdSTGP3xlJ4aegqeS9iiV9k"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 1747,
    "path": "../public/assets/separator-DTz7CZVF.js"
  },
  "/assets/proxy-CzwcP0M3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1b637-dXnNQzmUocT8sKKxKWuoLczLKfs"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 112183,
    "path": "../public/assets/proxy-CzwcP0M3.js"
  },
  "/assets/settings-DQAbney3.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1df5-dEJgEB1BEoIJNMsF99XYDpajyzs"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 7669,
    "path": "../public/assets/settings-DQAbney3.js"
  },
  "/assets/settings-mobile-nav-tYJSof1g.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"14e5-ccPb6o212OeREfSYAMPIzHbmGsk"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 5349,
    "path": "../public/assets/settings-mobile-nav-tYJSof1g.js"
  },
  "/assets/shield-DyeYZ6dk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"117-ZlzfXph1Cc1xx4dOKbfwk8iGPQA"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 279,
    "path": "../public/assets/shield-DyeYZ6dk.js"
  },
  "/assets/sidebar-BPnBcahj.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4e98-xnce8VMeYTzrQ/0etcSGw1MLs5Q"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 20120,
    "path": "../public/assets/sidebar-BPnBcahj.js"
  },
  "/assets/sign-in-7i1i0Vbw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"233-OAWDgalI3ecZmpYbkc/hNDfqry4"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 563,
    "path": "../public/assets/sign-in-7i1i0Vbw.js"
  },
  "/assets/sign-up-q1Rjc9oZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"36e7-LYBf9PuFDbkjN5/AU1zz2kk3JTs"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 14055,
    "path": "../public/assets/sign-up-q1Rjc9oZ.js"
  },
  "/assets/sparkles-BO7x0YHU.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1fa-gaNuCUHeoIeEDHOQrwlcdLUVhxw"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 506,
    "path": "../public/assets/sparkles-BO7x0YHU.js"
  },
  "/assets/stepper-Bl6eKT6r.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"4776-bc3jfO8/OP0RWdKeFH24dv75kxE"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 18294,
    "path": "../public/assets/stepper-Bl6eKT6r.js"
  },
  "/assets/theme-switcher-9IXwINeJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"befc-bcOJSpqSeNUW73GFt7/CIO2OyVc"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 48892,
    "path": "../public/assets/theme-switcher-9IXwINeJ.js"
  },
  "/assets/tooltip-Dh6ek4ZR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2d03-Mmd0f6ro49NKzHRUovW1rrcfmjE"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 11523,
    "path": "../public/assets/tooltip-Dh6ek4ZR.js"
  },
  "/assets/main-QmKhnQM_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"c87e3-bQjKcJpdtbO8dKJIxOaU0brd51A"',
    "mtime": "2026-01-24T01:14:59.536Z",
    "size": 821219,
    "path": "../public/assets/main-QmKhnQM_.js"
  },
  "/assets/trash-2-sLdav-2_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"154-OmS4XwegpBn3DKEwkroT2W8bgMo"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 340,
    "path": "../public/assets/trash-2-sLdav-2_.js"
  },
  "/assets/use-active-organization-O1IFw04K.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2ef-kPdMR6vy3/MFa5HmDeCY3ZW/AZI"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 751,
    "path": "../public/assets/use-active-organization-O1IFw04K.js"
  },
  "/assets/use-feature-access-MFKSr13H.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"9ab-LhgvuKR8FORikiHfZ0hx2RUoRqU"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 2475,
    "path": "../public/assets/use-feature-access-MFKSr13H.js"
  },
  "/assets/use-mobile-BuJXLMMq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"28c-gIqQPAQbhzLhtggTzaDHtT6qlgU"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 652,
    "path": "../public/assets/use-mobile-BuJXLMMq.js"
  },
  "/assets/usage-CVf30SMj.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"10cb4-SO9f3kaiefZvmapNxcG9XpK1xyI"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 68788,
    "path": "../public/assets/usage-CVf30SMj.js"
  },
  "/assets/useLocation-sSRE2djr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"66-BYzhVV7/HVvP8hXZxDfp663ijjw"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 102,
    "path": "../public/assets/useLocation-sSRE2djr.js"
  },
  "/assets/useForm-OH-O0qut.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"a55e-ZGuBTF8bux420HsV1t8tNmqxCQg"',
    "mtime": "2026-01-24T01:14:59.534Z",
    "size": 42334,
    "path": "../public/assets/useForm-OH-O0qut.js"
  },
  "/assets/useMutation-Bxel6n_H.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"81b-pqR4Ht55IYN69MxZMX9VDEX65M8"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 2075,
    "path": "../public/assets/useMutation-Bxel6n_H.js"
  },
  "/assets/useSuspenseQuery-w65XoorR.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"2299-Ho3hQaqQ83eq97dd2dh//QZoYGE"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 8857,
    "path": "../public/assets/useSuspenseQuery-w65XoorR.js"
  },
  "/assets/user-CZ1Xl5iQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"cb-YiwECjLp3d7fZI4AxNQxZJSVe+A"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 203,
    "path": "../public/assets/user-CZ1Xl5iQ.js"
  },
  "/assets/worker-B30a3KVW.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"1e5-s7dnXIfz38tQAD7GX1z/06QCHX0"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 485,
    "path": "../public/assets/worker-B30a3KVW.js"
  },
  "/assets/worker-BGj5axaN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"11728-hh/kMg7Q0x3bsArj1/s5JUcoQ+E"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 71464,
    "path": "../public/assets/worker-BGj5axaN.js"
  },
  "/assets/zap-BW5SZRDi.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": '"112-FQSll/PQgeKanTpcTcCDnjlWTb8"',
    "mtime": "2026-01-24T01:14:59.535Z",
    "size": 274,
    "path": "../public/assets/zap-BW5SZRDi.js"
  }
};
function readAsset(id) {
  const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
  return promises.readFile(resolve(serverDir, assets[id].path));
}
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
  if (assets[id]) {
    return true;
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) {
      return true;
    }
  }
  return false;
}
function getAsset(id) {
  return assets[id];
}
const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = {
  gzip: ".gz",
  br: ".br"
};
const _cYtbtr = defineHandler((event) => {
  if (event.req.method && !METHODS.has(event.req.method)) {
    return;
  }
  let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
  let asset;
  const encodingHeader = event.req.headers.get("accept-encoding") || "";
  const encodings = [...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
  if (encodings.length > 1) {
    event.res.headers.append("Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      event.res.headers.delete("Cache-Control");
      throw new HTTPError({ status: 404 });
    }
    return;
  }
  const ifNotMatch = event.req.headers.get("if-none-match") === asset.etag;
  if (ifNotMatch) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  const ifModifiedSinceH = event.req.headers.get("if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    event.res.status = 304;
    event.res.statusText = "Not Modified";
    return "";
  }
  if (asset.type) {
    event.res.headers.set("Content-Type", asset.type);
  }
  if (asset.etag && !event.res.headers.has("ETag")) {
    event.res.headers.set("ETag", asset.etag);
  }
  if (asset.mtime && !event.res.headers.has("Last-Modified")) {
    event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !event.res.headers.has("Content-Encoding")) {
    event.res.headers.set("Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !event.res.headers.has("Content-Length")) {
    event.res.headers.set("Content-Length", asset.size.toString());
  }
  return readAsset(id);
});
const findRouteRules = /* @__PURE__ */ (() => {
  const $0 = [{ name: "headers", route: "/assets/**", handler: headers, options: { "cache-control": "public, max-age=31536000, immutable" } }];
  return (m, p) => {
    let r = [];
    if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
    let s = p.split("/");
    s.length - 1;
    if (s[1] === "assets") {
      r.unshift({ data: $0, params: { "_": s.slice(2).join("/") } });
    }
    return r;
  };
})();
const _lazy_JKDMaJ = defineLazyEventHandler(() => Promise.resolve().then(function() {
  return ssrRenderer$1;
}));
const findRoute = /* @__PURE__ */ (() => {
  const data = { route: "/**", handler: _lazy_JKDMaJ };
  return ((_m, p) => {
    return { data, params: { "_": p.slice(1) } };
  });
})();
const globalMiddleware = [
  toEventHandler(_cYtbtr)
].filter(Boolean);
const APP_ID = "default";
function useNitroApp() {
  let instance = useNitroApp._instance;
  if (instance) {
    return instance;
  }
  instance = useNitroApp._instance = createNitroApp();
  globalThis.__nitro__ = globalThis.__nitro__ || {};
  globalThis.__nitro__[APP_ID] = instance;
  return instance;
}
function createNitroApp() {
  const hooks = void 0;
  const captureError = (error, errorCtx) => {
    if (errorCtx?.event) {
      const errors = errorCtx.event.req.context?.nitro?.errors;
      if (errors) {
        errors.push({
          error,
          context: errorCtx
        });
      }
    }
  };
  const h3App = createH3App({ onError(error, event) {
    return errorHandler(error, event);
  } });
  let appHandler = (req) => {
    req.context ||= {};
    req.context.nitro = req.context.nitro || { errors: [] };
    return h3App.fetch(req);
  };
  const app = {
    fetch: appHandler,
    h3: h3App,
    hooks,
    captureError
  };
  return app;
}
function createH3App(config) {
  const h3App = new H3Core(config);
  h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
  h3App["~middleware"].push(...globalMiddleware);
  {
    h3App["~getMiddleware"] = (event, route) => {
      const pathname = event.url.pathname;
      const method = event.req.method;
      const middleware = [];
      {
        const routeRules = getRouteRules(method, pathname);
        event.context.routeRules = routeRules?.routeRules;
        if (routeRules?.routeRuleMiddleware.length) {
          middleware.push(...routeRules.routeRuleMiddleware);
        }
      }
      middleware.push(...h3App["~middleware"]);
      if (route?.data?.middleware?.length) {
        middleware.push(...route.data.middleware);
      }
      return middleware;
    };
  }
  return h3App;
}
function getRouteRules(method, pathname) {
  const m = findRouteRules(method, pathname);
  if (!m?.length) {
    return { routeRuleMiddleware: [] };
  }
  const routeRules = {};
  for (const layer of m) {
    for (const rule of layer.data) {
      const currentRule = routeRules[rule.name];
      if (currentRule) {
        if (rule.options === false) {
          delete routeRules[rule.name];
          continue;
        }
        if (typeof currentRule.options === "object" && typeof rule.options === "object") {
          currentRule.options = {
            ...currentRule.options,
            ...rule.options
          };
        } else {
          currentRule.options = rule.options;
        }
        currentRule.route = rule.route;
        currentRule.params = {
          ...currentRule.params,
          ...layer.params
        };
      } else if (rule.options !== false) {
        routeRules[rule.name] = {
          ...rule,
          params: layer.params
        };
      }
    }
  }
  const middleware = [];
  for (const rule of Object.values(routeRules)) {
    if (rule.options === false || !rule.handler) {
      continue;
    }
    middleware.push(rule.handler(rule));
  }
  return {
    routeRules,
    routeRuleMiddleware: middleware
  };
}
function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
  process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
  process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
const port = Number.parseInt(process.env.NITRO_PORT || process.env.PORT || "") || 3e3;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
serve({
  port,
  hostname: host,
  tls: cert && key ? {
    cert,
    key
  } : void 0,
  fetch: nitroApp.fetch
});
trapUnhandledErrors();
const nodeServer = {};
function fetchViteEnv(viteEnvName, input, init) {
  const envs = globalThis.__nitro_vite_envs__ || {};
  const viteEnv = envs[viteEnvName];
  if (!viteEnv) {
    throw HTTPError.status(404);
  }
  return Promise.resolve(viteEnv.fetch(toRequest(input, init)));
}
function ssrRenderer({ req }) {
  return fetchViteEnv("ssr", req);
}
const ssrRenderer$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  default: ssrRenderer
});
export {
  nodeServer as default
};
