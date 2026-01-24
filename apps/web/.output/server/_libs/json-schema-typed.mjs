var ContentEncoding;
(function(ContentEncoding2) {
  ContentEncoding2["7bit"] = "7bit";
  ContentEncoding2["8bit"] = "8bit";
  ContentEncoding2["Base64"] = "base64";
  ContentEncoding2["Binary"] = "binary";
  ContentEncoding2["IETFToken"] = "ietf-token";
  ContentEncoding2["QuotedPrintable"] = "quoted-printable";
  ContentEncoding2["XToken"] = "x-token";
})(ContentEncoding || (ContentEncoding = {}));
var Format;
(function(Format2) {
  Format2["Date"] = "date";
  Format2["DateTime"] = "date-time";
  Format2["Duration"] = "duration";
  Format2["Email"] = "email";
  Format2["Hostname"] = "hostname";
  Format2["IDNEmail"] = "idn-email";
  Format2["IDNHostname"] = "idn-hostname";
  Format2["IPv4"] = "ipv4";
  Format2["IPv6"] = "ipv6";
  Format2["IRI"] = "iri";
  Format2["IRIReference"] = "iri-reference";
  Format2["JSONPointer"] = "json-pointer";
  Format2["JSONPointerURIFragment"] = "json-pointer-uri-fragment";
  Format2["RegEx"] = "regex";
  Format2["RelativeJSONPointer"] = "relative-json-pointer";
  Format2["Time"] = "time";
  Format2["URI"] = "uri";
  Format2["URIReference"] = "uri-reference";
  Format2["URITemplate"] = "uri-template";
  Format2["UUID"] = "uuid";
})(Format || (Format = {}));
var TypeName;
(function(TypeName2) {
  TypeName2["Array"] = "array";
  TypeName2["Boolean"] = "boolean";
  TypeName2["Integer"] = "integer";
  TypeName2["Null"] = "null";
  TypeName2["Number"] = "number";
  TypeName2["Object"] = "object";
  TypeName2["String"] = "string";
})(TypeName || (TypeName = {}));
export {
  ContentEncoding as C,
  Format as F,
  TypeName as T
};
