import { J as Jn, h as html } from "../../../_libs/prettier.mjs";
import { c as convert } from "../../../_libs/html-to-text.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../../../_libs/react.mjs";
import { Writable } from "node:stream";
import "../@selderee/plugin-htmlparser2.mjs";
import "../../../_libs/selderee.mjs";
import "../../../_libs/parseley.mjs";
import "../../../_libs/leac.mjs";
import "../../../_libs/peberminta.mjs";
import "../../../_libs/domhandler.mjs";
import "../../../_libs/domelementtype.mjs";
import "../../../_libs/htmlparser2.mjs";
import "../../../_libs/entities.mjs";
import "../../../_libs/deepmerge.mjs";
import "../@ioredis/commands.mjs";
import "../../../_libs/dom-serializer.mjs";
function recursivelyMapDoc(doc, callback) {
  if (Array.isArray(doc)) return doc.map((innerDoc) => recursivelyMapDoc(innerDoc, callback));
  if (typeof doc === "object") {
    if (doc.type === "group") return {
      ...doc,
      contents: recursivelyMapDoc(doc.contents, callback),
      expandedStates: recursivelyMapDoc(doc.expandedStates, callback)
    };
    if ("contents" in doc) return {
      ...doc,
      contents: recursivelyMapDoc(doc.contents, callback)
    };
    if ("parts" in doc) return {
      ...doc,
      parts: recursivelyMapDoc(doc.parts, callback)
    };
    if (doc.type === "if-break") return {
      ...doc,
      breakContents: recursivelyMapDoc(doc.breakContents, callback),
      flatContents: recursivelyMapDoc(doc.flatContents, callback)
    };
  }
  return callback(doc);
}
const modifiedHtml = { ...html };
if (modifiedHtml.printers) {
  const previousPrint = modifiedHtml.printers.html.print;
  modifiedHtml.printers.html.print = (path, options, print, args) => {
    const node = path.getNode();
    const rawPrintingResult = previousPrint(path, options, print, args);
    if (node.type === "ieConditionalComment") return recursivelyMapDoc(rawPrintingResult, (doc) => {
      if (typeof doc === "object" && doc.type === "line") return doc.soft ? "" : " ";
      return doc;
    });
    return rawPrintingResult;
  };
}
const defaults = {
  endOfLine: "lf",
  tabWidth: 2,
  plugins: [modifiedHtml],
  bracketSameLine: true,
  parser: "html"
};
const pretty = (str, options = {}) => {
  return Jn(str.replaceAll("\0", ""), {
    ...defaults,
    ...options
  });
};
const plainTextSelectors = [
  {
    selector: "img",
    format: "skip"
  },
  {
    selector: "[data-skip-in-text=true]",
    format: "skip"
  },
  {
    selector: "a",
    options: {
      linkBrackets: false,
      hideLinkHrefIfSameAsText: true
    }
  }
];
function toPlainText(html$1, options) {
  return convert(html$1, {
    wordwrap: false,
    ...options,
    selectors: [...plainTextSelectors, ...options?.selectors ?? []]
  });
}
const readStream = async (stream) => {
  let result = "";
  const decoder = new TextDecoder("utf-8");
  if ("pipeTo" in stream) {
    const writableStream = new WritableStream({
      write(chunk) {
        result += decoder.decode(chunk, { stream: true });
      },
      close() {
        result += decoder.decode();
      }
    });
    await stream.pipeTo(writableStream);
  } else {
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        result += decoder.decode(chunk, { stream: true });
        callback();
      },
      final(callback) {
        result += decoder.decode();
        callback();
      }
    });
    await new Promise((resolve, reject) => {
      writable.on("pipe", (source) => {
        source.on("error", (err) => {
          writable.destroy(err);
        });
      });
      writable.on("error", reject);
      writable.on("close", () => {
        resolve();
      });
      stream.pipe(writable);
    });
  }
  return result;
};
const render = async (node, options) => {
  const suspendedElement = /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { children: node });
  const reactDOMServer = await import("../react-dom.mjs").then(function(n) {
    return n.s;
  }).then((m) => {
    if ("default" in m) return m.default;
    return m;
  });
  let html$1;
  if (Object.hasOwn(reactDOMServer, "renderToReadableStream") && typeof WritableStream !== "undefined") html$1 = await readStream(await reactDOMServer.renderToReadableStream(suspendedElement, { progressiveChunkSize: Number.POSITIVE_INFINITY }));
  else await new Promise((resolve, reject) => {
    const stream = reactDOMServer.renderToPipeableStream(suspendedElement, {
      async onAllReady() {
        html$1 = await readStream(stream);
        resolve();
      },
      onError(error) {
        reject(error);
      },
      progressiveChunkSize: Number.POSITIVE_INFINITY
    });
  });
  if (options?.plainText) return toPlainText(html$1, options.htmlToTextOptions);
  const document = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html$1.replace(/<!DOCTYPE.*?>/, "")}`;
  if (options?.pretty) return pretty(document);
  return document;
};
export {
  plainTextSelectors,
  pretty,
  render,
  toPlainText
};
