import { c as jsxDevRuntimeExports } from "../_libs/react.mjs";
import { u as useLocation, O as Outlet } from "../_chunks/_libs/@tanstack/react-router.mjs";
import "../_chunks/_libs/@ioredis/commands.mjs";
import "../_libs/tiny-warning.mjs";
import "../_chunks/_libs/@tanstack/router-core.mjs";
import "../_libs/cookie-es.mjs";
import "../_chunks/_libs/@tanstack/store.mjs";
import "../_chunks/_libs/@tanstack/history.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_chunks/_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_chunks/_libs/@tanstack/react-store.mjs";
import "../_libs/use-sync-external-store.mjs";
function AuthLayout() {
  const location = useLocation();
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex min-h-screen w-full overflow-hidden bg-background", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("main", { className: "flex flex-1 flex-col justify-center items-center px-4 py-8 md:px-8 lg:px-12 order-1 lg:order-1", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "lg:hidden mb-8", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("img", { alt: "Contentta", className: "w-10 h-10", src: "/favicon.svg" }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
          lineNumber: 10,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xl font-semibold", children: "Contentta" }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
          lineNumber: 11,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
        lineNumber: 9,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
        lineNumber: 8,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("section", { className: "w-full max-w-md duration-500 animate-in slide-in-from-bottom-4 fade-in", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("section", { "aria-label": "Authentication", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Outlet, {}, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
        lineNumber: 17,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
        lineNumber: 16,
        columnNumber: 11
      }, this) }, location.pathname, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
        lineNumber: 15,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
      lineNumber: 6,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("aside", { className: "hidden lg:flex lg:w-[40%] relative flex-col justify-between bg-gradient-to-br from-primary via-primary/95 to-primary/85 p-8 xl:p-12 order-2", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { "aria-hidden": "true", className: "absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[size:32px_32px]" }, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
        lineNumber: 25,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative z-10", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("img", { alt: "Contentta", className: "w-10 h-10 brightness-0 invert", src: "/favicon.svg" }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
          lineNumber: 30,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xl font-semibold text-white", children: "Contentta" }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
          lineNumber: 31,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
        lineNumber: 29,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
        lineNumber: 28,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative z-10 space-y-8", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("svg", { className: "w-full max-w-md mx-auto opacity-90", fill: "none", viewBox: "0 0 400 300", xmlns: "http://www.w3.org/2000/svg", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("title", { children: "AI-powered content creation illustration" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 40,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { height: "180", rx: "8", stroke: "rgba(255,255,255,0.3)", strokeWidth: "2", width: "240", x: "80", y: "60" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 43,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.1)", height: "24", rx: "8", width: "240", x: "80", y: "60" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 46,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { cx: "95", cy: "72", fill: "rgba(255,255,255,0.3)", r: "4" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 47,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { cx: "108", cy: "72", fill: "rgba(255,255,255,0.2)", r: "4" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 48,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { cx: "121", cy: "72", fill: "rgba(255,255,255,0.15)", r: "4" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 49,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.4)", height: "6", rx: "3", width: "140", x: "95", y: "100" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 52,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.25)", height: "4", rx: "2", width: "180", x: "95", y: "116" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 53,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.25)", height: "4", rx: "2", width: "160", x: "95", y: "126" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 54,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.25)", height: "4", rx: "2", width: "170", x: "95", y: "136" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 55,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.2)", height: "4", rx: "2", width: "120", x: "95", y: "146" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 56,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.25)", height: "4", rx: "2", width: "175", x: "95", y: "162" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 59,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.25)", height: "4", rx: "2", width: "155", x: "95", y: "172" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 60,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.2)", height: "4", rx: "2", width: "90", x: "95", y: "182" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 61,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.15)", height: "16", rx: "2", width: "85", x: "185", y: "178" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 64,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("g", { transform: "translate(335, 100)", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { cx: "0", cy: "0", fill: "rgba(255,255,255,0.25)", r: "22" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 68,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { d: "M0 -12 L2 -2 L12 0 L2 2 L0 12 L-2 2 L-12 0 L-2 -2 Z", fill: "rgba(255,255,255,0.7)" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 70,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 67,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("g", { transform: "translate(355, 180)", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { cx: "0", cy: "0", fill: "rgba(255,255,255,0.15)", r: "14" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 75,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { d: "M0 -7 L1.2 -1.2 L7 0 L1.2 1.2 L0 7 L-1.2 1.2 L-7 0 L-1.2 -1.2 Z", fill: "rgba(255,255,255,0.5)" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 76,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 74,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("g", { transform: "translate(30, 90)", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.12)", height: "60", rx: "6", width: "45", x: "0", y: "0" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 81,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.25)", height: "3", rx: "1.5", width: "30", x: "7", y: "12" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 82,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.15)", height: "2", rx: "1", width: "35", x: "7", y: "22" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 83,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.15)", height: "2", rx: "1", width: "28", x: "7", y: "28" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 84,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.1)", height: "2", rx: "1", width: "32", x: "7", y: "34" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 85,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 80,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("g", { transform: "translate(40, 170)", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.1)", height: "55", rx: "6", width: "40", x: "0", y: "0" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 89,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.2)", height: "3", rx: "1.5", width: "26", x: "7", y: "10" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 90,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.12)", height: "2", rx: "1", width: "30", x: "7", y: "20" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 91,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("rect", { fill: "rgba(255,255,255,0.12)", height: "2", rx: "1", width: "24", x: "7", y: "26" }, void 0, false, {
              fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
              lineNumber: 92,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 88,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("path", { d: "M335 122 Q 340 150, 320 170", fill: "none", stroke: "rgba(255,255,255,0.2)", strokeDasharray: "4 4", strokeWidth: "1.5" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 96,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { cx: "60", cy: "260", fill: "rgba(255,255,255,0.2)", r: "8" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 99,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { cx: "350", cy: "260", fill: "rgba(255,255,255,0.15)", r: "10" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 100,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("circle", { cx: "180", cy: "260", fill: "rgba(255,255,255,0.1)", r: "6" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 101,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
          lineNumber: 39,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
          lineNumber: 38,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center space-y-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-2xl xl:text-3xl font-serif font-semibold text-white", children: "Seu CMS com superpoderes de IA" }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 106,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-white/70 text-sm xl:text-base max-w-sm mx-auto", children: "Crie conteudos incriveis com inteligencia artificial. Blog posts, artigos e muito mais em minutos." }, void 0, false, {
            fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
            lineNumber: 109,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
          lineNumber: 105,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
        lineNumber: 36,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "relative z-10 text-white/50 text-xs", children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " Contentta. Todos os direitos reservados"
      ] }, void 0, true, {
        fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
        lineNumber: 117,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
      lineNumber: 23,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/home/yorizel/Documents/contentta-nx/apps/web/src/routes/auth.tsx?tsr-split=component",
    lineNumber: 4,
    columnNumber: 10
  }, this);
}
export {
  AuthLayout as component
};
