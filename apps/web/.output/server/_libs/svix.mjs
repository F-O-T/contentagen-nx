import { r as require$$1 } from "./uuid.mjs";
import { r as requireBase64 } from "../_chunks/_libs/@stablelib/base64.mjs";
import { r as requireSha256 } from "./fast-sha256.mjs";
var dist = {};
var application = {};
var applicationIn = {};
var hasRequiredApplicationIn;
function requireApplicationIn() {
  if (hasRequiredApplicationIn) return applicationIn;
  hasRequiredApplicationIn = 1;
  Object.defineProperty(applicationIn, "__esModule", { value: true });
  applicationIn.ApplicationInSerializer = void 0;
  applicationIn.ApplicationInSerializer = {
    _fromJsonObject(object) {
      return {
        metadata: object["metadata"],
        name: object["name"],
        rateLimit: object["rateLimit"],
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      return {
        metadata: self.metadata,
        name: self.name,
        rateLimit: self.rateLimit,
        uid: self.uid
      };
    }
  };
  return applicationIn;
}
var applicationOut = {};
var hasRequiredApplicationOut;
function requireApplicationOut() {
  if (hasRequiredApplicationOut) return applicationOut;
  hasRequiredApplicationOut = 1;
  Object.defineProperty(applicationOut, "__esModule", { value: true });
  applicationOut.ApplicationOutSerializer = void 0;
  applicationOut.ApplicationOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        id: object["id"],
        metadata: object["metadata"],
        name: object["name"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        id: self.id,
        metadata: self.metadata,
        name: self.name,
        rateLimit: self.rateLimit,
        uid: self.uid,
        updatedAt: self.updatedAt
      };
    }
  };
  return applicationOut;
}
var applicationPatch = {};
var hasRequiredApplicationPatch;
function requireApplicationPatch() {
  if (hasRequiredApplicationPatch) return applicationPatch;
  hasRequiredApplicationPatch = 1;
  Object.defineProperty(applicationPatch, "__esModule", { value: true });
  applicationPatch.ApplicationPatchSerializer = void 0;
  applicationPatch.ApplicationPatchSerializer = {
    _fromJsonObject(object) {
      return {
        metadata: object["metadata"],
        name: object["name"],
        rateLimit: object["rateLimit"],
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      return {
        metadata: self.metadata,
        name: self.name,
        rateLimit: self.rateLimit,
        uid: self.uid
      };
    }
  };
  return applicationPatch;
}
var listResponseApplicationOut = {};
var hasRequiredListResponseApplicationOut;
function requireListResponseApplicationOut() {
  if (hasRequiredListResponseApplicationOut) return listResponseApplicationOut;
  hasRequiredListResponseApplicationOut = 1;
  Object.defineProperty(listResponseApplicationOut, "__esModule", { value: true });
  listResponseApplicationOut.ListResponseApplicationOutSerializer = void 0;
  const applicationOut_1 = /* @__PURE__ */ requireApplicationOut();
  listResponseApplicationOut.ListResponseApplicationOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => applicationOut_1.ApplicationOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => applicationOut_1.ApplicationOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseApplicationOut;
}
var request = {};
var util = {};
var hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil) return util;
  hasRequiredUtil = 1;
  Object.defineProperty(util, "__esModule", { value: true });
  util.ApiException = void 0;
  class ApiException extends Error {
    constructor(code, body, headers) {
      super(`HTTP-Code: ${code}
Headers: ${JSON.stringify(headers)}`);
      this.code = code;
      this.body = body;
      this.headers = {};
      headers.forEach((value, name) => {
        this.headers[name] = value;
      });
    }
  }
  util.ApiException = ApiException;
  return util;
}
var hasRequiredRequest;
function requireRequest() {
  if (hasRequiredRequest) return request;
  hasRequiredRequest = 1;
  (function(exports$1) {
    var __awaiter = request && request.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.SvixRequest = exports$1.HttpMethod = exports$1.LIB_VERSION = void 0;
    const util_1 = /* @__PURE__ */ requireUtil();
    const uuid_1 = require$$1;
    exports$1.LIB_VERSION = "1.76.1";
    const USER_AGENT = `svix-libs/${exports$1.LIB_VERSION}/javascript`;
    (function(HttpMethod) {
      HttpMethod["GET"] = "GET";
      HttpMethod["HEAD"] = "HEAD";
      HttpMethod["POST"] = "POST";
      HttpMethod["PUT"] = "PUT";
      HttpMethod["DELETE"] = "DELETE";
      HttpMethod["CONNECT"] = "CONNECT";
      HttpMethod["OPTIONS"] = "OPTIONS";
      HttpMethod["TRACE"] = "TRACE";
      HttpMethod["PATCH"] = "PATCH";
    })(exports$1.HttpMethod || (exports$1.HttpMethod = {}));
    class SvixRequest {
      constructor(method, path) {
        this.method = method;
        this.path = path;
        this.queryParams = {};
        this.headerParams = {};
      }
      setPathParam(name, value) {
        const newPath = this.path.replace(`{${name}}`, encodeURIComponent(value));
        if (this.path === newPath) {
          throw new Error(`path parameter ${name} not found`);
        }
        this.path = newPath;
      }
      setQueryParam(name, value) {
        if (value === void 0 || value === null) {
          return;
        }
        if (typeof value === "string") {
          this.queryParams[name] = value;
        } else if (typeof value === "boolean" || typeof value === "number") {
          this.queryParams[name] = value.toString();
        } else if (value instanceof Date) {
          this.queryParams[name] = value.toISOString();
        } else if (value instanceof Array) {
          if (value.length > 0) {
            this.queryParams[name] = value.join(",");
          }
        } else {
          throw new Error(`query parameter ${name} has unsupported type`);
        }
      }
      setHeaderParam(name, value) {
        if (value === void 0) {
          return;
        }
        this.headerParams[name] = value;
      }
      setBody(value) {
        this.body = JSON.stringify(value);
      }
      send(ctx, parseResponseBody) {
        return __awaiter(this, void 0, void 0, function* () {
          const response = yield this.sendInner(ctx);
          if (response.status == 204) {
            return null;
          }
          const responseBody = yield response.text();
          return parseResponseBody(JSON.parse(responseBody));
        });
      }
      sendNoResponseBody(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
          yield this.sendInner(ctx);
        });
      }
      sendInner(ctx) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
          const url = new URL(ctx.baseUrl + this.path);
          for (const [name, value] of Object.entries(this.queryParams)) {
            url.searchParams.set(name, value);
          }
          if (this.headerParams["idempotency-key"] === void 0 && this.method.toUpperCase() === "POST") {
            this.headerParams["idempotency-key"] = "auto_" + (0, uuid_1.v4)();
          }
          const randomId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
          if (this.body != null) {
            this.headerParams["content-type"] = "application/json";
          }
          const isCredentialsSupported = "credentials" in Request.prototype;
          const response = yield sendWithRetry(url, {
            method: this.method.toString(),
            body: this.body,
            headers: Object.assign({ accept: "application/json, */*;q=0.8", authorization: `Bearer ${ctx.token}`, "user-agent": USER_AGENT, "svix-req-id": randomId.toString() }, this.headerParams),
            credentials: isCredentialsSupported ? "same-origin" : void 0,
            signal: ctx.timeout !== void 0 ? AbortSignal.timeout(ctx.timeout) : void 0
          }, ctx.retryScheduleInMs, (_a = ctx.retryScheduleInMs) === null || _a === void 0 ? void 0 : _a[0], ((_b = ctx.retryScheduleInMs) === null || _b === void 0 ? void 0 : _b.length) || ctx.numRetries);
          return filterResponseForErrors(response);
        });
      }
    }
    exports$1.SvixRequest = SvixRequest;
    function filterResponseForErrors(response) {
      return __awaiter(this, void 0, void 0, function* () {
        if (response.status < 300) {
          return response;
        }
        const responseBody = yield response.text();
        if (response.status === 422) {
          throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
        }
        if (response.status >= 400 && response.status <= 499) {
          throw new util_1.ApiException(response.status, JSON.parse(responseBody), response.headers);
        }
        throw new util_1.ApiException(response.status, responseBody, response.headers);
      });
    }
    function sendWithRetry(url, init, retryScheduleInMs, nextInterval = 50, triesLeft = 2, retryCount = 1) {
      return __awaiter(this, void 0, void 0, function* () {
        const sleep = (interval) => new Promise((resolve) => setTimeout(resolve, interval));
        try {
          const response = yield fetch(url, init);
          if (triesLeft <= 0 || response.status < 500) {
            return response;
          }
        } catch (e) {
          if (triesLeft <= 0) {
            throw e;
          }
        }
        yield sleep(nextInterval);
        init.headers["svix-retry-count"] = retryCount.toString();
        nextInterval = (retryScheduleInMs === null || retryScheduleInMs === void 0 ? void 0 : retryScheduleInMs[retryCount]) || nextInterval * 2;
        return yield sendWithRetry(url, init, retryScheduleInMs, nextInterval, --triesLeft, ++retryCount);
      });
    }
  })(request);
  return request;
}
var hasRequiredApplication;
function requireApplication() {
  if (hasRequiredApplication) return application;
  hasRequiredApplication = 1;
  Object.defineProperty(application, "__esModule", { value: true });
  application.Application = void 0;
  const applicationIn_1 = /* @__PURE__ */ requireApplicationIn();
  const applicationOut_1 = /* @__PURE__ */ requireApplicationOut();
  const applicationPatch_1 = /* @__PURE__ */ requireApplicationPatch();
  const listResponseApplicationOut_1 = /* @__PURE__ */ requireListResponseApplicationOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class Application {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app");
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
      return request2.send(this.requestCtx, listResponseApplicationOut_1.ListResponseApplicationOutSerializer._fromJsonObject);
    }
    create(applicationIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app");
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn2));
      return request2.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    getOrCreate(applicationIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app");
      request2.setQueryParam("get_if_exists", true);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn2));
      return request2.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    get(appId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}");
      request2.setPathParam("app_id", appId);
      return request2.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    update(appId, applicationIn2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}");
      request2.setPathParam("app_id", appId);
      request2.setBody(applicationIn_1.ApplicationInSerializer._toJsonObject(applicationIn2));
      return request2.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
    delete(appId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}");
      request2.setPathParam("app_id", appId);
      return request2.sendNoResponseBody(this.requestCtx);
    }
    patch(appId, applicationPatch2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}");
      request2.setPathParam("app_id", appId);
      request2.setBody(applicationPatch_1.ApplicationPatchSerializer._toJsonObject(applicationPatch2));
      return request2.send(this.requestCtx, applicationOut_1.ApplicationOutSerializer._fromJsonObject);
    }
  }
  application.Application = Application;
  return application;
}
var authentication = {};
var appPortalAccessIn = {};
var appPortalCapability = {};
var hasRequiredAppPortalCapability;
function requireAppPortalCapability() {
  if (hasRequiredAppPortalCapability) return appPortalCapability;
  hasRequiredAppPortalCapability = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.AppPortalCapabilitySerializer = exports$1.AppPortalCapability = void 0;
    (function(AppPortalCapability) {
      AppPortalCapability["ViewBase"] = "ViewBase";
      AppPortalCapability["ViewEndpointSecret"] = "ViewEndpointSecret";
      AppPortalCapability["ManageEndpointSecret"] = "ManageEndpointSecret";
      AppPortalCapability["ManageTransformations"] = "ManageTransformations";
      AppPortalCapability["CreateAttempts"] = "CreateAttempts";
      AppPortalCapability["ManageEndpoint"] = "ManageEndpoint";
    })(exports$1.AppPortalCapability || (exports$1.AppPortalCapability = {}));
    exports$1.AppPortalCapabilitySerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  })(appPortalCapability);
  return appPortalCapability;
}
var hasRequiredAppPortalAccessIn;
function requireAppPortalAccessIn() {
  if (hasRequiredAppPortalAccessIn) return appPortalAccessIn;
  hasRequiredAppPortalAccessIn = 1;
  Object.defineProperty(appPortalAccessIn, "__esModule", { value: true });
  appPortalAccessIn.AppPortalAccessInSerializer = void 0;
  const appPortalCapability_1 = /* @__PURE__ */ requireAppPortalCapability();
  const applicationIn_1 = /* @__PURE__ */ requireApplicationIn();
  appPortalAccessIn.AppPortalAccessInSerializer = {
    _fromJsonObject(object) {
      var _a;
      return {
        application: object["application"] ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"]) : void 0,
        capabilities: (_a = object["capabilities"]) === null || _a === void 0 ? void 0 : _a.map((item) => appPortalCapability_1.AppPortalCapabilitySerializer._fromJsonObject(item)),
        expiry: object["expiry"],
        featureFlags: object["featureFlags"],
        readOnly: object["readOnly"],
        sessionId: object["sessionId"]
      };
    },
    _toJsonObject(self) {
      var _a;
      return {
        application: self.application ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application) : void 0,
        capabilities: (_a = self.capabilities) === null || _a === void 0 ? void 0 : _a.map((item) => appPortalCapability_1.AppPortalCapabilitySerializer._toJsonObject(item)),
        expiry: self.expiry,
        featureFlags: self.featureFlags,
        readOnly: self.readOnly,
        sessionId: self.sessionId
      };
    }
  };
  return appPortalAccessIn;
}
var appPortalAccessOut = {};
var hasRequiredAppPortalAccessOut;
function requireAppPortalAccessOut() {
  if (hasRequiredAppPortalAccessOut) return appPortalAccessOut;
  hasRequiredAppPortalAccessOut = 1;
  Object.defineProperty(appPortalAccessOut, "__esModule", { value: true });
  appPortalAccessOut.AppPortalAccessOutSerializer = void 0;
  appPortalAccessOut.AppPortalAccessOutSerializer = {
    _fromJsonObject(object) {
      return {
        token: object["token"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        token: self.token,
        url: self.url
      };
    }
  };
  return appPortalAccessOut;
}
var applicationTokenExpireIn = {};
var hasRequiredApplicationTokenExpireIn;
function requireApplicationTokenExpireIn() {
  if (hasRequiredApplicationTokenExpireIn) return applicationTokenExpireIn;
  hasRequiredApplicationTokenExpireIn = 1;
  Object.defineProperty(applicationTokenExpireIn, "__esModule", { value: true });
  applicationTokenExpireIn.ApplicationTokenExpireInSerializer = void 0;
  applicationTokenExpireIn.ApplicationTokenExpireInSerializer = {
    _fromJsonObject(object) {
      return {
        expiry: object["expiry"],
        sessionIds: object["sessionIds"]
      };
    },
    _toJsonObject(self) {
      return {
        expiry: self.expiry,
        sessionIds: self.sessionIds
      };
    }
  };
  return applicationTokenExpireIn;
}
var dashboardAccessOut = {};
var hasRequiredDashboardAccessOut;
function requireDashboardAccessOut() {
  if (hasRequiredDashboardAccessOut) return dashboardAccessOut;
  hasRequiredDashboardAccessOut = 1;
  Object.defineProperty(dashboardAccessOut, "__esModule", { value: true });
  dashboardAccessOut.DashboardAccessOutSerializer = void 0;
  dashboardAccessOut.DashboardAccessOutSerializer = {
    _fromJsonObject(object) {
      return {
        token: object["token"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        token: self.token,
        url: self.url
      };
    }
  };
  return dashboardAccessOut;
}
var hasRequiredAuthentication;
function requireAuthentication() {
  if (hasRequiredAuthentication) return authentication;
  hasRequiredAuthentication = 1;
  Object.defineProperty(authentication, "__esModule", { value: true });
  authentication.Authentication = void 0;
  const appPortalAccessIn_1 = /* @__PURE__ */ requireAppPortalAccessIn();
  const appPortalAccessOut_1 = /* @__PURE__ */ requireAppPortalAccessOut();
  const applicationTokenExpireIn_1 = /* @__PURE__ */ requireApplicationTokenExpireIn();
  const dashboardAccessOut_1 = /* @__PURE__ */ requireDashboardAccessOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class Authentication {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    appPortalAccess(appId, appPortalAccessIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/app-portal-access/{app_id}");
      request2.setPathParam("app_id", appId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(appPortalAccessIn_1.AppPortalAccessInSerializer._toJsonObject(appPortalAccessIn2));
      return request2.send(this.requestCtx, appPortalAccessOut_1.AppPortalAccessOutSerializer._fromJsonObject);
    }
    expireAll(appId, applicationTokenExpireIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/app/{app_id}/expire-all");
      request2.setPathParam("app_id", appId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(applicationTokenExpireIn_1.ApplicationTokenExpireInSerializer._toJsonObject(applicationTokenExpireIn2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
    dashboardAccess(appId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/dashboard-access/{app_id}");
      request2.setPathParam("app_id", appId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      return request2.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
    }
    logout(options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/auth/logout");
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      return request2.sendNoResponseBody(this.requestCtx);
    }
  }
  authentication.Authentication = Authentication;
  return authentication;
}
var backgroundTask = {};
var backgroundTaskOut = {};
var backgroundTaskStatus = {};
var hasRequiredBackgroundTaskStatus;
function requireBackgroundTaskStatus() {
  if (hasRequiredBackgroundTaskStatus) return backgroundTaskStatus;
  hasRequiredBackgroundTaskStatus = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.BackgroundTaskStatusSerializer = exports$1.BackgroundTaskStatus = void 0;
    (function(BackgroundTaskStatus) {
      BackgroundTaskStatus["Running"] = "running";
      BackgroundTaskStatus["Finished"] = "finished";
      BackgroundTaskStatus["Failed"] = "failed";
    })(exports$1.BackgroundTaskStatus || (exports$1.BackgroundTaskStatus = {}));
    exports$1.BackgroundTaskStatusSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  })(backgroundTaskStatus);
  return backgroundTaskStatus;
}
var backgroundTaskType = {};
var hasRequiredBackgroundTaskType;
function requireBackgroundTaskType() {
  if (hasRequiredBackgroundTaskType) return backgroundTaskType;
  hasRequiredBackgroundTaskType = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.BackgroundTaskTypeSerializer = exports$1.BackgroundTaskType = void 0;
    (function(BackgroundTaskType) {
      BackgroundTaskType["EndpointReplay"] = "endpoint.replay";
      BackgroundTaskType["EndpointRecover"] = "endpoint.recover";
      BackgroundTaskType["ApplicationStats"] = "application.stats";
      BackgroundTaskType["MessageBroadcast"] = "message.broadcast";
      BackgroundTaskType["SdkGenerate"] = "sdk.generate";
      BackgroundTaskType["EventTypeAggregate"] = "event-type.aggregate";
      BackgroundTaskType["ApplicationPurgeContent"] = "application.purge_content";
    })(exports$1.BackgroundTaskType || (exports$1.BackgroundTaskType = {}));
    exports$1.BackgroundTaskTypeSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  })(backgroundTaskType);
  return backgroundTaskType;
}
var hasRequiredBackgroundTaskOut;
function requireBackgroundTaskOut() {
  if (hasRequiredBackgroundTaskOut) return backgroundTaskOut;
  hasRequiredBackgroundTaskOut = 1;
  Object.defineProperty(backgroundTaskOut, "__esModule", { value: true });
  backgroundTaskOut.BackgroundTaskOutSerializer = void 0;
  const backgroundTaskStatus_1 = /* @__PURE__ */ requireBackgroundTaskStatus();
  const backgroundTaskType_1 = /* @__PURE__ */ requireBackgroundTaskType();
  backgroundTaskOut.BackgroundTaskOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"],
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data,
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
      };
    }
  };
  return backgroundTaskOut;
}
var listResponseBackgroundTaskOut = {};
var hasRequiredListResponseBackgroundTaskOut;
function requireListResponseBackgroundTaskOut() {
  if (hasRequiredListResponseBackgroundTaskOut) return listResponseBackgroundTaskOut;
  hasRequiredListResponseBackgroundTaskOut = 1;
  Object.defineProperty(listResponseBackgroundTaskOut, "__esModule", { value: true });
  listResponseBackgroundTaskOut.ListResponseBackgroundTaskOutSerializer = void 0;
  const backgroundTaskOut_1 = /* @__PURE__ */ requireBackgroundTaskOut();
  listResponseBackgroundTaskOut.ListResponseBackgroundTaskOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => backgroundTaskOut_1.BackgroundTaskOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseBackgroundTaskOut;
}
var hasRequiredBackgroundTask;
function requireBackgroundTask() {
  if (hasRequiredBackgroundTask) return backgroundTask;
  hasRequiredBackgroundTask = 1;
  Object.defineProperty(backgroundTask, "__esModule", { value: true });
  backgroundTask.BackgroundTask = void 0;
  const backgroundTaskOut_1 = /* @__PURE__ */ requireBackgroundTaskOut();
  const listResponseBackgroundTaskOut_1 = /* @__PURE__ */ requireListResponseBackgroundTaskOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class BackgroundTask {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task");
      request2.setQueryParam("status", options === null || options === void 0 ? void 0 : options.status);
      request2.setQueryParam("task", options === null || options === void 0 ? void 0 : options.task);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
      return request2.send(this.requestCtx, listResponseBackgroundTaskOut_1.ListResponseBackgroundTaskOutSerializer._fromJsonObject);
    }
    listByEndpoint(options) {
      return this.list(options);
    }
    get(taskId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/background-task/{task_id}");
      request2.setPathParam("task_id", taskId);
      return request2.send(this.requestCtx, backgroundTaskOut_1.BackgroundTaskOutSerializer._fromJsonObject);
    }
  }
  backgroundTask.BackgroundTask = BackgroundTask;
  return backgroundTask;
}
var endpoint = {};
var endpointHeadersIn = {};
var hasRequiredEndpointHeadersIn;
function requireEndpointHeadersIn() {
  if (hasRequiredEndpointHeadersIn) return endpointHeadersIn;
  hasRequiredEndpointHeadersIn = 1;
  Object.defineProperty(endpointHeadersIn, "__esModule", { value: true });
  endpointHeadersIn.EndpointHeadersInSerializer = void 0;
  endpointHeadersIn.EndpointHeadersInSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers
      };
    }
  };
  return endpointHeadersIn;
}
var endpointHeadersOut = {};
var hasRequiredEndpointHeadersOut;
function requireEndpointHeadersOut() {
  if (hasRequiredEndpointHeadersOut) return endpointHeadersOut;
  hasRequiredEndpointHeadersOut = 1;
  Object.defineProperty(endpointHeadersOut, "__esModule", { value: true });
  endpointHeadersOut.EndpointHeadersOutSerializer = void 0;
  endpointHeadersOut.EndpointHeadersOutSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"],
        sensitive: object["sensitive"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers,
        sensitive: self.sensitive
      };
    }
  };
  return endpointHeadersOut;
}
var endpointHeadersPatchIn = {};
var hasRequiredEndpointHeadersPatchIn;
function requireEndpointHeadersPatchIn() {
  if (hasRequiredEndpointHeadersPatchIn) return endpointHeadersPatchIn;
  hasRequiredEndpointHeadersPatchIn = 1;
  Object.defineProperty(endpointHeadersPatchIn, "__esModule", { value: true });
  endpointHeadersPatchIn.EndpointHeadersPatchInSerializer = void 0;
  endpointHeadersPatchIn.EndpointHeadersPatchInSerializer = {
    _fromJsonObject(object) {
      return {
        deleteHeaders: object["deleteHeaders"],
        headers: object["headers"]
      };
    },
    _toJsonObject(self) {
      return {
        deleteHeaders: self.deleteHeaders,
        headers: self.headers
      };
    }
  };
  return endpointHeadersPatchIn;
}
var endpointIn = {};
var hasRequiredEndpointIn;
function requireEndpointIn() {
  if (hasRequiredEndpointIn) return endpointIn;
  hasRequiredEndpointIn = 1;
  Object.defineProperty(endpointIn, "__esModule", { value: true });
  endpointIn.EndpointInSerializer = void 0;
  endpointIn.EndpointInSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        headers: object["headers"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        secret: object["secret"],
        uid: object["uid"],
        url: object["url"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        headers: self.headers,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        secret: self.secret,
        uid: self.uid,
        url: self.url,
        version: self.version
      };
    }
  };
  return endpointIn;
}
var endpointOut = {};
var hasRequiredEndpointOut;
function requireEndpointOut() {
  if (hasRequiredEndpointOut) return endpointOut;
  hasRequiredEndpointOut = 1;
  Object.defineProperty(endpointOut, "__esModule", { value: true });
  endpointOut.EndpointOutSerializer = void 0;
  endpointOut.EndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        createdAt: new Date(object["createdAt"]),
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        id: object["id"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"]),
        url: object["url"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        createdAt: self.createdAt,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        id: self.id,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        updatedAt: self.updatedAt,
        url: self.url,
        version: self.version
      };
    }
  };
  return endpointOut;
}
var endpointPatch = {};
var hasRequiredEndpointPatch;
function requireEndpointPatch() {
  if (hasRequiredEndpointPatch) return endpointPatch;
  hasRequiredEndpointPatch = 1;
  Object.defineProperty(endpointPatch, "__esModule", { value: true });
  endpointPatch.EndpointPatchSerializer = void 0;
  endpointPatch.EndpointPatchSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        secret: object["secret"],
        uid: object["uid"],
        url: object["url"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        secret: self.secret,
        uid: self.uid,
        url: self.url,
        version: self.version
      };
    }
  };
  return endpointPatch;
}
var endpointSecretOut = {};
var hasRequiredEndpointSecretOut;
function requireEndpointSecretOut() {
  if (hasRequiredEndpointSecretOut) return endpointSecretOut;
  hasRequiredEndpointSecretOut = 1;
  Object.defineProperty(endpointSecretOut, "__esModule", { value: true });
  endpointSecretOut.EndpointSecretOutSerializer = void 0;
  endpointSecretOut.EndpointSecretOutSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
  return endpointSecretOut;
}
var endpointSecretRotateIn = {};
var hasRequiredEndpointSecretRotateIn;
function requireEndpointSecretRotateIn() {
  if (hasRequiredEndpointSecretRotateIn) return endpointSecretRotateIn;
  hasRequiredEndpointSecretRotateIn = 1;
  Object.defineProperty(endpointSecretRotateIn, "__esModule", { value: true });
  endpointSecretRotateIn.EndpointSecretRotateInSerializer = void 0;
  endpointSecretRotateIn.EndpointSecretRotateInSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
  return endpointSecretRotateIn;
}
var endpointStats = {};
var hasRequiredEndpointStats;
function requireEndpointStats() {
  if (hasRequiredEndpointStats) return endpointStats;
  hasRequiredEndpointStats = 1;
  Object.defineProperty(endpointStats, "__esModule", { value: true });
  endpointStats.EndpointStatsSerializer = void 0;
  endpointStats.EndpointStatsSerializer = {
    _fromJsonObject(object) {
      return {
        fail: object["fail"],
        pending: object["pending"],
        sending: object["sending"],
        success: object["success"]
      };
    },
    _toJsonObject(self) {
      return {
        fail: self.fail,
        pending: self.pending,
        sending: self.sending,
        success: self.success
      };
    }
  };
  return endpointStats;
}
var endpointTransformationIn = {};
var hasRequiredEndpointTransformationIn;
function requireEndpointTransformationIn() {
  if (hasRequiredEndpointTransformationIn) return endpointTransformationIn;
  hasRequiredEndpointTransformationIn = 1;
  Object.defineProperty(endpointTransformationIn, "__esModule", { value: true });
  endpointTransformationIn.EndpointTransformationInSerializer = void 0;
  endpointTransformationIn.EndpointTransformationInSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled
      };
    }
  };
  return endpointTransformationIn;
}
var endpointTransformationOut = {};
var hasRequiredEndpointTransformationOut;
function requireEndpointTransformationOut() {
  if (hasRequiredEndpointTransformationOut) return endpointTransformationOut;
  hasRequiredEndpointTransformationOut = 1;
  Object.defineProperty(endpointTransformationOut, "__esModule", { value: true });
  endpointTransformationOut.EndpointTransformationOutSerializer = void 0;
  endpointTransformationOut.EndpointTransformationOutSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled
      };
    }
  };
  return endpointTransformationOut;
}
var endpointTransformationPatch = {};
var hasRequiredEndpointTransformationPatch;
function requireEndpointTransformationPatch() {
  if (hasRequiredEndpointTransformationPatch) return endpointTransformationPatch;
  hasRequiredEndpointTransformationPatch = 1;
  Object.defineProperty(endpointTransformationPatch, "__esModule", { value: true });
  endpointTransformationPatch.EndpointTransformationPatchSerializer = void 0;
  endpointTransformationPatch.EndpointTransformationPatchSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled
      };
    }
  };
  return endpointTransformationPatch;
}
var endpointUpdate = {};
var hasRequiredEndpointUpdate;
function requireEndpointUpdate() {
  if (hasRequiredEndpointUpdate) return endpointUpdate;
  hasRequiredEndpointUpdate = 1;
  Object.defineProperty(endpointUpdate, "__esModule", { value: true });
  endpointUpdate.EndpointUpdateSerializer = void 0;
  endpointUpdate.EndpointUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        url: object["url"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        url: self.url,
        version: self.version
      };
    }
  };
  return endpointUpdate;
}
var eventExampleIn = {};
var hasRequiredEventExampleIn;
function requireEventExampleIn() {
  if (hasRequiredEventExampleIn) return eventExampleIn;
  hasRequiredEventExampleIn = 1;
  Object.defineProperty(eventExampleIn, "__esModule", { value: true });
  eventExampleIn.EventExampleInSerializer = void 0;
  eventExampleIn.EventExampleInSerializer = {
    _fromJsonObject(object) {
      return {
        eventType: object["eventType"],
        exampleIndex: object["exampleIndex"]
      };
    },
    _toJsonObject(self) {
      return {
        eventType: self.eventType,
        exampleIndex: self.exampleIndex
      };
    }
  };
  return eventExampleIn;
}
var listResponseEndpointOut = {};
var hasRequiredListResponseEndpointOut;
function requireListResponseEndpointOut() {
  if (hasRequiredListResponseEndpointOut) return listResponseEndpointOut;
  hasRequiredListResponseEndpointOut = 1;
  Object.defineProperty(listResponseEndpointOut, "__esModule", { value: true });
  listResponseEndpointOut.ListResponseEndpointOutSerializer = void 0;
  const endpointOut_1 = /* @__PURE__ */ requireEndpointOut();
  listResponseEndpointOut.ListResponseEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => endpointOut_1.EndpointOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => endpointOut_1.EndpointOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseEndpointOut;
}
var messageOut = {};
var hasRequiredMessageOut;
function requireMessageOut() {
  if (hasRequiredMessageOut) return messageOut;
  hasRequiredMessageOut = 1;
  Object.defineProperty(messageOut, "__esModule", { value: true });
  messageOut.MessageOutSerializer = void 0;
  messageOut.MessageOutSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        eventId: object["eventId"],
        eventType: object["eventType"],
        id: object["id"],
        payload: object["payload"],
        tags: object["tags"],
        timestamp: new Date(object["timestamp"])
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        eventId: self.eventId,
        eventType: self.eventType,
        id: self.id,
        payload: self.payload,
        tags: self.tags,
        timestamp: self.timestamp
      };
    }
  };
  return messageOut;
}
var recoverIn = {};
var hasRequiredRecoverIn;
function requireRecoverIn() {
  if (hasRequiredRecoverIn) return recoverIn;
  hasRequiredRecoverIn = 1;
  Object.defineProperty(recoverIn, "__esModule", { value: true });
  recoverIn.RecoverInSerializer = void 0;
  recoverIn.RecoverInSerializer = {
    _fromJsonObject(object) {
      return {
        since: new Date(object["since"]),
        until: object["until"] ? new Date(object["until"]) : null
      };
    },
    _toJsonObject(self) {
      return {
        since: self.since,
        until: self.until
      };
    }
  };
  return recoverIn;
}
var recoverOut = {};
var hasRequiredRecoverOut;
function requireRecoverOut() {
  if (hasRequiredRecoverOut) return recoverOut;
  hasRequiredRecoverOut = 1;
  Object.defineProperty(recoverOut, "__esModule", { value: true });
  recoverOut.RecoverOutSerializer = void 0;
  const backgroundTaskStatus_1 = /* @__PURE__ */ requireBackgroundTaskStatus();
  const backgroundTaskType_1 = /* @__PURE__ */ requireBackgroundTaskType();
  recoverOut.RecoverOutSerializer = {
    _fromJsonObject(object) {
      return {
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
      };
    },
    _toJsonObject(self) {
      return {
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
      };
    }
  };
  return recoverOut;
}
var replayIn = {};
var hasRequiredReplayIn;
function requireReplayIn() {
  if (hasRequiredReplayIn) return replayIn;
  hasRequiredReplayIn = 1;
  Object.defineProperty(replayIn, "__esModule", { value: true });
  replayIn.ReplayInSerializer = void 0;
  replayIn.ReplayInSerializer = {
    _fromJsonObject(object) {
      return {
        since: new Date(object["since"]),
        until: object["until"] ? new Date(object["until"]) : null
      };
    },
    _toJsonObject(self) {
      return {
        since: self.since,
        until: self.until
      };
    }
  };
  return replayIn;
}
var replayOut = {};
var hasRequiredReplayOut;
function requireReplayOut() {
  if (hasRequiredReplayOut) return replayOut;
  hasRequiredReplayOut = 1;
  Object.defineProperty(replayOut, "__esModule", { value: true });
  replayOut.ReplayOutSerializer = void 0;
  const backgroundTaskStatus_1 = /* @__PURE__ */ requireBackgroundTaskStatus();
  const backgroundTaskType_1 = /* @__PURE__ */ requireBackgroundTaskType();
  replayOut.ReplayOutSerializer = {
    _fromJsonObject(object) {
      return {
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
      };
    },
    _toJsonObject(self) {
      return {
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
      };
    }
  };
  return replayOut;
}
var hasRequiredEndpoint;
function requireEndpoint() {
  if (hasRequiredEndpoint) return endpoint;
  hasRequiredEndpoint = 1;
  Object.defineProperty(endpoint, "__esModule", { value: true });
  endpoint.Endpoint = void 0;
  const endpointHeadersIn_1 = /* @__PURE__ */ requireEndpointHeadersIn();
  const endpointHeadersOut_1 = /* @__PURE__ */ requireEndpointHeadersOut();
  const endpointHeadersPatchIn_1 = /* @__PURE__ */ requireEndpointHeadersPatchIn();
  const endpointIn_1 = /* @__PURE__ */ requireEndpointIn();
  const endpointOut_1 = /* @__PURE__ */ requireEndpointOut();
  const endpointPatch_1 = /* @__PURE__ */ requireEndpointPatch();
  const endpointSecretOut_1 = /* @__PURE__ */ requireEndpointSecretOut();
  const endpointSecretRotateIn_1 = /* @__PURE__ */ requireEndpointSecretRotateIn();
  const endpointStats_1 = /* @__PURE__ */ requireEndpointStats();
  const endpointTransformationIn_1 = /* @__PURE__ */ requireEndpointTransformationIn();
  const endpointTransformationOut_1 = /* @__PURE__ */ requireEndpointTransformationOut();
  const endpointTransformationPatch_1 = /* @__PURE__ */ requireEndpointTransformationPatch();
  const endpointUpdate_1 = /* @__PURE__ */ requireEndpointUpdate();
  const eventExampleIn_1 = /* @__PURE__ */ requireEventExampleIn();
  const listResponseEndpointOut_1 = /* @__PURE__ */ requireListResponseEndpointOut();
  const messageOut_1 = /* @__PURE__ */ requireMessageOut();
  const recoverIn_1 = /* @__PURE__ */ requireRecoverIn();
  const recoverOut_1 = /* @__PURE__ */ requireRecoverOut();
  const replayIn_1 = /* @__PURE__ */ requireReplayIn();
  const replayOut_1 = /* @__PURE__ */ requireReplayOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class Endpoint {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(appId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint");
      request2.setPathParam("app_id", appId);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
      return request2.send(this.requestCtx, listResponseEndpointOut_1.ListResponseEndpointOutSerializer._fromJsonObject);
    }
    create(appId, endpointIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint");
      request2.setPathParam("app_id", appId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(endpointIn_1.EndpointInSerializer._toJsonObject(endpointIn2));
      return request2.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    get(appId, endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    update(appId, endpointId, endpointUpdate2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(endpointUpdate_1.EndpointUpdateSerializer._toJsonObject(endpointUpdate2));
      return request2.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    delete(appId, endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      return request2.sendNoResponseBody(this.requestCtx);
    }
    patch(appId, endpointId, endpointPatch2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(endpointPatch_1.EndpointPatchSerializer._toJsonObject(endpointPatch2));
      return request2.send(this.requestCtx, endpointOut_1.EndpointOutSerializer._fromJsonObject);
    }
    getHeaders(appId, endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, endpointHeadersOut_1.EndpointHeadersOutSerializer._fromJsonObject);
    }
    updateHeaders(appId, endpointId, endpointHeadersIn2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(endpointHeadersIn_1.EndpointHeadersInSerializer._toJsonObject(endpointHeadersIn2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
    headersUpdate(appId, endpointId, endpointHeadersIn2) {
      return this.updateHeaders(appId, endpointId, endpointHeadersIn2);
    }
    patchHeaders(appId, endpointId, endpointHeadersPatchIn2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/headers");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(endpointHeadersPatchIn_1.EndpointHeadersPatchInSerializer._toJsonObject(endpointHeadersPatchIn2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
    headersPatch(appId, endpointId, endpointHeadersPatchIn2) {
      return this.patchHeaders(appId, endpointId, endpointHeadersPatchIn2);
    }
    recover(appId, endpointId, recoverIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/recover");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(recoverIn_1.RecoverInSerializer._toJsonObject(recoverIn2));
      return request2.send(this.requestCtx, recoverOut_1.RecoverOutSerializer._fromJsonObject);
    }
    replayMissing(appId, endpointId, replayIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/replay-missing");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(replayIn_1.ReplayInSerializer._toJsonObject(replayIn2));
      return request2.send(this.requestCtx, replayOut_1.ReplayOutSerializer._fromJsonObject);
    }
    getSecret(appId, endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, endpointSecretOut_1.EndpointSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(appId, endpointId, endpointSecretRotateIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/secret/rotate");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(endpointSecretRotateIn_1.EndpointSecretRotateInSerializer._toJsonObject(endpointSecretRotateIn2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
    sendExample(appId, endpointId, eventExampleIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/send-example");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(eventExampleIn_1.EventExampleInSerializer._toJsonObject(eventExampleIn2));
      return request2.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
    }
    getStats(appId, endpointId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/stats");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setQueryParam("since", options === null || options === void 0 ? void 0 : options.since);
      request2.setQueryParam("until", options === null || options === void 0 ? void 0 : options.until);
      return request2.send(this.requestCtx, endpointStats_1.EndpointStatsSerializer._fromJsonObject);
    }
    transformationGet(appId, endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, endpointTransformationOut_1.EndpointTransformationOutSerializer._fromJsonObject);
    }
    patchTransformation(appId, endpointId, endpointTransformationPatch2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(endpointTransformationPatch_1.EndpointTransformationPatchSerializer._toJsonObject(endpointTransformationPatch2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
    transformationPartialUpdate(appId, endpointId, endpointTransformationIn2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/transformation");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(endpointTransformationIn_1.EndpointTransformationInSerializer._toJsonObject(endpointTransformationIn2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
  }
  endpoint.Endpoint = Endpoint;
  return endpoint;
}
var environment = {};
var environmentIn = {};
var connectorIn = {};
var connectorKind = {};
var hasRequiredConnectorKind;
function requireConnectorKind() {
  if (hasRequiredConnectorKind) return connectorKind;
  hasRequiredConnectorKind = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.ConnectorKindSerializer = exports$1.ConnectorKind = void 0;
    (function(ConnectorKind) {
      ConnectorKind["Custom"] = "Custom";
      ConnectorKind["CloseCrm"] = "CloseCRM";
      ConnectorKind["CustomerIo"] = "CustomerIO";
      ConnectorKind["Discord"] = "Discord";
      ConnectorKind["Hubspot"] = "Hubspot";
      ConnectorKind["Inngest"] = "Inngest";
      ConnectorKind["Loops"] = "Loops";
      ConnectorKind["Resend"] = "Resend";
      ConnectorKind["Salesforce"] = "Salesforce";
      ConnectorKind["Segment"] = "Segment";
      ConnectorKind["Sendgrid"] = "Sendgrid";
      ConnectorKind["Slack"] = "Slack";
      ConnectorKind["Teams"] = "Teams";
      ConnectorKind["TriggerDev"] = "TriggerDev";
      ConnectorKind["Windmill"] = "Windmill";
      ConnectorKind["Zapier"] = "Zapier";
    })(exports$1.ConnectorKind || (exports$1.ConnectorKind = {}));
    exports$1.ConnectorKindSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  })(connectorKind);
  return connectorKind;
}
var hasRequiredConnectorIn;
function requireConnectorIn() {
  if (hasRequiredConnectorIn) return connectorIn;
  hasRequiredConnectorIn = 1;
  Object.defineProperty(connectorIn, "__esModule", { value: true });
  connectorIn.ConnectorInSerializer = void 0;
  const connectorKind_1 = /* @__PURE__ */ requireConnectorKind();
  connectorIn.ConnectorInSerializer = {
    _fromJsonObject(object) {
      return {
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        filterTypes: object["filterTypes"],
        instructions: object["instructions"],
        instructionsLink: object["instructionsLink"],
        kind: object["kind"] ? connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]) : void 0,
        logo: object["logo"],
        name: object["name"],
        transformation: object["transformation"]
      };
    },
    _toJsonObject(self) {
      return {
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        filterTypes: self.filterTypes,
        instructions: self.instructions,
        instructionsLink: self.instructionsLink,
        kind: self.kind ? connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind) : void 0,
        logo: self.logo,
        name: self.name,
        transformation: self.transformation
      };
    }
  };
  return connectorIn;
}
var eventTypeIn = {};
var hasRequiredEventTypeIn;
function requireEventTypeIn() {
  if (hasRequiredEventTypeIn) return eventTypeIn;
  hasRequiredEventTypeIn = 1;
  Object.defineProperty(eventTypeIn, "__esModule", { value: true });
  eventTypeIn.EventTypeInSerializer = void 0;
  eventTypeIn.EventTypeInSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        groupName: object["groupName"],
        name: object["name"],
        schemas: object["schemas"]
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        deprecated: self.deprecated,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        groupName: self.groupName,
        name: self.name,
        schemas: self.schemas
      };
    }
  };
  return eventTypeIn;
}
var hasRequiredEnvironmentIn;
function requireEnvironmentIn() {
  if (hasRequiredEnvironmentIn) return environmentIn;
  hasRequiredEnvironmentIn = 1;
  Object.defineProperty(environmentIn, "__esModule", { value: true });
  environmentIn.EnvironmentInSerializer = void 0;
  const connectorIn_1 = /* @__PURE__ */ requireConnectorIn();
  const eventTypeIn_1 = /* @__PURE__ */ requireEventTypeIn();
  environmentIn.EnvironmentInSerializer = {
    _fromJsonObject(object) {
      var _a, _b;
      return {
        connectors: (_a = object["connectors"]) === null || _a === void 0 ? void 0 : _a.map((item) => connectorIn_1.ConnectorInSerializer._fromJsonObject(item)),
        eventTypes: (_b = object["eventTypes"]) === null || _b === void 0 ? void 0 : _b.map((item) => eventTypeIn_1.EventTypeInSerializer._fromJsonObject(item)),
        settings: object["settings"]
      };
    },
    _toJsonObject(self) {
      var _a, _b;
      return {
        connectors: (_a = self.connectors) === null || _a === void 0 ? void 0 : _a.map((item) => connectorIn_1.ConnectorInSerializer._toJsonObject(item)),
        eventTypes: (_b = self.eventTypes) === null || _b === void 0 ? void 0 : _b.map((item) => eventTypeIn_1.EventTypeInSerializer._toJsonObject(item)),
        settings: self.settings
      };
    }
  };
  return environmentIn;
}
var environmentOut = {};
var connectorOut = {};
var hasRequiredConnectorOut;
function requireConnectorOut() {
  if (hasRequiredConnectorOut) return connectorOut;
  hasRequiredConnectorOut = 1;
  Object.defineProperty(connectorOut, "__esModule", { value: true });
  connectorOut.ConnectorOutSerializer = void 0;
  const connectorKind_1 = /* @__PURE__ */ requireConnectorKind();
  connectorOut.ConnectorOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        filterTypes: object["filterTypes"],
        id: object["id"],
        instructions: object["instructions"],
        instructionsLink: object["instructionsLink"],
        kind: connectorKind_1.ConnectorKindSerializer._fromJsonObject(object["kind"]),
        logo: object["logo"],
        name: object["name"],
        orgId: object["orgId"],
        transformation: object["transformation"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        filterTypes: self.filterTypes,
        id: self.id,
        instructions: self.instructions,
        instructionsLink: self.instructionsLink,
        kind: connectorKind_1.ConnectorKindSerializer._toJsonObject(self.kind),
        logo: self.logo,
        name: self.name,
        orgId: self.orgId,
        transformation: self.transformation,
        updatedAt: self.updatedAt
      };
    }
  };
  return connectorOut;
}
var eventTypeOut = {};
var hasRequiredEventTypeOut;
function requireEventTypeOut() {
  if (hasRequiredEventTypeOut) return eventTypeOut;
  hasRequiredEventTypeOut = 1;
  Object.defineProperty(eventTypeOut, "__esModule", { value: true });
  eventTypeOut.EventTypeOutSerializer = void 0;
  eventTypeOut.EventTypeOutSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        createdAt: new Date(object["createdAt"]),
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        groupName: object["groupName"],
        name: object["name"],
        schemas: object["schemas"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        createdAt: self.createdAt,
        deprecated: self.deprecated,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        groupName: self.groupName,
        name: self.name,
        schemas: self.schemas,
        updatedAt: self.updatedAt
      };
    }
  };
  return eventTypeOut;
}
var hasRequiredEnvironmentOut;
function requireEnvironmentOut() {
  if (hasRequiredEnvironmentOut) return environmentOut;
  hasRequiredEnvironmentOut = 1;
  Object.defineProperty(environmentOut, "__esModule", { value: true });
  environmentOut.EnvironmentOutSerializer = void 0;
  const connectorOut_1 = /* @__PURE__ */ requireConnectorOut();
  const eventTypeOut_1 = /* @__PURE__ */ requireEventTypeOut();
  environmentOut.EnvironmentOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        eventTypes: object["eventTypes"].map((item) => eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
        settings: object["settings"],
        transformationTemplates: object["transformationTemplates"].map((item) => connectorOut_1.ConnectorOutSerializer._fromJsonObject(item)),
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        eventTypes: self.eventTypes.map((item) => eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
        settings: self.settings,
        transformationTemplates: self.transformationTemplates.map((item) => connectorOut_1.ConnectorOutSerializer._toJsonObject(item)),
        version: self.version
      };
    }
  };
  return environmentOut;
}
var hasRequiredEnvironment;
function requireEnvironment() {
  if (hasRequiredEnvironment) return environment;
  hasRequiredEnvironment = 1;
  Object.defineProperty(environment, "__esModule", { value: true });
  environment.Environment = void 0;
  const environmentIn_1 = /* @__PURE__ */ requireEnvironmentIn();
  const environmentOut_1 = /* @__PURE__ */ requireEnvironmentOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class Environment {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    export(options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/export");
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      return request2.send(this.requestCtx, environmentOut_1.EnvironmentOutSerializer._fromJsonObject);
    }
    import(environmentIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/environment/import");
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(environmentIn_1.EnvironmentInSerializer._toJsonObject(environmentIn2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
  }
  environment.Environment = Environment;
  return environment;
}
var eventType = {};
var eventTypeImportOpenApiIn = {};
var hasRequiredEventTypeImportOpenApiIn;
function requireEventTypeImportOpenApiIn() {
  if (hasRequiredEventTypeImportOpenApiIn) return eventTypeImportOpenApiIn;
  hasRequiredEventTypeImportOpenApiIn = 1;
  Object.defineProperty(eventTypeImportOpenApiIn, "__esModule", { value: true });
  eventTypeImportOpenApiIn.EventTypeImportOpenApiInSerializer = void 0;
  eventTypeImportOpenApiIn.EventTypeImportOpenApiInSerializer = {
    _fromJsonObject(object) {
      return {
        dryRun: object["dryRun"],
        replaceAll: object["replaceAll"],
        spec: object["spec"],
        specRaw: object["specRaw"]
      };
    },
    _toJsonObject(self) {
      return {
        dryRun: self.dryRun,
        replaceAll: self.replaceAll,
        spec: self.spec,
        specRaw: self.specRaw
      };
    }
  };
  return eventTypeImportOpenApiIn;
}
var eventTypeImportOpenApiOut = {};
var eventTypeImportOpenApiOutData = {};
var eventTypeFromOpenApi = {};
var hasRequiredEventTypeFromOpenApi;
function requireEventTypeFromOpenApi() {
  if (hasRequiredEventTypeFromOpenApi) return eventTypeFromOpenApi;
  hasRequiredEventTypeFromOpenApi = 1;
  Object.defineProperty(eventTypeFromOpenApi, "__esModule", { value: true });
  eventTypeFromOpenApi.EventTypeFromOpenApiSerializer = void 0;
  eventTypeFromOpenApi.EventTypeFromOpenApiSerializer = {
    _fromJsonObject(object) {
      return {
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        groupName: object["groupName"],
        name: object["name"],
        schemas: object["schemas"]
      };
    },
    _toJsonObject(self) {
      return {
        deprecated: self.deprecated,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        groupName: self.groupName,
        name: self.name,
        schemas: self.schemas
      };
    }
  };
  return eventTypeFromOpenApi;
}
var hasRequiredEventTypeImportOpenApiOutData;
function requireEventTypeImportOpenApiOutData() {
  if (hasRequiredEventTypeImportOpenApiOutData) return eventTypeImportOpenApiOutData;
  hasRequiredEventTypeImportOpenApiOutData = 1;
  Object.defineProperty(eventTypeImportOpenApiOutData, "__esModule", { value: true });
  eventTypeImportOpenApiOutData.EventTypeImportOpenApiOutDataSerializer = void 0;
  const eventTypeFromOpenApi_1 = /* @__PURE__ */ requireEventTypeFromOpenApi();
  eventTypeImportOpenApiOutData.EventTypeImportOpenApiOutDataSerializer = {
    _fromJsonObject(object) {
      var _a;
      return {
        modified: object["modified"],
        toModify: (_a = object["to_modify"]) === null || _a === void 0 ? void 0 : _a.map((item) => eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._fromJsonObject(item))
      };
    },
    _toJsonObject(self) {
      var _a;
      return {
        modified: self.modified,
        to_modify: (_a = self.toModify) === null || _a === void 0 ? void 0 : _a.map((item) => eventTypeFromOpenApi_1.EventTypeFromOpenApiSerializer._toJsonObject(item))
      };
    }
  };
  return eventTypeImportOpenApiOutData;
}
var hasRequiredEventTypeImportOpenApiOut;
function requireEventTypeImportOpenApiOut() {
  if (hasRequiredEventTypeImportOpenApiOut) return eventTypeImportOpenApiOut;
  hasRequiredEventTypeImportOpenApiOut = 1;
  Object.defineProperty(eventTypeImportOpenApiOut, "__esModule", { value: true });
  eventTypeImportOpenApiOut.EventTypeImportOpenApiOutSerializer = void 0;
  const eventTypeImportOpenApiOutData_1 = /* @__PURE__ */ requireEventTypeImportOpenApiOutData();
  eventTypeImportOpenApiOut.EventTypeImportOpenApiOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._fromJsonObject(object["data"])
      };
    },
    _toJsonObject(self) {
      return {
        data: eventTypeImportOpenApiOutData_1.EventTypeImportOpenApiOutDataSerializer._toJsonObject(self.data)
      };
    }
  };
  return eventTypeImportOpenApiOut;
}
var eventTypePatch = {};
var hasRequiredEventTypePatch;
function requireEventTypePatch() {
  if (hasRequiredEventTypePatch) return eventTypePatch;
  hasRequiredEventTypePatch = 1;
  Object.defineProperty(eventTypePatch, "__esModule", { value: true });
  eventTypePatch.EventTypePatchSerializer = void 0;
  eventTypePatch.EventTypePatchSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        groupName: object["groupName"],
        schemas: object["schemas"]
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        deprecated: self.deprecated,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        groupName: self.groupName,
        schemas: self.schemas
      };
    }
  };
  return eventTypePatch;
}
var eventTypeUpdate = {};
var hasRequiredEventTypeUpdate;
function requireEventTypeUpdate() {
  if (hasRequiredEventTypeUpdate) return eventTypeUpdate;
  hasRequiredEventTypeUpdate = 1;
  Object.defineProperty(eventTypeUpdate, "__esModule", { value: true });
  eventTypeUpdate.EventTypeUpdateSerializer = void 0;
  eventTypeUpdate.EventTypeUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        archived: object["archived"],
        deprecated: object["deprecated"],
        description: object["description"],
        featureFlag: object["featureFlag"],
        featureFlags: object["featureFlags"],
        groupName: object["groupName"],
        schemas: object["schemas"]
      };
    },
    _toJsonObject(self) {
      return {
        archived: self.archived,
        deprecated: self.deprecated,
        description: self.description,
        featureFlag: self.featureFlag,
        featureFlags: self.featureFlags,
        groupName: self.groupName,
        schemas: self.schemas
      };
    }
  };
  return eventTypeUpdate;
}
var listResponseEventTypeOut = {};
var hasRequiredListResponseEventTypeOut;
function requireListResponseEventTypeOut() {
  if (hasRequiredListResponseEventTypeOut) return listResponseEventTypeOut;
  hasRequiredListResponseEventTypeOut = 1;
  Object.defineProperty(listResponseEventTypeOut, "__esModule", { value: true });
  listResponseEventTypeOut.ListResponseEventTypeOutSerializer = void 0;
  const eventTypeOut_1 = /* @__PURE__ */ requireEventTypeOut();
  listResponseEventTypeOut.ListResponseEventTypeOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => eventTypeOut_1.EventTypeOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => eventTypeOut_1.EventTypeOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseEventTypeOut;
}
var hasRequiredEventType;
function requireEventType() {
  if (hasRequiredEventType) return eventType;
  hasRequiredEventType = 1;
  Object.defineProperty(eventType, "__esModule", { value: true });
  eventType.EventType = void 0;
  const eventTypeImportOpenApiIn_1 = /* @__PURE__ */ requireEventTypeImportOpenApiIn();
  const eventTypeImportOpenApiOut_1 = /* @__PURE__ */ requireEventTypeImportOpenApiOut();
  const eventTypeIn_1 = /* @__PURE__ */ requireEventTypeIn();
  const eventTypeOut_1 = /* @__PURE__ */ requireEventTypeOut();
  const eventTypePatch_1 = /* @__PURE__ */ requireEventTypePatch();
  const eventTypeUpdate_1 = /* @__PURE__ */ requireEventTypeUpdate();
  const listResponseEventTypeOut_1 = /* @__PURE__ */ requireListResponseEventTypeOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class EventType {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/event-type");
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
      request2.setQueryParam("include_archived", options === null || options === void 0 ? void 0 : options.includeArchived);
      request2.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
      return request2.send(this.requestCtx, listResponseEventTypeOut_1.ListResponseEventTypeOutSerializer._fromJsonObject);
    }
    create(eventTypeIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/event-type");
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(eventTypeIn_1.EventTypeInSerializer._toJsonObject(eventTypeIn2));
      return request2.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
    importOpenapi(eventTypeImportOpenApiIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/event-type/import/openapi");
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(eventTypeImportOpenApiIn_1.EventTypeImportOpenApiInSerializer._toJsonObject(eventTypeImportOpenApiIn2));
      return request2.send(this.requestCtx, eventTypeImportOpenApiOut_1.EventTypeImportOpenApiOutSerializer._fromJsonObject);
    }
    get(eventTypeName) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/event-type/{event_type_name}");
      request2.setPathParam("event_type_name", eventTypeName);
      return request2.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
    update(eventTypeName, eventTypeUpdate2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/event-type/{event_type_name}");
      request2.setPathParam("event_type_name", eventTypeName);
      request2.setBody(eventTypeUpdate_1.EventTypeUpdateSerializer._toJsonObject(eventTypeUpdate2));
      return request2.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
    delete(eventTypeName, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/event-type/{event_type_name}");
      request2.setPathParam("event_type_name", eventTypeName);
      request2.setQueryParam("expunge", options === null || options === void 0 ? void 0 : options.expunge);
      return request2.sendNoResponseBody(this.requestCtx);
    }
    patch(eventTypeName, eventTypePatch2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/api/v1/event-type/{event_type_name}");
      request2.setPathParam("event_type_name", eventTypeName);
      request2.setBody(eventTypePatch_1.EventTypePatchSerializer._toJsonObject(eventTypePatch2));
      return request2.send(this.requestCtx, eventTypeOut_1.EventTypeOutSerializer._fromJsonObject);
    }
  }
  eventType.EventType = EventType;
  return eventType;
}
var health = {};
var hasRequiredHealth;
function requireHealth() {
  if (hasRequiredHealth) return health;
  hasRequiredHealth = 1;
  Object.defineProperty(health, "__esModule", { value: true });
  health.Health = void 0;
  const request_1 = /* @__PURE__ */ requireRequest();
  class Health {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    get() {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/health");
      return request2.sendNoResponseBody(this.requestCtx);
    }
  }
  health.Health = Health;
  return health;
}
var ingest = {};
var ingestSourceConsumerPortalAccessIn = {};
var hasRequiredIngestSourceConsumerPortalAccessIn;
function requireIngestSourceConsumerPortalAccessIn() {
  if (hasRequiredIngestSourceConsumerPortalAccessIn) return ingestSourceConsumerPortalAccessIn;
  hasRequiredIngestSourceConsumerPortalAccessIn = 1;
  Object.defineProperty(ingestSourceConsumerPortalAccessIn, "__esModule", { value: true });
  ingestSourceConsumerPortalAccessIn.IngestSourceConsumerPortalAccessInSerializer = void 0;
  ingestSourceConsumerPortalAccessIn.IngestSourceConsumerPortalAccessInSerializer = {
    _fromJsonObject(object) {
      return {
        expiry: object["expiry"],
        readOnly: object["readOnly"]
      };
    },
    _toJsonObject(self) {
      return {
        expiry: self.expiry,
        readOnly: self.readOnly
      };
    }
  };
  return ingestSourceConsumerPortalAccessIn;
}
var ingestEndpoint = {};
var ingestEndpointHeadersIn = {};
var hasRequiredIngestEndpointHeadersIn;
function requireIngestEndpointHeadersIn() {
  if (hasRequiredIngestEndpointHeadersIn) return ingestEndpointHeadersIn;
  hasRequiredIngestEndpointHeadersIn = 1;
  Object.defineProperty(ingestEndpointHeadersIn, "__esModule", { value: true });
  ingestEndpointHeadersIn.IngestEndpointHeadersInSerializer = void 0;
  ingestEndpointHeadersIn.IngestEndpointHeadersInSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers
      };
    }
  };
  return ingestEndpointHeadersIn;
}
var ingestEndpointHeadersOut = {};
var hasRequiredIngestEndpointHeadersOut;
function requireIngestEndpointHeadersOut() {
  if (hasRequiredIngestEndpointHeadersOut) return ingestEndpointHeadersOut;
  hasRequiredIngestEndpointHeadersOut = 1;
  Object.defineProperty(ingestEndpointHeadersOut, "__esModule", { value: true });
  ingestEndpointHeadersOut.IngestEndpointHeadersOutSerializer = void 0;
  ingestEndpointHeadersOut.IngestEndpointHeadersOutSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"],
        sensitive: object["sensitive"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers,
        sensitive: self.sensitive
      };
    }
  };
  return ingestEndpointHeadersOut;
}
var ingestEndpointIn = {};
var hasRequiredIngestEndpointIn;
function requireIngestEndpointIn() {
  if (hasRequiredIngestEndpointIn) return ingestEndpointIn;
  hasRequiredIngestEndpointIn = 1;
  Object.defineProperty(ingestEndpointIn, "__esModule", { value: true });
  ingestEndpointIn.IngestEndpointInSerializer = void 0;
  ingestEndpointIn.IngestEndpointInSerializer = {
    _fromJsonObject(object) {
      return {
        description: object["description"],
        disabled: object["disabled"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        secret: object["secret"],
        uid: object["uid"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        description: self.description,
        disabled: self.disabled,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        secret: self.secret,
        uid: self.uid,
        url: self.url
      };
    }
  };
  return ingestEndpointIn;
}
var ingestEndpointOut = {};
var hasRequiredIngestEndpointOut;
function requireIngestEndpointOut() {
  if (hasRequiredIngestEndpointOut) return ingestEndpointOut;
  hasRequiredIngestEndpointOut = 1;
  Object.defineProperty(ingestEndpointOut, "__esModule", { value: true });
  ingestEndpointOut.IngestEndpointOutSerializer = void 0;
  ingestEndpointOut.IngestEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        description: object["description"],
        disabled: object["disabled"],
        id: object["id"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"]),
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        description: self.description,
        disabled: self.disabled,
        id: self.id,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        updatedAt: self.updatedAt,
        url: self.url
      };
    }
  };
  return ingestEndpointOut;
}
var ingestEndpointSecretIn = {};
var hasRequiredIngestEndpointSecretIn;
function requireIngestEndpointSecretIn() {
  if (hasRequiredIngestEndpointSecretIn) return ingestEndpointSecretIn;
  hasRequiredIngestEndpointSecretIn = 1;
  Object.defineProperty(ingestEndpointSecretIn, "__esModule", { value: true });
  ingestEndpointSecretIn.IngestEndpointSecretInSerializer = void 0;
  ingestEndpointSecretIn.IngestEndpointSecretInSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
  return ingestEndpointSecretIn;
}
var ingestEndpointSecretOut = {};
var hasRequiredIngestEndpointSecretOut;
function requireIngestEndpointSecretOut() {
  if (hasRequiredIngestEndpointSecretOut) return ingestEndpointSecretOut;
  hasRequiredIngestEndpointSecretOut = 1;
  Object.defineProperty(ingestEndpointSecretOut, "__esModule", { value: true });
  ingestEndpointSecretOut.IngestEndpointSecretOutSerializer = void 0;
  ingestEndpointSecretOut.IngestEndpointSecretOutSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
  return ingestEndpointSecretOut;
}
var ingestEndpointTransformationOut = {};
var hasRequiredIngestEndpointTransformationOut;
function requireIngestEndpointTransformationOut() {
  if (hasRequiredIngestEndpointTransformationOut) return ingestEndpointTransformationOut;
  hasRequiredIngestEndpointTransformationOut = 1;
  Object.defineProperty(ingestEndpointTransformationOut, "__esModule", { value: true });
  ingestEndpointTransformationOut.IngestEndpointTransformationOutSerializer = void 0;
  ingestEndpointTransformationOut.IngestEndpointTransformationOutSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled
      };
    }
  };
  return ingestEndpointTransformationOut;
}
var ingestEndpointTransformationPatch = {};
var hasRequiredIngestEndpointTransformationPatch;
function requireIngestEndpointTransformationPatch() {
  if (hasRequiredIngestEndpointTransformationPatch) return ingestEndpointTransformationPatch;
  hasRequiredIngestEndpointTransformationPatch = 1;
  Object.defineProperty(ingestEndpointTransformationPatch, "__esModule", { value: true });
  ingestEndpointTransformationPatch.IngestEndpointTransformationPatchSerializer = void 0;
  ingestEndpointTransformationPatch.IngestEndpointTransformationPatchSerializer = {
    _fromJsonObject(object) {
      return {
        code: object["code"],
        enabled: object["enabled"]
      };
    },
    _toJsonObject(self) {
      return {
        code: self.code,
        enabled: self.enabled
      };
    }
  };
  return ingestEndpointTransformationPatch;
}
var ingestEndpointUpdate = {};
var hasRequiredIngestEndpointUpdate;
function requireIngestEndpointUpdate() {
  if (hasRequiredIngestEndpointUpdate) return ingestEndpointUpdate;
  hasRequiredIngestEndpointUpdate = 1;
  Object.defineProperty(ingestEndpointUpdate, "__esModule", { value: true });
  ingestEndpointUpdate.IngestEndpointUpdateSerializer = void 0;
  ingestEndpointUpdate.IngestEndpointUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        description: object["description"],
        disabled: object["disabled"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        description: self.description,
        disabled: self.disabled,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        url: self.url
      };
    }
  };
  return ingestEndpointUpdate;
}
var listResponseIngestEndpointOut = {};
var hasRequiredListResponseIngestEndpointOut;
function requireListResponseIngestEndpointOut() {
  if (hasRequiredListResponseIngestEndpointOut) return listResponseIngestEndpointOut;
  hasRequiredListResponseIngestEndpointOut = 1;
  Object.defineProperty(listResponseIngestEndpointOut, "__esModule", { value: true });
  listResponseIngestEndpointOut.ListResponseIngestEndpointOutSerializer = void 0;
  const ingestEndpointOut_1 = /* @__PURE__ */ requireIngestEndpointOut();
  listResponseIngestEndpointOut.ListResponseIngestEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => ingestEndpointOut_1.IngestEndpointOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseIngestEndpointOut;
}
var hasRequiredIngestEndpoint;
function requireIngestEndpoint() {
  if (hasRequiredIngestEndpoint) return ingestEndpoint;
  hasRequiredIngestEndpoint = 1;
  Object.defineProperty(ingestEndpoint, "__esModule", { value: true });
  ingestEndpoint.IngestEndpoint = void 0;
  const ingestEndpointHeadersIn_1 = /* @__PURE__ */ requireIngestEndpointHeadersIn();
  const ingestEndpointHeadersOut_1 = /* @__PURE__ */ requireIngestEndpointHeadersOut();
  const ingestEndpointIn_1 = /* @__PURE__ */ requireIngestEndpointIn();
  const ingestEndpointOut_1 = /* @__PURE__ */ requireIngestEndpointOut();
  const ingestEndpointSecretIn_1 = /* @__PURE__ */ requireIngestEndpointSecretIn();
  const ingestEndpointSecretOut_1 = /* @__PURE__ */ requireIngestEndpointSecretOut();
  const ingestEndpointTransformationOut_1 = /* @__PURE__ */ requireIngestEndpointTransformationOut();
  const ingestEndpointTransformationPatch_1 = /* @__PURE__ */ requireIngestEndpointTransformationPatch();
  const ingestEndpointUpdate_1 = /* @__PURE__ */ requireIngestEndpointUpdate();
  const listResponseIngestEndpointOut_1 = /* @__PURE__ */ requireListResponseIngestEndpointOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class IngestEndpoint {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(sourceId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint");
      request2.setPathParam("source_id", sourceId);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
      return request2.send(this.requestCtx, listResponseIngestEndpointOut_1.ListResponseIngestEndpointOutSerializer._fromJsonObject);
    }
    create(sourceId, ingestEndpointIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/endpoint");
      request2.setPathParam("source_id", sourceId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(ingestEndpointIn_1.IngestEndpointInSerializer._toJsonObject(ingestEndpointIn2));
      return request2.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
    }
    get(sourceId, endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
      request2.setPathParam("source_id", sourceId);
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
    }
    update(sourceId, endpointId, ingestEndpointUpdate2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
      request2.setPathParam("source_id", sourceId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(ingestEndpointUpdate_1.IngestEndpointUpdateSerializer._toJsonObject(ingestEndpointUpdate2));
      return request2.send(this.requestCtx, ingestEndpointOut_1.IngestEndpointOutSerializer._fromJsonObject);
    }
    delete(sourceId, endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}");
      request2.setPathParam("source_id", sourceId);
      request2.setPathParam("endpoint_id", endpointId);
      return request2.sendNoResponseBody(this.requestCtx);
    }
    getHeaders(sourceId, endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/headers");
      request2.setPathParam("source_id", sourceId);
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, ingestEndpointHeadersOut_1.IngestEndpointHeadersOutSerializer._fromJsonObject);
    }
    updateHeaders(sourceId, endpointId, ingestEndpointHeadersIn2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/headers");
      request2.setPathParam("source_id", sourceId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(ingestEndpointHeadersIn_1.IngestEndpointHeadersInSerializer._toJsonObject(ingestEndpointHeadersIn2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
    getSecret(sourceId, endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/secret");
      request2.setPathParam("source_id", sourceId);
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, ingestEndpointSecretOut_1.IngestEndpointSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(sourceId, endpointId, ingestEndpointSecretIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/secret/rotate");
      request2.setPathParam("source_id", sourceId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(ingestEndpointSecretIn_1.IngestEndpointSecretInSerializer._toJsonObject(ingestEndpointSecretIn2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
    getTransformation(sourceId, endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/transformation");
      request2.setPathParam("source_id", sourceId);
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, ingestEndpointTransformationOut_1.IngestEndpointTransformationOutSerializer._fromJsonObject);
    }
    setTransformation(sourceId, endpointId, ingestEndpointTransformationPatch2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PATCH, "/ingest/api/v1/source/{source_id}/endpoint/{endpoint_id}/transformation");
      request2.setPathParam("source_id", sourceId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(ingestEndpointTransformationPatch_1.IngestEndpointTransformationPatchSerializer._toJsonObject(ingestEndpointTransformationPatch2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
  }
  ingestEndpoint.IngestEndpoint = IngestEndpoint;
  return ingestEndpoint;
}
var ingestSource = {};
var ingestSourceIn = {};
var adobeSignConfig = {};
var hasRequiredAdobeSignConfig;
function requireAdobeSignConfig() {
  if (hasRequiredAdobeSignConfig) return adobeSignConfig;
  hasRequiredAdobeSignConfig = 1;
  Object.defineProperty(adobeSignConfig, "__esModule", { value: true });
  adobeSignConfig.AdobeSignConfigSerializer = void 0;
  adobeSignConfig.AdobeSignConfigSerializer = {
    _fromJsonObject(object) {
      return {
        clientId: object["clientId"]
      };
    },
    _toJsonObject(self) {
      return {
        clientId: self.clientId
      };
    }
  };
  return adobeSignConfig;
}
var airwallexConfig = {};
var hasRequiredAirwallexConfig;
function requireAirwallexConfig() {
  if (hasRequiredAirwallexConfig) return airwallexConfig;
  hasRequiredAirwallexConfig = 1;
  Object.defineProperty(airwallexConfig, "__esModule", { value: true });
  airwallexConfig.AirwallexConfigSerializer = void 0;
  airwallexConfig.AirwallexConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return airwallexConfig;
}
var checkbookConfig = {};
var hasRequiredCheckbookConfig;
function requireCheckbookConfig() {
  if (hasRequiredCheckbookConfig) return checkbookConfig;
  hasRequiredCheckbookConfig = 1;
  Object.defineProperty(checkbookConfig, "__esModule", { value: true });
  checkbookConfig.CheckbookConfigSerializer = void 0;
  checkbookConfig.CheckbookConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return checkbookConfig;
}
var cronConfig = {};
var hasRequiredCronConfig;
function requireCronConfig() {
  if (hasRequiredCronConfig) return cronConfig;
  hasRequiredCronConfig = 1;
  Object.defineProperty(cronConfig, "__esModule", { value: true });
  cronConfig.CronConfigSerializer = void 0;
  cronConfig.CronConfigSerializer = {
    _fromJsonObject(object) {
      return {
        contentType: object["contentType"],
        payload: object["payload"],
        schedule: object["schedule"]
      };
    },
    _toJsonObject(self) {
      return {
        contentType: self.contentType,
        payload: self.payload,
        schedule: self.schedule
      };
    }
  };
  return cronConfig;
}
var docusignConfig = {};
var hasRequiredDocusignConfig;
function requireDocusignConfig() {
  if (hasRequiredDocusignConfig) return docusignConfig;
  hasRequiredDocusignConfig = 1;
  Object.defineProperty(docusignConfig, "__esModule", { value: true });
  docusignConfig.DocusignConfigSerializer = void 0;
  docusignConfig.DocusignConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return docusignConfig;
}
var easypostConfig = {};
var hasRequiredEasypostConfig;
function requireEasypostConfig() {
  if (hasRequiredEasypostConfig) return easypostConfig;
  hasRequiredEasypostConfig = 1;
  Object.defineProperty(easypostConfig, "__esModule", { value: true });
  easypostConfig.EasypostConfigSerializer = void 0;
  easypostConfig.EasypostConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return easypostConfig;
}
var githubConfig = {};
var hasRequiredGithubConfig;
function requireGithubConfig() {
  if (hasRequiredGithubConfig) return githubConfig;
  hasRequiredGithubConfig = 1;
  Object.defineProperty(githubConfig, "__esModule", { value: true });
  githubConfig.GithubConfigSerializer = void 0;
  githubConfig.GithubConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return githubConfig;
}
var hubspotConfig = {};
var hasRequiredHubspotConfig;
function requireHubspotConfig() {
  if (hasRequiredHubspotConfig) return hubspotConfig;
  hasRequiredHubspotConfig = 1;
  Object.defineProperty(hubspotConfig, "__esModule", { value: true });
  hubspotConfig.HubspotConfigSerializer = void 0;
  hubspotConfig.HubspotConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return hubspotConfig;
}
var orumIoConfig = {};
var hasRequiredOrumIoConfig;
function requireOrumIoConfig() {
  if (hasRequiredOrumIoConfig) return orumIoConfig;
  hasRequiredOrumIoConfig = 1;
  Object.defineProperty(orumIoConfig, "__esModule", { value: true });
  orumIoConfig.OrumIoConfigSerializer = void 0;
  orumIoConfig.OrumIoConfigSerializer = {
    _fromJsonObject(object) {
      return {
        publicKey: object["publicKey"]
      };
    },
    _toJsonObject(self) {
      return {
        publicKey: self.publicKey
      };
    }
  };
  return orumIoConfig;
}
var pandaDocConfig = {};
var hasRequiredPandaDocConfig;
function requirePandaDocConfig() {
  if (hasRequiredPandaDocConfig) return pandaDocConfig;
  hasRequiredPandaDocConfig = 1;
  Object.defineProperty(pandaDocConfig, "__esModule", { value: true });
  pandaDocConfig.PandaDocConfigSerializer = void 0;
  pandaDocConfig.PandaDocConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return pandaDocConfig;
}
var portIoConfig = {};
var hasRequiredPortIoConfig;
function requirePortIoConfig() {
  if (hasRequiredPortIoConfig) return portIoConfig;
  hasRequiredPortIoConfig = 1;
  Object.defineProperty(portIoConfig, "__esModule", { value: true });
  portIoConfig.PortIoConfigSerializer = void 0;
  portIoConfig.PortIoConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return portIoConfig;
}
var rutterConfig = {};
var hasRequiredRutterConfig;
function requireRutterConfig() {
  if (hasRequiredRutterConfig) return rutterConfig;
  hasRequiredRutterConfig = 1;
  Object.defineProperty(rutterConfig, "__esModule", { value: true });
  rutterConfig.RutterConfigSerializer = void 0;
  rutterConfig.RutterConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return rutterConfig;
}
var segmentConfig = {};
var hasRequiredSegmentConfig;
function requireSegmentConfig() {
  if (hasRequiredSegmentConfig) return segmentConfig;
  hasRequiredSegmentConfig = 1;
  Object.defineProperty(segmentConfig, "__esModule", { value: true });
  segmentConfig.SegmentConfigSerializer = void 0;
  segmentConfig.SegmentConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return segmentConfig;
}
var shopifyConfig = {};
var hasRequiredShopifyConfig;
function requireShopifyConfig() {
  if (hasRequiredShopifyConfig) return shopifyConfig;
  hasRequiredShopifyConfig = 1;
  Object.defineProperty(shopifyConfig, "__esModule", { value: true });
  shopifyConfig.ShopifyConfigSerializer = void 0;
  shopifyConfig.ShopifyConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return shopifyConfig;
}
var slackConfig = {};
var hasRequiredSlackConfig;
function requireSlackConfig() {
  if (hasRequiredSlackConfig) return slackConfig;
  hasRequiredSlackConfig = 1;
  Object.defineProperty(slackConfig, "__esModule", { value: true });
  slackConfig.SlackConfigSerializer = void 0;
  slackConfig.SlackConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return slackConfig;
}
var stripeConfig = {};
var hasRequiredStripeConfig;
function requireStripeConfig() {
  if (hasRequiredStripeConfig) return stripeConfig;
  hasRequiredStripeConfig = 1;
  Object.defineProperty(stripeConfig, "__esModule", { value: true });
  stripeConfig.StripeConfigSerializer = void 0;
  stripeConfig.StripeConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return stripeConfig;
}
var svixConfig = {};
var hasRequiredSvixConfig;
function requireSvixConfig() {
  if (hasRequiredSvixConfig) return svixConfig;
  hasRequiredSvixConfig = 1;
  Object.defineProperty(svixConfig, "__esModule", { value: true });
  svixConfig.SvixConfigSerializer = void 0;
  svixConfig.SvixConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return svixConfig;
}
var telnyxConfig = {};
var hasRequiredTelnyxConfig;
function requireTelnyxConfig() {
  if (hasRequiredTelnyxConfig) return telnyxConfig;
  hasRequiredTelnyxConfig = 1;
  Object.defineProperty(telnyxConfig, "__esModule", { value: true });
  telnyxConfig.TelnyxConfigSerializer = void 0;
  telnyxConfig.TelnyxConfigSerializer = {
    _fromJsonObject(object) {
      return {
        publicKey: object["publicKey"]
      };
    },
    _toJsonObject(self) {
      return {
        publicKey: self.publicKey
      };
    }
  };
  return telnyxConfig;
}
var vapiConfig = {};
var hasRequiredVapiConfig;
function requireVapiConfig() {
  if (hasRequiredVapiConfig) return vapiConfig;
  hasRequiredVapiConfig = 1;
  Object.defineProperty(vapiConfig, "__esModule", { value: true });
  vapiConfig.VapiConfigSerializer = void 0;
  vapiConfig.VapiConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return vapiConfig;
}
var veriffConfig = {};
var hasRequiredVeriffConfig;
function requireVeriffConfig() {
  if (hasRequiredVeriffConfig) return veriffConfig;
  hasRequiredVeriffConfig = 1;
  Object.defineProperty(veriffConfig, "__esModule", { value: true });
  veriffConfig.VeriffConfigSerializer = void 0;
  veriffConfig.VeriffConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return veriffConfig;
}
var zoomConfig = {};
var hasRequiredZoomConfig;
function requireZoomConfig() {
  if (hasRequiredZoomConfig) return zoomConfig;
  hasRequiredZoomConfig = 1;
  Object.defineProperty(zoomConfig, "__esModule", { value: true });
  zoomConfig.ZoomConfigSerializer = void 0;
  zoomConfig.ZoomConfigSerializer = {
    _fromJsonObject(object) {
      return {
        secret: object["secret"]
      };
    },
    _toJsonObject(self) {
      return {
        secret: self.secret
      };
    }
  };
  return zoomConfig;
}
var hasRequiredIngestSourceIn;
function requireIngestSourceIn() {
  if (hasRequiredIngestSourceIn) return ingestSourceIn;
  hasRequiredIngestSourceIn = 1;
  Object.defineProperty(ingestSourceIn, "__esModule", { value: true });
  ingestSourceIn.IngestSourceInSerializer = void 0;
  const adobeSignConfig_1 = /* @__PURE__ */ requireAdobeSignConfig();
  const airwallexConfig_1 = /* @__PURE__ */ requireAirwallexConfig();
  const checkbookConfig_1 = /* @__PURE__ */ requireCheckbookConfig();
  const cronConfig_1 = /* @__PURE__ */ requireCronConfig();
  const docusignConfig_1 = /* @__PURE__ */ requireDocusignConfig();
  const easypostConfig_1 = /* @__PURE__ */ requireEasypostConfig();
  const githubConfig_1 = /* @__PURE__ */ requireGithubConfig();
  const hubspotConfig_1 = /* @__PURE__ */ requireHubspotConfig();
  const orumIoConfig_1 = /* @__PURE__ */ requireOrumIoConfig();
  const pandaDocConfig_1 = /* @__PURE__ */ requirePandaDocConfig();
  const portIoConfig_1 = /* @__PURE__ */ requirePortIoConfig();
  const rutterConfig_1 = /* @__PURE__ */ requireRutterConfig();
  const segmentConfig_1 = /* @__PURE__ */ requireSegmentConfig();
  const shopifyConfig_1 = /* @__PURE__ */ requireShopifyConfig();
  const slackConfig_1 = /* @__PURE__ */ requireSlackConfig();
  const stripeConfig_1 = /* @__PURE__ */ requireStripeConfig();
  const svixConfig_1 = /* @__PURE__ */ requireSvixConfig();
  const telnyxConfig_1 = /* @__PURE__ */ requireTelnyxConfig();
  const vapiConfig_1 = /* @__PURE__ */ requireVapiConfig();
  const veriffConfig_1 = /* @__PURE__ */ requireVeriffConfig();
  const zoomConfig_1 = /* @__PURE__ */ requireZoomConfig();
  ingestSourceIn.IngestSourceInSerializer = {
    _fromJsonObject(object) {
      const type = object["type"];
      function getConfig(type2) {
        switch (type2) {
          case "generic-webhook":
            return {};
          case "cron":
            return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
          case "adobe-sign":
            return adobeSignConfig_1.AdobeSignConfigSerializer._fromJsonObject(object["config"]);
          case "beehiiv":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "brex":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "checkbook":
            return checkbookConfig_1.CheckbookConfigSerializer._fromJsonObject(object["config"]);
          case "clerk":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "docusign":
            return docusignConfig_1.DocusignConfigSerializer._fromJsonObject(object["config"]);
          case "easypost":
            return easypostConfig_1.EasypostConfigSerializer._fromJsonObject(object["config"]);
          case "github":
            return githubConfig_1.GithubConfigSerializer._fromJsonObject(object["config"]);
          case "guesty":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "hubspot":
            return hubspotConfig_1.HubspotConfigSerializer._fromJsonObject(object["config"]);
          case "incident-io":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "lithic":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "nash":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "orum-io":
            return orumIoConfig_1.OrumIoConfigSerializer._fromJsonObject(object["config"]);
          case "panda-doc":
            return pandaDocConfig_1.PandaDocConfigSerializer._fromJsonObject(object["config"]);
          case "port-io":
            return portIoConfig_1.PortIoConfigSerializer._fromJsonObject(object["config"]);
          case "pleo":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "replicate":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "resend":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "rutter":
            return rutterConfig_1.RutterConfigSerializer._fromJsonObject(object["config"]);
          case "safebase":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "sardine":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "segment":
            return segmentConfig_1.SegmentConfigSerializer._fromJsonObject(object["config"]);
          case "shopify":
            return shopifyConfig_1.ShopifyConfigSerializer._fromJsonObject(object["config"]);
          case "slack":
            return slackConfig_1.SlackConfigSerializer._fromJsonObject(object["config"]);
          case "stripe":
            return stripeConfig_1.StripeConfigSerializer._fromJsonObject(object["config"]);
          case "stych":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "svix":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "zoom":
            return zoomConfig_1.ZoomConfigSerializer._fromJsonObject(object["config"]);
          case "telnyx":
            return telnyxConfig_1.TelnyxConfigSerializer._fromJsonObject(object["config"]);
          case "vapi":
            return vapiConfig_1.VapiConfigSerializer._fromJsonObject(object["config"]);
          case "open-ai":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "render":
            return svixConfig_1.SvixConfigSerializer._fromJsonObject(object["config"]);
          case "veriff":
            return veriffConfig_1.VeriffConfigSerializer._fromJsonObject(object["config"]);
          case "airwallex":
            return airwallexConfig_1.AirwallexConfigSerializer._fromJsonObject(object["config"]);
          default:
            throw new Error(`Unexpected type: ${type2}`);
        }
      }
      return {
        type,
        config: getConfig(type),
        metadata: object["metadata"],
        name: object["name"],
        uid: object["uid"]
      };
    },
    _toJsonObject(self) {
      let config;
      switch (self.type) {
        case "generic-webhook":
          config = {};
          break;
        case "cron":
          config = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
          break;
        case "adobe-sign":
          config = adobeSignConfig_1.AdobeSignConfigSerializer._toJsonObject(self.config);
          break;
        case "beehiiv":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "brex":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "checkbook":
          config = checkbookConfig_1.CheckbookConfigSerializer._toJsonObject(self.config);
          break;
        case "clerk":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "docusign":
          config = docusignConfig_1.DocusignConfigSerializer._toJsonObject(self.config);
          break;
        case "easypost":
          config = easypostConfig_1.EasypostConfigSerializer._toJsonObject(self.config);
          break;
        case "github":
          config = githubConfig_1.GithubConfigSerializer._toJsonObject(self.config);
          break;
        case "guesty":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "hubspot":
          config = hubspotConfig_1.HubspotConfigSerializer._toJsonObject(self.config);
          break;
        case "incident-io":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "lithic":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "nash":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "orum-io":
          config = orumIoConfig_1.OrumIoConfigSerializer._toJsonObject(self.config);
          break;
        case "panda-doc":
          config = pandaDocConfig_1.PandaDocConfigSerializer._toJsonObject(self.config);
          break;
        case "port-io":
          config = portIoConfig_1.PortIoConfigSerializer._toJsonObject(self.config);
          break;
        case "pleo":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "replicate":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "resend":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "rutter":
          config = rutterConfig_1.RutterConfigSerializer._toJsonObject(self.config);
          break;
        case "safebase":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "sardine":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "segment":
          config = segmentConfig_1.SegmentConfigSerializer._toJsonObject(self.config);
          break;
        case "shopify":
          config = shopifyConfig_1.ShopifyConfigSerializer._toJsonObject(self.config);
          break;
        case "slack":
          config = slackConfig_1.SlackConfigSerializer._toJsonObject(self.config);
          break;
        case "stripe":
          config = stripeConfig_1.StripeConfigSerializer._toJsonObject(self.config);
          break;
        case "stych":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "svix":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "zoom":
          config = zoomConfig_1.ZoomConfigSerializer._toJsonObject(self.config);
          break;
        case "telnyx":
          config = telnyxConfig_1.TelnyxConfigSerializer._toJsonObject(self.config);
          break;
        case "vapi":
          config = vapiConfig_1.VapiConfigSerializer._toJsonObject(self.config);
          break;
        case "open-ai":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "render":
          config = svixConfig_1.SvixConfigSerializer._toJsonObject(self.config);
          break;
        case "veriff":
          config = veriffConfig_1.VeriffConfigSerializer._toJsonObject(self.config);
          break;
        case "airwallex":
          config = airwallexConfig_1.AirwallexConfigSerializer._toJsonObject(self.config);
          break;
      }
      return {
        type: self.type,
        config,
        metadata: self.metadata,
        name: self.name,
        uid: self.uid
      };
    }
  };
  return ingestSourceIn;
}
var ingestSourceOut = {};
var adobeSignConfigOut = {};
var hasRequiredAdobeSignConfigOut;
function requireAdobeSignConfigOut() {
  if (hasRequiredAdobeSignConfigOut) return adobeSignConfigOut;
  hasRequiredAdobeSignConfigOut = 1;
  Object.defineProperty(adobeSignConfigOut, "__esModule", { value: true });
  adobeSignConfigOut.AdobeSignConfigOutSerializer = void 0;
  adobeSignConfigOut.AdobeSignConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return adobeSignConfigOut;
}
var airwallexConfigOut = {};
var hasRequiredAirwallexConfigOut;
function requireAirwallexConfigOut() {
  if (hasRequiredAirwallexConfigOut) return airwallexConfigOut;
  hasRequiredAirwallexConfigOut = 1;
  Object.defineProperty(airwallexConfigOut, "__esModule", { value: true });
  airwallexConfigOut.AirwallexConfigOutSerializer = void 0;
  airwallexConfigOut.AirwallexConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return airwallexConfigOut;
}
var checkbookConfigOut = {};
var hasRequiredCheckbookConfigOut;
function requireCheckbookConfigOut() {
  if (hasRequiredCheckbookConfigOut) return checkbookConfigOut;
  hasRequiredCheckbookConfigOut = 1;
  Object.defineProperty(checkbookConfigOut, "__esModule", { value: true });
  checkbookConfigOut.CheckbookConfigOutSerializer = void 0;
  checkbookConfigOut.CheckbookConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return checkbookConfigOut;
}
var docusignConfigOut = {};
var hasRequiredDocusignConfigOut;
function requireDocusignConfigOut() {
  if (hasRequiredDocusignConfigOut) return docusignConfigOut;
  hasRequiredDocusignConfigOut = 1;
  Object.defineProperty(docusignConfigOut, "__esModule", { value: true });
  docusignConfigOut.DocusignConfigOutSerializer = void 0;
  docusignConfigOut.DocusignConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return docusignConfigOut;
}
var easypostConfigOut = {};
var hasRequiredEasypostConfigOut;
function requireEasypostConfigOut() {
  if (hasRequiredEasypostConfigOut) return easypostConfigOut;
  hasRequiredEasypostConfigOut = 1;
  Object.defineProperty(easypostConfigOut, "__esModule", { value: true });
  easypostConfigOut.EasypostConfigOutSerializer = void 0;
  easypostConfigOut.EasypostConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return easypostConfigOut;
}
var githubConfigOut = {};
var hasRequiredGithubConfigOut;
function requireGithubConfigOut() {
  if (hasRequiredGithubConfigOut) return githubConfigOut;
  hasRequiredGithubConfigOut = 1;
  Object.defineProperty(githubConfigOut, "__esModule", { value: true });
  githubConfigOut.GithubConfigOutSerializer = void 0;
  githubConfigOut.GithubConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return githubConfigOut;
}
var hubspotConfigOut = {};
var hasRequiredHubspotConfigOut;
function requireHubspotConfigOut() {
  if (hasRequiredHubspotConfigOut) return hubspotConfigOut;
  hasRequiredHubspotConfigOut = 1;
  Object.defineProperty(hubspotConfigOut, "__esModule", { value: true });
  hubspotConfigOut.HubspotConfigOutSerializer = void 0;
  hubspotConfigOut.HubspotConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return hubspotConfigOut;
}
var orumIoConfigOut = {};
var hasRequiredOrumIoConfigOut;
function requireOrumIoConfigOut() {
  if (hasRequiredOrumIoConfigOut) return orumIoConfigOut;
  hasRequiredOrumIoConfigOut = 1;
  Object.defineProperty(orumIoConfigOut, "__esModule", { value: true });
  orumIoConfigOut.OrumIoConfigOutSerializer = void 0;
  orumIoConfigOut.OrumIoConfigOutSerializer = {
    _fromJsonObject(object) {
      return {
        publicKey: object["publicKey"]
      };
    },
    _toJsonObject(self) {
      return {
        publicKey: self.publicKey
      };
    }
  };
  return orumIoConfigOut;
}
var pandaDocConfigOut = {};
var hasRequiredPandaDocConfigOut;
function requirePandaDocConfigOut() {
  if (hasRequiredPandaDocConfigOut) return pandaDocConfigOut;
  hasRequiredPandaDocConfigOut = 1;
  Object.defineProperty(pandaDocConfigOut, "__esModule", { value: true });
  pandaDocConfigOut.PandaDocConfigOutSerializer = void 0;
  pandaDocConfigOut.PandaDocConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return pandaDocConfigOut;
}
var portIoConfigOut = {};
var hasRequiredPortIoConfigOut;
function requirePortIoConfigOut() {
  if (hasRequiredPortIoConfigOut) return portIoConfigOut;
  hasRequiredPortIoConfigOut = 1;
  Object.defineProperty(portIoConfigOut, "__esModule", { value: true });
  portIoConfigOut.PortIoConfigOutSerializer = void 0;
  portIoConfigOut.PortIoConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return portIoConfigOut;
}
var rutterConfigOut = {};
var hasRequiredRutterConfigOut;
function requireRutterConfigOut() {
  if (hasRequiredRutterConfigOut) return rutterConfigOut;
  hasRequiredRutterConfigOut = 1;
  Object.defineProperty(rutterConfigOut, "__esModule", { value: true });
  rutterConfigOut.RutterConfigOutSerializer = void 0;
  rutterConfigOut.RutterConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return rutterConfigOut;
}
var segmentConfigOut = {};
var hasRequiredSegmentConfigOut;
function requireSegmentConfigOut() {
  if (hasRequiredSegmentConfigOut) return segmentConfigOut;
  hasRequiredSegmentConfigOut = 1;
  Object.defineProperty(segmentConfigOut, "__esModule", { value: true });
  segmentConfigOut.SegmentConfigOutSerializer = void 0;
  segmentConfigOut.SegmentConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return segmentConfigOut;
}
var shopifyConfigOut = {};
var hasRequiredShopifyConfigOut;
function requireShopifyConfigOut() {
  if (hasRequiredShopifyConfigOut) return shopifyConfigOut;
  hasRequiredShopifyConfigOut = 1;
  Object.defineProperty(shopifyConfigOut, "__esModule", { value: true });
  shopifyConfigOut.ShopifyConfigOutSerializer = void 0;
  shopifyConfigOut.ShopifyConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return shopifyConfigOut;
}
var slackConfigOut = {};
var hasRequiredSlackConfigOut;
function requireSlackConfigOut() {
  if (hasRequiredSlackConfigOut) return slackConfigOut;
  hasRequiredSlackConfigOut = 1;
  Object.defineProperty(slackConfigOut, "__esModule", { value: true });
  slackConfigOut.SlackConfigOutSerializer = void 0;
  slackConfigOut.SlackConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return slackConfigOut;
}
var stripeConfigOut = {};
var hasRequiredStripeConfigOut;
function requireStripeConfigOut() {
  if (hasRequiredStripeConfigOut) return stripeConfigOut;
  hasRequiredStripeConfigOut = 1;
  Object.defineProperty(stripeConfigOut, "__esModule", { value: true });
  stripeConfigOut.StripeConfigOutSerializer = void 0;
  stripeConfigOut.StripeConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return stripeConfigOut;
}
var svixConfigOut = {};
var hasRequiredSvixConfigOut;
function requireSvixConfigOut() {
  if (hasRequiredSvixConfigOut) return svixConfigOut;
  hasRequiredSvixConfigOut = 1;
  Object.defineProperty(svixConfigOut, "__esModule", { value: true });
  svixConfigOut.SvixConfigOutSerializer = void 0;
  svixConfigOut.SvixConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return svixConfigOut;
}
var telnyxConfigOut = {};
var hasRequiredTelnyxConfigOut;
function requireTelnyxConfigOut() {
  if (hasRequiredTelnyxConfigOut) return telnyxConfigOut;
  hasRequiredTelnyxConfigOut = 1;
  Object.defineProperty(telnyxConfigOut, "__esModule", { value: true });
  telnyxConfigOut.TelnyxConfigOutSerializer = void 0;
  telnyxConfigOut.TelnyxConfigOutSerializer = {
    _fromJsonObject(object) {
      return {
        publicKey: object["publicKey"]
      };
    },
    _toJsonObject(self) {
      return {
        publicKey: self.publicKey
      };
    }
  };
  return telnyxConfigOut;
}
var vapiConfigOut = {};
var hasRequiredVapiConfigOut;
function requireVapiConfigOut() {
  if (hasRequiredVapiConfigOut) return vapiConfigOut;
  hasRequiredVapiConfigOut = 1;
  Object.defineProperty(vapiConfigOut, "__esModule", { value: true });
  vapiConfigOut.VapiConfigOutSerializer = void 0;
  vapiConfigOut.VapiConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return vapiConfigOut;
}
var veriffConfigOut = {};
var hasRequiredVeriffConfigOut;
function requireVeriffConfigOut() {
  if (hasRequiredVeriffConfigOut) return veriffConfigOut;
  hasRequiredVeriffConfigOut = 1;
  Object.defineProperty(veriffConfigOut, "__esModule", { value: true });
  veriffConfigOut.VeriffConfigOutSerializer = void 0;
  veriffConfigOut.VeriffConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return veriffConfigOut;
}
var zoomConfigOut = {};
var hasRequiredZoomConfigOut;
function requireZoomConfigOut() {
  if (hasRequiredZoomConfigOut) return zoomConfigOut;
  hasRequiredZoomConfigOut = 1;
  Object.defineProperty(zoomConfigOut, "__esModule", { value: true });
  zoomConfigOut.ZoomConfigOutSerializer = void 0;
  zoomConfigOut.ZoomConfigOutSerializer = {
    _fromJsonObject(object) {
      return {};
    },
    _toJsonObject(self) {
      return {};
    }
  };
  return zoomConfigOut;
}
var hasRequiredIngestSourceOut;
function requireIngestSourceOut() {
  if (hasRequiredIngestSourceOut) return ingestSourceOut;
  hasRequiredIngestSourceOut = 1;
  Object.defineProperty(ingestSourceOut, "__esModule", { value: true });
  ingestSourceOut.IngestSourceOutSerializer = void 0;
  const adobeSignConfigOut_1 = /* @__PURE__ */ requireAdobeSignConfigOut();
  const airwallexConfigOut_1 = /* @__PURE__ */ requireAirwallexConfigOut();
  const checkbookConfigOut_1 = /* @__PURE__ */ requireCheckbookConfigOut();
  const cronConfig_1 = /* @__PURE__ */ requireCronConfig();
  const docusignConfigOut_1 = /* @__PURE__ */ requireDocusignConfigOut();
  const easypostConfigOut_1 = /* @__PURE__ */ requireEasypostConfigOut();
  const githubConfigOut_1 = /* @__PURE__ */ requireGithubConfigOut();
  const hubspotConfigOut_1 = /* @__PURE__ */ requireHubspotConfigOut();
  const orumIoConfigOut_1 = /* @__PURE__ */ requireOrumIoConfigOut();
  const pandaDocConfigOut_1 = /* @__PURE__ */ requirePandaDocConfigOut();
  const portIoConfigOut_1 = /* @__PURE__ */ requirePortIoConfigOut();
  const rutterConfigOut_1 = /* @__PURE__ */ requireRutterConfigOut();
  const segmentConfigOut_1 = /* @__PURE__ */ requireSegmentConfigOut();
  const shopifyConfigOut_1 = /* @__PURE__ */ requireShopifyConfigOut();
  const slackConfigOut_1 = /* @__PURE__ */ requireSlackConfigOut();
  const stripeConfigOut_1 = /* @__PURE__ */ requireStripeConfigOut();
  const svixConfigOut_1 = /* @__PURE__ */ requireSvixConfigOut();
  const telnyxConfigOut_1 = /* @__PURE__ */ requireTelnyxConfigOut();
  const vapiConfigOut_1 = /* @__PURE__ */ requireVapiConfigOut();
  const veriffConfigOut_1 = /* @__PURE__ */ requireVeriffConfigOut();
  const zoomConfigOut_1 = /* @__PURE__ */ requireZoomConfigOut();
  ingestSourceOut.IngestSourceOutSerializer = {
    _fromJsonObject(object) {
      const type = object["type"];
      function getConfig(type2) {
        switch (type2) {
          case "generic-webhook":
            return {};
          case "cron":
            return cronConfig_1.CronConfigSerializer._fromJsonObject(object["config"]);
          case "adobe-sign":
            return adobeSignConfigOut_1.AdobeSignConfigOutSerializer._fromJsonObject(object["config"]);
          case "beehiiv":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "brex":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "checkbook":
            return checkbookConfigOut_1.CheckbookConfigOutSerializer._fromJsonObject(object["config"]);
          case "clerk":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "docusign":
            return docusignConfigOut_1.DocusignConfigOutSerializer._fromJsonObject(object["config"]);
          case "easypost":
            return easypostConfigOut_1.EasypostConfigOutSerializer._fromJsonObject(object["config"]);
          case "github":
            return githubConfigOut_1.GithubConfigOutSerializer._fromJsonObject(object["config"]);
          case "guesty":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "hubspot":
            return hubspotConfigOut_1.HubspotConfigOutSerializer._fromJsonObject(object["config"]);
          case "incident-io":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "lithic":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "nash":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "orum-io":
            return orumIoConfigOut_1.OrumIoConfigOutSerializer._fromJsonObject(object["config"]);
          case "panda-doc":
            return pandaDocConfigOut_1.PandaDocConfigOutSerializer._fromJsonObject(object["config"]);
          case "port-io":
            return portIoConfigOut_1.PortIoConfigOutSerializer._fromJsonObject(object["config"]);
          case "pleo":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "replicate":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "resend":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "rutter":
            return rutterConfigOut_1.RutterConfigOutSerializer._fromJsonObject(object["config"]);
          case "safebase":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "sardine":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "segment":
            return segmentConfigOut_1.SegmentConfigOutSerializer._fromJsonObject(object["config"]);
          case "shopify":
            return shopifyConfigOut_1.ShopifyConfigOutSerializer._fromJsonObject(object["config"]);
          case "slack":
            return slackConfigOut_1.SlackConfigOutSerializer._fromJsonObject(object["config"]);
          case "stripe":
            return stripeConfigOut_1.StripeConfigOutSerializer._fromJsonObject(object["config"]);
          case "stych":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "svix":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "zoom":
            return zoomConfigOut_1.ZoomConfigOutSerializer._fromJsonObject(object["config"]);
          case "telnyx":
            return telnyxConfigOut_1.TelnyxConfigOutSerializer._fromJsonObject(object["config"]);
          case "vapi":
            return vapiConfigOut_1.VapiConfigOutSerializer._fromJsonObject(object["config"]);
          case "open-ai":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "render":
            return svixConfigOut_1.SvixConfigOutSerializer._fromJsonObject(object["config"]);
          case "veriff":
            return veriffConfigOut_1.VeriffConfigOutSerializer._fromJsonObject(object["config"]);
          case "airwallex":
            return airwallexConfigOut_1.AirwallexConfigOutSerializer._fromJsonObject(object["config"]);
          default:
            throw new Error(`Unexpected type: ${type2}`);
        }
      }
      return {
        type,
        config: getConfig(type),
        createdAt: new Date(object["createdAt"]),
        id: object["id"],
        ingestUrl: object["ingestUrl"],
        metadata: object["metadata"],
        name: object["name"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      let config;
      switch (self.type) {
        case "generic-webhook":
          config = {};
          break;
        case "cron":
          config = cronConfig_1.CronConfigSerializer._toJsonObject(self.config);
          break;
        case "adobe-sign":
          config = adobeSignConfigOut_1.AdobeSignConfigOutSerializer._toJsonObject(self.config);
          break;
        case "beehiiv":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "brex":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "checkbook":
          config = checkbookConfigOut_1.CheckbookConfigOutSerializer._toJsonObject(self.config);
          break;
        case "clerk":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "docusign":
          config = docusignConfigOut_1.DocusignConfigOutSerializer._toJsonObject(self.config);
          break;
        case "easypost":
          config = easypostConfigOut_1.EasypostConfigOutSerializer._toJsonObject(self.config);
          break;
        case "github":
          config = githubConfigOut_1.GithubConfigOutSerializer._toJsonObject(self.config);
          break;
        case "guesty":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "hubspot":
          config = hubspotConfigOut_1.HubspotConfigOutSerializer._toJsonObject(self.config);
          break;
        case "incident-io":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "lithic":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "nash":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "orum-io":
          config = orumIoConfigOut_1.OrumIoConfigOutSerializer._toJsonObject(self.config);
          break;
        case "panda-doc":
          config = pandaDocConfigOut_1.PandaDocConfigOutSerializer._toJsonObject(self.config);
          break;
        case "port-io":
          config = portIoConfigOut_1.PortIoConfigOutSerializer._toJsonObject(self.config);
          break;
        case "pleo":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "replicate":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "resend":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "rutter":
          config = rutterConfigOut_1.RutterConfigOutSerializer._toJsonObject(self.config);
          break;
        case "safebase":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "sardine":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "segment":
          config = segmentConfigOut_1.SegmentConfigOutSerializer._toJsonObject(self.config);
          break;
        case "shopify":
          config = shopifyConfigOut_1.ShopifyConfigOutSerializer._toJsonObject(self.config);
          break;
        case "slack":
          config = slackConfigOut_1.SlackConfigOutSerializer._toJsonObject(self.config);
          break;
        case "stripe":
          config = stripeConfigOut_1.StripeConfigOutSerializer._toJsonObject(self.config);
          break;
        case "stych":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "svix":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "zoom":
          config = zoomConfigOut_1.ZoomConfigOutSerializer._toJsonObject(self.config);
          break;
        case "telnyx":
          config = telnyxConfigOut_1.TelnyxConfigOutSerializer._toJsonObject(self.config);
          break;
        case "vapi":
          config = vapiConfigOut_1.VapiConfigOutSerializer._toJsonObject(self.config);
          break;
        case "open-ai":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "render":
          config = svixConfigOut_1.SvixConfigOutSerializer._toJsonObject(self.config);
          break;
        case "veriff":
          config = veriffConfigOut_1.VeriffConfigOutSerializer._toJsonObject(self.config);
          break;
        case "airwallex":
          config = airwallexConfigOut_1.AirwallexConfigOutSerializer._toJsonObject(self.config);
          break;
      }
      return {
        type: self.type,
        config,
        createdAt: self.createdAt,
        id: self.id,
        ingestUrl: self.ingestUrl,
        metadata: self.metadata,
        name: self.name,
        uid: self.uid,
        updatedAt: self.updatedAt
      };
    }
  };
  return ingestSourceOut;
}
var listResponseIngestSourceOut = {};
var hasRequiredListResponseIngestSourceOut;
function requireListResponseIngestSourceOut() {
  if (hasRequiredListResponseIngestSourceOut) return listResponseIngestSourceOut;
  hasRequiredListResponseIngestSourceOut = 1;
  Object.defineProperty(listResponseIngestSourceOut, "__esModule", { value: true });
  listResponseIngestSourceOut.ListResponseIngestSourceOutSerializer = void 0;
  const ingestSourceOut_1 = /* @__PURE__ */ requireIngestSourceOut();
  listResponseIngestSourceOut.ListResponseIngestSourceOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => ingestSourceOut_1.IngestSourceOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseIngestSourceOut;
}
var rotateTokenOut = {};
var hasRequiredRotateTokenOut;
function requireRotateTokenOut() {
  if (hasRequiredRotateTokenOut) return rotateTokenOut;
  hasRequiredRotateTokenOut = 1;
  Object.defineProperty(rotateTokenOut, "__esModule", { value: true });
  rotateTokenOut.RotateTokenOutSerializer = void 0;
  rotateTokenOut.RotateTokenOutSerializer = {
    _fromJsonObject(object) {
      return {
        ingestUrl: object["ingestUrl"]
      };
    },
    _toJsonObject(self) {
      return {
        ingestUrl: self.ingestUrl
      };
    }
  };
  return rotateTokenOut;
}
var hasRequiredIngestSource;
function requireIngestSource() {
  if (hasRequiredIngestSource) return ingestSource;
  hasRequiredIngestSource = 1;
  Object.defineProperty(ingestSource, "__esModule", { value: true });
  ingestSource.IngestSource = void 0;
  const ingestSourceIn_1 = /* @__PURE__ */ requireIngestSourceIn();
  const ingestSourceOut_1 = /* @__PURE__ */ requireIngestSourceOut();
  const listResponseIngestSourceOut_1 = /* @__PURE__ */ requireListResponseIngestSourceOut();
  const rotateTokenOut_1 = /* @__PURE__ */ requireRotateTokenOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class IngestSource {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source");
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
      return request2.send(this.requestCtx, listResponseIngestSourceOut_1.ListResponseIngestSourceOutSerializer._fromJsonObject);
    }
    create(ingestSourceIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source");
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(ingestSourceIn_1.IngestSourceInSerializer._toJsonObject(ingestSourceIn2));
      return request2.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
    }
    get(sourceId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/ingest/api/v1/source/{source_id}");
      request2.setPathParam("source_id", sourceId);
      return request2.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
    }
    update(sourceId, ingestSourceIn2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/ingest/api/v1/source/{source_id}");
      request2.setPathParam("source_id", sourceId);
      request2.setBody(ingestSourceIn_1.IngestSourceInSerializer._toJsonObject(ingestSourceIn2));
      return request2.send(this.requestCtx, ingestSourceOut_1.IngestSourceOutSerializer._fromJsonObject);
    }
    delete(sourceId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/ingest/api/v1/source/{source_id}");
      request2.setPathParam("source_id", sourceId);
      return request2.sendNoResponseBody(this.requestCtx);
    }
    rotateToken(sourceId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/token/rotate");
      request2.setPathParam("source_id", sourceId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      return request2.send(this.requestCtx, rotateTokenOut_1.RotateTokenOutSerializer._fromJsonObject);
    }
  }
  ingestSource.IngestSource = IngestSource;
  return ingestSource;
}
var hasRequiredIngest;
function requireIngest() {
  if (hasRequiredIngest) return ingest;
  hasRequiredIngest = 1;
  Object.defineProperty(ingest, "__esModule", { value: true });
  ingest.Ingest = void 0;
  const dashboardAccessOut_1 = /* @__PURE__ */ requireDashboardAccessOut();
  const ingestSourceConsumerPortalAccessIn_1 = /* @__PURE__ */ requireIngestSourceConsumerPortalAccessIn();
  const ingestEndpoint_1 = /* @__PURE__ */ requireIngestEndpoint();
  const ingestSource_1 = /* @__PURE__ */ requireIngestSource();
  const request_1 = /* @__PURE__ */ requireRequest();
  class Ingest {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    get endpoint() {
      return new ingestEndpoint_1.IngestEndpoint(this.requestCtx);
    }
    get source() {
      return new ingestSource_1.IngestSource(this.requestCtx);
    }
    dashboard(sourceId, ingestSourceConsumerPortalAccessIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/ingest/api/v1/source/{source_id}/dashboard");
      request2.setPathParam("source_id", sourceId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(ingestSourceConsumerPortalAccessIn_1.IngestSourceConsumerPortalAccessInSerializer._toJsonObject(ingestSourceConsumerPortalAccessIn2));
      return request2.send(this.requestCtx, dashboardAccessOut_1.DashboardAccessOutSerializer._fromJsonObject);
    }
  }
  ingest.Ingest = Ingest;
  return ingest;
}
var integration = {};
var integrationIn = {};
var hasRequiredIntegrationIn;
function requireIntegrationIn() {
  if (hasRequiredIntegrationIn) return integrationIn;
  hasRequiredIntegrationIn = 1;
  Object.defineProperty(integrationIn, "__esModule", { value: true });
  integrationIn.IntegrationInSerializer = void 0;
  integrationIn.IntegrationInSerializer = {
    _fromJsonObject(object) {
      return {
        featureFlags: object["featureFlags"],
        name: object["name"]
      };
    },
    _toJsonObject(self) {
      return {
        featureFlags: self.featureFlags,
        name: self.name
      };
    }
  };
  return integrationIn;
}
var integrationKeyOut = {};
var hasRequiredIntegrationKeyOut;
function requireIntegrationKeyOut() {
  if (hasRequiredIntegrationKeyOut) return integrationKeyOut;
  hasRequiredIntegrationKeyOut = 1;
  Object.defineProperty(integrationKeyOut, "__esModule", { value: true });
  integrationKeyOut.IntegrationKeyOutSerializer = void 0;
  integrationKeyOut.IntegrationKeyOutSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
  return integrationKeyOut;
}
var integrationOut = {};
var hasRequiredIntegrationOut;
function requireIntegrationOut() {
  if (hasRequiredIntegrationOut) return integrationOut;
  hasRequiredIntegrationOut = 1;
  Object.defineProperty(integrationOut, "__esModule", { value: true });
  integrationOut.IntegrationOutSerializer = void 0;
  integrationOut.IntegrationOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        featureFlags: object["featureFlags"],
        id: object["id"],
        name: object["name"],
        updatedAt: new Date(object["updatedAt"])
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        featureFlags: self.featureFlags,
        id: self.id,
        name: self.name,
        updatedAt: self.updatedAt
      };
    }
  };
  return integrationOut;
}
var integrationUpdate = {};
var hasRequiredIntegrationUpdate;
function requireIntegrationUpdate() {
  if (hasRequiredIntegrationUpdate) return integrationUpdate;
  hasRequiredIntegrationUpdate = 1;
  Object.defineProperty(integrationUpdate, "__esModule", { value: true });
  integrationUpdate.IntegrationUpdateSerializer = void 0;
  integrationUpdate.IntegrationUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        featureFlags: object["featureFlags"],
        name: object["name"]
      };
    },
    _toJsonObject(self) {
      return {
        featureFlags: self.featureFlags,
        name: self.name
      };
    }
  };
  return integrationUpdate;
}
var listResponseIntegrationOut = {};
var hasRequiredListResponseIntegrationOut;
function requireListResponseIntegrationOut() {
  if (hasRequiredListResponseIntegrationOut) return listResponseIntegrationOut;
  hasRequiredListResponseIntegrationOut = 1;
  Object.defineProperty(listResponseIntegrationOut, "__esModule", { value: true });
  listResponseIntegrationOut.ListResponseIntegrationOutSerializer = void 0;
  const integrationOut_1 = /* @__PURE__ */ requireIntegrationOut();
  listResponseIntegrationOut.ListResponseIntegrationOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => integrationOut_1.IntegrationOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => integrationOut_1.IntegrationOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseIntegrationOut;
}
var hasRequiredIntegration;
function requireIntegration() {
  if (hasRequiredIntegration) return integration;
  hasRequiredIntegration = 1;
  Object.defineProperty(integration, "__esModule", { value: true });
  integration.Integration = void 0;
  const integrationIn_1 = /* @__PURE__ */ requireIntegrationIn();
  const integrationKeyOut_1 = /* @__PURE__ */ requireIntegrationKeyOut();
  const integrationOut_1 = /* @__PURE__ */ requireIntegrationOut();
  const integrationUpdate_1 = /* @__PURE__ */ requireIntegrationUpdate();
  const listResponseIntegrationOut_1 = /* @__PURE__ */ requireListResponseIntegrationOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class Integration {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(appId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration");
      request2.setPathParam("app_id", appId);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
      return request2.send(this.requestCtx, listResponseIntegrationOut_1.ListResponseIntegrationOutSerializer._fromJsonObject);
    }
    create(appId, integrationIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/integration");
      request2.setPathParam("app_id", appId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(integrationIn_1.IntegrationInSerializer._toJsonObject(integrationIn2));
      return request2.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
    }
    get(appId, integId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration/{integ_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("integ_id", integId);
      return request2.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
    }
    update(appId, integId, integrationUpdate2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/app/{app_id}/integration/{integ_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("integ_id", integId);
      request2.setBody(integrationUpdate_1.IntegrationUpdateSerializer._toJsonObject(integrationUpdate2));
      return request2.send(this.requestCtx, integrationOut_1.IntegrationOutSerializer._fromJsonObject);
    }
    delete(appId, integId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/integration/{integ_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("integ_id", integId);
      return request2.sendNoResponseBody(this.requestCtx);
    }
    getKey(appId, integId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/integration/{integ_id}/key");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("integ_id", integId);
      return request2.send(this.requestCtx, integrationKeyOut_1.IntegrationKeyOutSerializer._fromJsonObject);
    }
    rotateKey(appId, integId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/integration/{integ_id}/key/rotate");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("integ_id", integId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      return request2.send(this.requestCtx, integrationKeyOut_1.IntegrationKeyOutSerializer._fromJsonObject);
    }
  }
  integration.Integration = Integration;
  return integration;
}
var message = {};
var expungeAllContentsOut = {};
var hasRequiredExpungeAllContentsOut;
function requireExpungeAllContentsOut() {
  if (hasRequiredExpungeAllContentsOut) return expungeAllContentsOut;
  hasRequiredExpungeAllContentsOut = 1;
  Object.defineProperty(expungeAllContentsOut, "__esModule", { value: true });
  expungeAllContentsOut.ExpungeAllContentsOutSerializer = void 0;
  const backgroundTaskStatus_1 = /* @__PURE__ */ requireBackgroundTaskStatus();
  const backgroundTaskType_1 = /* @__PURE__ */ requireBackgroundTaskType();
  expungeAllContentsOut.ExpungeAllContentsOutSerializer = {
    _fromJsonObject(object) {
      return {
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
      };
    },
    _toJsonObject(self) {
      return {
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
      };
    }
  };
  return expungeAllContentsOut;
}
var listResponseMessageOut = {};
var hasRequiredListResponseMessageOut;
function requireListResponseMessageOut() {
  if (hasRequiredListResponseMessageOut) return listResponseMessageOut;
  hasRequiredListResponseMessageOut = 1;
  Object.defineProperty(listResponseMessageOut, "__esModule", { value: true });
  listResponseMessageOut.ListResponseMessageOutSerializer = void 0;
  const messageOut_1 = /* @__PURE__ */ requireMessageOut();
  listResponseMessageOut.ListResponseMessageOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => messageOut_1.MessageOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => messageOut_1.MessageOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseMessageOut;
}
var messagePoller = {};
var pollingEndpointConsumerSeekIn = {};
var hasRequiredPollingEndpointConsumerSeekIn;
function requirePollingEndpointConsumerSeekIn() {
  if (hasRequiredPollingEndpointConsumerSeekIn) return pollingEndpointConsumerSeekIn;
  hasRequiredPollingEndpointConsumerSeekIn = 1;
  Object.defineProperty(pollingEndpointConsumerSeekIn, "__esModule", { value: true });
  pollingEndpointConsumerSeekIn.PollingEndpointConsumerSeekInSerializer = void 0;
  pollingEndpointConsumerSeekIn.PollingEndpointConsumerSeekInSerializer = {
    _fromJsonObject(object) {
      return {
        after: new Date(object["after"])
      };
    },
    _toJsonObject(self) {
      return {
        after: self.after
      };
    }
  };
  return pollingEndpointConsumerSeekIn;
}
var pollingEndpointConsumerSeekOut = {};
var hasRequiredPollingEndpointConsumerSeekOut;
function requirePollingEndpointConsumerSeekOut() {
  if (hasRequiredPollingEndpointConsumerSeekOut) return pollingEndpointConsumerSeekOut;
  hasRequiredPollingEndpointConsumerSeekOut = 1;
  Object.defineProperty(pollingEndpointConsumerSeekOut, "__esModule", { value: true });
  pollingEndpointConsumerSeekOut.PollingEndpointConsumerSeekOutSerializer = void 0;
  pollingEndpointConsumerSeekOut.PollingEndpointConsumerSeekOutSerializer = {
    _fromJsonObject(object) {
      return {
        iterator: object["iterator"]
      };
    },
    _toJsonObject(self) {
      return {
        iterator: self.iterator
      };
    }
  };
  return pollingEndpointConsumerSeekOut;
}
var pollingEndpointOut = {};
var pollingEndpointMessageOut = {};
var hasRequiredPollingEndpointMessageOut;
function requirePollingEndpointMessageOut() {
  if (hasRequiredPollingEndpointMessageOut) return pollingEndpointMessageOut;
  hasRequiredPollingEndpointMessageOut = 1;
  Object.defineProperty(pollingEndpointMessageOut, "__esModule", { value: true });
  pollingEndpointMessageOut.PollingEndpointMessageOutSerializer = void 0;
  pollingEndpointMessageOut.PollingEndpointMessageOutSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        eventId: object["eventId"],
        eventType: object["eventType"],
        headers: object["headers"],
        id: object["id"],
        payload: object["payload"],
        tags: object["tags"],
        timestamp: new Date(object["timestamp"])
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        eventId: self.eventId,
        eventType: self.eventType,
        headers: self.headers,
        id: self.id,
        payload: self.payload,
        tags: self.tags,
        timestamp: self.timestamp
      };
    }
  };
  return pollingEndpointMessageOut;
}
var hasRequiredPollingEndpointOut;
function requirePollingEndpointOut() {
  if (hasRequiredPollingEndpointOut) return pollingEndpointOut;
  hasRequiredPollingEndpointOut = 1;
  Object.defineProperty(pollingEndpointOut, "__esModule", { value: true });
  pollingEndpointOut.PollingEndpointOutSerializer = void 0;
  const pollingEndpointMessageOut_1 = /* @__PURE__ */ requirePollingEndpointMessageOut();
  pollingEndpointOut.PollingEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => pollingEndpointMessageOut_1.PollingEndpointMessageOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator
      };
    }
  };
  return pollingEndpointOut;
}
var hasRequiredMessagePoller;
function requireMessagePoller() {
  if (hasRequiredMessagePoller) return messagePoller;
  hasRequiredMessagePoller = 1;
  Object.defineProperty(messagePoller, "__esModule", { value: true });
  messagePoller.MessagePoller = void 0;
  const pollingEndpointConsumerSeekIn_1 = /* @__PURE__ */ requirePollingEndpointConsumerSeekIn();
  const pollingEndpointConsumerSeekOut_1 = /* @__PURE__ */ requirePollingEndpointConsumerSeekOut();
  const pollingEndpointOut_1 = /* @__PURE__ */ requirePollingEndpointOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class MessagePoller {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    poll(appId, sinkId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/poller/{sink_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("sink_id", sinkId);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("event_type", options === null || options === void 0 ? void 0 : options.eventType);
      request2.setQueryParam("channel", options === null || options === void 0 ? void 0 : options.channel);
      request2.setQueryParam("after", options === null || options === void 0 ? void 0 : options.after);
      return request2.send(this.requestCtx, pollingEndpointOut_1.PollingEndpointOutSerializer._fromJsonObject);
    }
    consumerPoll(appId, sinkId, consumerId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/poller/{sink_id}/consumer/{consumer_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("sink_id", sinkId);
      request2.setPathParam("consumer_id", consumerId);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      return request2.send(this.requestCtx, pollingEndpointOut_1.PollingEndpointOutSerializer._fromJsonObject);
    }
    consumerSeek(appId, sinkId, consumerId, pollingEndpointConsumerSeekIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/poller/{sink_id}/consumer/{consumer_id}/seek");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("sink_id", sinkId);
      request2.setPathParam("consumer_id", consumerId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(pollingEndpointConsumerSeekIn_1.PollingEndpointConsumerSeekInSerializer._toJsonObject(pollingEndpointConsumerSeekIn2));
      return request2.send(this.requestCtx, pollingEndpointConsumerSeekOut_1.PollingEndpointConsumerSeekOutSerializer._fromJsonObject);
    }
  }
  messagePoller.MessagePoller = MessagePoller;
  return messagePoller;
}
var messageIn = {};
var hasRequiredMessageIn;
function requireMessageIn() {
  if (hasRequiredMessageIn) return messageIn;
  hasRequiredMessageIn = 1;
  Object.defineProperty(messageIn, "__esModule", { value: true });
  messageIn.MessageInSerializer = void 0;
  const applicationIn_1 = /* @__PURE__ */ requireApplicationIn();
  messageIn.MessageInSerializer = {
    _fromJsonObject(object) {
      return {
        application: object["application"] ? applicationIn_1.ApplicationInSerializer._fromJsonObject(object["application"]) : void 0,
        channels: object["channels"],
        eventId: object["eventId"],
        eventType: object["eventType"],
        payload: object["payload"],
        payloadRetentionHours: object["payloadRetentionHours"],
        payloadRetentionPeriod: object["payloadRetentionPeriod"],
        tags: object["tags"],
        transformationsParams: object["transformationsParams"]
      };
    },
    _toJsonObject(self) {
      return {
        application: self.application ? applicationIn_1.ApplicationInSerializer._toJsonObject(self.application) : void 0,
        channels: self.channels,
        eventId: self.eventId,
        eventType: self.eventType,
        payload: self.payload,
        payloadRetentionHours: self.payloadRetentionHours,
        payloadRetentionPeriod: self.payloadRetentionPeriod,
        tags: self.tags,
        transformationsParams: self.transformationsParams
      };
    }
  };
  return messageIn;
}
var hasRequiredMessage;
function requireMessage() {
  if (hasRequiredMessage) return message;
  hasRequiredMessage = 1;
  Object.defineProperty(message, "__esModule", { value: true });
  message.messageInRaw = message.Message = void 0;
  const expungeAllContentsOut_1 = /* @__PURE__ */ requireExpungeAllContentsOut();
  const listResponseMessageOut_1 = /* @__PURE__ */ requireListResponseMessageOut();
  const messageOut_1 = /* @__PURE__ */ requireMessageOut();
  const messagePoller_1 = /* @__PURE__ */ requireMessagePoller();
  const request_1 = /* @__PURE__ */ requireRequest();
  const messageIn_1 = /* @__PURE__ */ requireMessageIn();
  class Message {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    get poller() {
      return new messagePoller_1.MessagePoller(this.requestCtx);
    }
    list(appId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg");
      request2.setPathParam("app_id", appId);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("channel", options === null || options === void 0 ? void 0 : options.channel);
      request2.setQueryParam("before", options === null || options === void 0 ? void 0 : options.before);
      request2.setQueryParam("after", options === null || options === void 0 ? void 0 : options.after);
      request2.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
      request2.setQueryParam("tag", options === null || options === void 0 ? void 0 : options.tag);
      request2.setQueryParam("event_types", options === null || options === void 0 ? void 0 : options.eventTypes);
      return request2.send(this.requestCtx, listResponseMessageOut_1.ListResponseMessageOutSerializer._fromJsonObject);
    }
    create(appId, messageIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg");
      request2.setPathParam("app_id", appId);
      request2.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(messageIn_1.MessageInSerializer._toJsonObject(messageIn2));
      return request2.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
    }
    expungeAllContents(appId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/expunge-all-contents");
      request2.setPathParam("app_id", appId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      return request2.send(this.requestCtx, expungeAllContentsOut_1.ExpungeAllContentsOutSerializer._fromJsonObject);
    }
    get(appId, msgId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("msg_id", msgId);
      request2.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
      return request2.send(this.requestCtx, messageOut_1.MessageOutSerializer._fromJsonObject);
    }
    expungeContent(appId, msgId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/content");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("msg_id", msgId);
      return request2.sendNoResponseBody(this.requestCtx);
    }
  }
  message.Message = Message;
  function messageInRaw(eventType2, payload, contentType) {
    const headers = contentType ? { "content-type": contentType } : void 0;
    return {
      eventType: eventType2,
      payload: {},
      transformationsParams: {
        rawPayload: payload,
        headers
      }
    };
  }
  message.messageInRaw = messageInRaw;
  return message;
}
var messageAttempt = {};
var listResponseEndpointMessageOut = {};
var endpointMessageOut = {};
var messageStatus = {};
var hasRequiredMessageStatus;
function requireMessageStatus() {
  if (hasRequiredMessageStatus) return messageStatus;
  hasRequiredMessageStatus = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.MessageStatusSerializer = exports$1.MessageStatus = void 0;
    (function(MessageStatus) {
      MessageStatus[MessageStatus["Success"] = 0] = "Success";
      MessageStatus[MessageStatus["Pending"] = 1] = "Pending";
      MessageStatus[MessageStatus["Fail"] = 2] = "Fail";
      MessageStatus[MessageStatus["Sending"] = 3] = "Sending";
    })(exports$1.MessageStatus || (exports$1.MessageStatus = {}));
    exports$1.MessageStatusSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  })(messageStatus);
  return messageStatus;
}
var messageStatusText = {};
var hasRequiredMessageStatusText;
function requireMessageStatusText() {
  if (hasRequiredMessageStatusText) return messageStatusText;
  hasRequiredMessageStatusText = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.MessageStatusTextSerializer = exports$1.MessageStatusText = void 0;
    (function(MessageStatusText) {
      MessageStatusText["Success"] = "success";
      MessageStatusText["Pending"] = "pending";
      MessageStatusText["Fail"] = "fail";
      MessageStatusText["Sending"] = "sending";
    })(exports$1.MessageStatusText || (exports$1.MessageStatusText = {}));
    exports$1.MessageStatusTextSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  })(messageStatusText);
  return messageStatusText;
}
var hasRequiredEndpointMessageOut;
function requireEndpointMessageOut() {
  if (hasRequiredEndpointMessageOut) return endpointMessageOut;
  hasRequiredEndpointMessageOut = 1;
  Object.defineProperty(endpointMessageOut, "__esModule", { value: true });
  endpointMessageOut.EndpointMessageOutSerializer = void 0;
  const messageStatus_1 = /* @__PURE__ */ requireMessageStatus();
  const messageStatusText_1 = /* @__PURE__ */ requireMessageStatusText();
  endpointMessageOut.EndpointMessageOutSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        eventId: object["eventId"],
        eventType: object["eventType"],
        id: object["id"],
        nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
        payload: object["payload"],
        status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
        statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
        tags: object["tags"],
        timestamp: new Date(object["timestamp"])
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        eventId: self.eventId,
        eventType: self.eventType,
        id: self.id,
        nextAttempt: self.nextAttempt,
        payload: self.payload,
        status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
        statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
        tags: self.tags,
        timestamp: self.timestamp
      };
    }
  };
  return endpointMessageOut;
}
var hasRequiredListResponseEndpointMessageOut;
function requireListResponseEndpointMessageOut() {
  if (hasRequiredListResponseEndpointMessageOut) return listResponseEndpointMessageOut;
  hasRequiredListResponseEndpointMessageOut = 1;
  Object.defineProperty(listResponseEndpointMessageOut, "__esModule", { value: true });
  listResponseEndpointMessageOut.ListResponseEndpointMessageOutSerializer = void 0;
  const endpointMessageOut_1 = /* @__PURE__ */ requireEndpointMessageOut();
  listResponseEndpointMessageOut.ListResponseEndpointMessageOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => endpointMessageOut_1.EndpointMessageOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => endpointMessageOut_1.EndpointMessageOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseEndpointMessageOut;
}
var listResponseMessageAttemptOut = {};
var messageAttemptOut = {};
var messageAttemptTriggerType = {};
var hasRequiredMessageAttemptTriggerType;
function requireMessageAttemptTriggerType() {
  if (hasRequiredMessageAttemptTriggerType) return messageAttemptTriggerType;
  hasRequiredMessageAttemptTriggerType = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.MessageAttemptTriggerTypeSerializer = exports$1.MessageAttemptTriggerType = void 0;
    (function(MessageAttemptTriggerType) {
      MessageAttemptTriggerType[MessageAttemptTriggerType["Scheduled"] = 0] = "Scheduled";
      MessageAttemptTriggerType[MessageAttemptTriggerType["Manual"] = 1] = "Manual";
    })(exports$1.MessageAttemptTriggerType || (exports$1.MessageAttemptTriggerType = {}));
    exports$1.MessageAttemptTriggerTypeSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  })(messageAttemptTriggerType);
  return messageAttemptTriggerType;
}
var hasRequiredMessageAttemptOut;
function requireMessageAttemptOut() {
  if (hasRequiredMessageAttemptOut) return messageAttemptOut;
  hasRequiredMessageAttemptOut = 1;
  Object.defineProperty(messageAttemptOut, "__esModule", { value: true });
  messageAttemptOut.MessageAttemptOutSerializer = void 0;
  const messageAttemptTriggerType_1 = /* @__PURE__ */ requireMessageAttemptTriggerType();
  const messageOut_1 = /* @__PURE__ */ requireMessageOut();
  const messageStatus_1 = /* @__PURE__ */ requireMessageStatus();
  const messageStatusText_1 = /* @__PURE__ */ requireMessageStatusText();
  messageAttemptOut.MessageAttemptOutSerializer = {
    _fromJsonObject(object) {
      return {
        endpointId: object["endpointId"],
        id: object["id"],
        msg: object["msg"] ? messageOut_1.MessageOutSerializer._fromJsonObject(object["msg"]) : void 0,
        msgId: object["msgId"],
        response: object["response"],
        responseDurationMs: object["responseDurationMs"],
        responseStatusCode: object["responseStatusCode"],
        status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
        statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
        timestamp: new Date(object["timestamp"]),
        triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._fromJsonObject(object["triggerType"]),
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        endpointId: self.endpointId,
        id: self.id,
        msg: self.msg ? messageOut_1.MessageOutSerializer._toJsonObject(self.msg) : void 0,
        msgId: self.msgId,
        response: self.response,
        responseDurationMs: self.responseDurationMs,
        responseStatusCode: self.responseStatusCode,
        status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
        statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
        timestamp: self.timestamp,
        triggerType: messageAttemptTriggerType_1.MessageAttemptTriggerTypeSerializer._toJsonObject(self.triggerType),
        url: self.url
      };
    }
  };
  return messageAttemptOut;
}
var hasRequiredListResponseMessageAttemptOut;
function requireListResponseMessageAttemptOut() {
  if (hasRequiredListResponseMessageAttemptOut) return listResponseMessageAttemptOut;
  hasRequiredListResponseMessageAttemptOut = 1;
  Object.defineProperty(listResponseMessageAttemptOut, "__esModule", { value: true });
  listResponseMessageAttemptOut.ListResponseMessageAttemptOutSerializer = void 0;
  const messageAttemptOut_1 = /* @__PURE__ */ requireMessageAttemptOut();
  listResponseMessageAttemptOut.ListResponseMessageAttemptOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => messageAttemptOut_1.MessageAttemptOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseMessageAttemptOut;
}
var listResponseMessageEndpointOut = {};
var messageEndpointOut = {};
var hasRequiredMessageEndpointOut;
function requireMessageEndpointOut() {
  if (hasRequiredMessageEndpointOut) return messageEndpointOut;
  hasRequiredMessageEndpointOut = 1;
  Object.defineProperty(messageEndpointOut, "__esModule", { value: true });
  messageEndpointOut.MessageEndpointOutSerializer = void 0;
  const messageStatus_1 = /* @__PURE__ */ requireMessageStatus();
  const messageStatusText_1 = /* @__PURE__ */ requireMessageStatusText();
  messageEndpointOut.MessageEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        channels: object["channels"],
        createdAt: new Date(object["createdAt"]),
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        id: object["id"],
        nextAttempt: object["nextAttempt"] ? new Date(object["nextAttempt"]) : null,
        rateLimit: object["rateLimit"],
        status: messageStatus_1.MessageStatusSerializer._fromJsonObject(object["status"]),
        statusText: messageStatusText_1.MessageStatusTextSerializer._fromJsonObject(object["statusText"]),
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"]),
        url: object["url"],
        version: object["version"]
      };
    },
    _toJsonObject(self) {
      return {
        channels: self.channels,
        createdAt: self.createdAt,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        id: self.id,
        nextAttempt: self.nextAttempt,
        rateLimit: self.rateLimit,
        status: messageStatus_1.MessageStatusSerializer._toJsonObject(self.status),
        statusText: messageStatusText_1.MessageStatusTextSerializer._toJsonObject(self.statusText),
        uid: self.uid,
        updatedAt: self.updatedAt,
        url: self.url,
        version: self.version
      };
    }
  };
  return messageEndpointOut;
}
var hasRequiredListResponseMessageEndpointOut;
function requireListResponseMessageEndpointOut() {
  if (hasRequiredListResponseMessageEndpointOut) return listResponseMessageEndpointOut;
  hasRequiredListResponseMessageEndpointOut = 1;
  Object.defineProperty(listResponseMessageEndpointOut, "__esModule", { value: true });
  listResponseMessageEndpointOut.ListResponseMessageEndpointOutSerializer = void 0;
  const messageEndpointOut_1 = /* @__PURE__ */ requireMessageEndpointOut();
  listResponseMessageEndpointOut.ListResponseMessageEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => messageEndpointOut_1.MessageEndpointOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => messageEndpointOut_1.MessageEndpointOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseMessageEndpointOut;
}
var hasRequiredMessageAttempt;
function requireMessageAttempt() {
  if (hasRequiredMessageAttempt) return messageAttempt;
  hasRequiredMessageAttempt = 1;
  Object.defineProperty(messageAttempt, "__esModule", { value: true });
  messageAttempt.MessageAttempt = void 0;
  const listResponseEndpointMessageOut_1 = /* @__PURE__ */ requireListResponseEndpointMessageOut();
  const listResponseMessageAttemptOut_1 = /* @__PURE__ */ requireListResponseMessageAttemptOut();
  const listResponseMessageEndpointOut_1 = /* @__PURE__ */ requireListResponseMessageEndpointOut();
  const messageAttemptOut_1 = /* @__PURE__ */ requireMessageAttemptOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class MessageAttempt {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    listByEndpoint(appId, endpointId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/endpoint/{endpoint_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("status", options === null || options === void 0 ? void 0 : options.status);
      request2.setQueryParam("status_code_class", options === null || options === void 0 ? void 0 : options.statusCodeClass);
      request2.setQueryParam("channel", options === null || options === void 0 ? void 0 : options.channel);
      request2.setQueryParam("tag", options === null || options === void 0 ? void 0 : options.tag);
      request2.setQueryParam("before", options === null || options === void 0 ? void 0 : options.before);
      request2.setQueryParam("after", options === null || options === void 0 ? void 0 : options.after);
      request2.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
      request2.setQueryParam("with_msg", options === null || options === void 0 ? void 0 : options.withMsg);
      request2.setQueryParam("event_types", options === null || options === void 0 ? void 0 : options.eventTypes);
      return request2.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
    }
    listByMsg(appId, msgId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/attempt/msg/{msg_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("msg_id", msgId);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("status", options === null || options === void 0 ? void 0 : options.status);
      request2.setQueryParam("status_code_class", options === null || options === void 0 ? void 0 : options.statusCodeClass);
      request2.setQueryParam("channel", options === null || options === void 0 ? void 0 : options.channel);
      request2.setQueryParam("tag", options === null || options === void 0 ? void 0 : options.tag);
      request2.setQueryParam("endpoint_id", options === null || options === void 0 ? void 0 : options.endpointId);
      request2.setQueryParam("before", options === null || options === void 0 ? void 0 : options.before);
      request2.setQueryParam("after", options === null || options === void 0 ? void 0 : options.after);
      request2.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
      request2.setQueryParam("event_types", options === null || options === void 0 ? void 0 : options.eventTypes);
      return request2.send(this.requestCtx, listResponseMessageAttemptOut_1.ListResponseMessageAttemptOutSerializer._fromJsonObject);
    }
    listAttemptedMessages(appId, endpointId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/endpoint/{endpoint_id}/msg");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("channel", options === null || options === void 0 ? void 0 : options.channel);
      request2.setQueryParam("tag", options === null || options === void 0 ? void 0 : options.tag);
      request2.setQueryParam("status", options === null || options === void 0 ? void 0 : options.status);
      request2.setQueryParam("before", options === null || options === void 0 ? void 0 : options.before);
      request2.setQueryParam("after", options === null || options === void 0 ? void 0 : options.after);
      request2.setQueryParam("with_content", options === null || options === void 0 ? void 0 : options.withContent);
      request2.setQueryParam("event_types", options === null || options === void 0 ? void 0 : options.eventTypes);
      return request2.send(this.requestCtx, listResponseEndpointMessageOut_1.ListResponseEndpointMessageOutSerializer._fromJsonObject);
    }
    get(appId, msgId, attemptId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("msg_id", msgId);
      request2.setPathParam("attempt_id", attemptId);
      return request2.send(this.requestCtx, messageAttemptOut_1.MessageAttemptOutSerializer._fromJsonObject);
    }
    expungeContent(appId, msgId, attemptId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/app/{app_id}/msg/{msg_id}/attempt/{attempt_id}/content");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("msg_id", msgId);
      request2.setPathParam("attempt_id", attemptId);
      return request2.sendNoResponseBody(this.requestCtx);
    }
    listAttemptedDestinations(appId, msgId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("msg_id", msgId);
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      return request2.send(this.requestCtx, listResponseMessageEndpointOut_1.ListResponseMessageEndpointOutSerializer._fromJsonObject);
    }
    resend(appId, msgId, endpointId, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/app/{app_id}/msg/{msg_id}/endpoint/{endpoint_id}/resend");
      request2.setPathParam("app_id", appId);
      request2.setPathParam("msg_id", msgId);
      request2.setPathParam("endpoint_id", endpointId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      return request2.sendNoResponseBody(this.requestCtx);
    }
  }
  messageAttempt.MessageAttempt = MessageAttempt;
  return messageAttempt;
}
var operationalWebhook = {};
var operationalWebhookEndpoint = {};
var listResponseOperationalWebhookEndpointOut = {};
var operationalWebhookEndpointOut = {};
var hasRequiredOperationalWebhookEndpointOut;
function requireOperationalWebhookEndpointOut() {
  if (hasRequiredOperationalWebhookEndpointOut) return operationalWebhookEndpointOut;
  hasRequiredOperationalWebhookEndpointOut = 1;
  Object.defineProperty(operationalWebhookEndpointOut, "__esModule", { value: true });
  operationalWebhookEndpointOut.OperationalWebhookEndpointOutSerializer = void 0;
  operationalWebhookEndpointOut.OperationalWebhookEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        createdAt: new Date(object["createdAt"]),
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        id: object["id"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        updatedAt: new Date(object["updatedAt"]),
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        createdAt: self.createdAt,
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        id: self.id,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        updatedAt: self.updatedAt,
        url: self.url
      };
    }
  };
  return operationalWebhookEndpointOut;
}
var hasRequiredListResponseOperationalWebhookEndpointOut;
function requireListResponseOperationalWebhookEndpointOut() {
  if (hasRequiredListResponseOperationalWebhookEndpointOut) return listResponseOperationalWebhookEndpointOut;
  hasRequiredListResponseOperationalWebhookEndpointOut = 1;
  Object.defineProperty(listResponseOperationalWebhookEndpointOut, "__esModule", { value: true });
  listResponseOperationalWebhookEndpointOut.ListResponseOperationalWebhookEndpointOutSerializer = void 0;
  const operationalWebhookEndpointOut_1 = /* @__PURE__ */ requireOperationalWebhookEndpointOut();
  listResponseOperationalWebhookEndpointOut.ListResponseOperationalWebhookEndpointOutSerializer = {
    _fromJsonObject(object) {
      return {
        data: object["data"].map((item) => operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject(item)),
        done: object["done"],
        iterator: object["iterator"],
        prevIterator: object["prevIterator"]
      };
    },
    _toJsonObject(self) {
      return {
        data: self.data.map((item) => operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._toJsonObject(item)),
        done: self.done,
        iterator: self.iterator,
        prevIterator: self.prevIterator
      };
    }
  };
  return listResponseOperationalWebhookEndpointOut;
}
var operationalWebhookEndpointHeadersIn = {};
var hasRequiredOperationalWebhookEndpointHeadersIn;
function requireOperationalWebhookEndpointHeadersIn() {
  if (hasRequiredOperationalWebhookEndpointHeadersIn) return operationalWebhookEndpointHeadersIn;
  hasRequiredOperationalWebhookEndpointHeadersIn = 1;
  Object.defineProperty(operationalWebhookEndpointHeadersIn, "__esModule", { value: true });
  operationalWebhookEndpointHeadersIn.OperationalWebhookEndpointHeadersInSerializer = void 0;
  operationalWebhookEndpointHeadersIn.OperationalWebhookEndpointHeadersInSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers
      };
    }
  };
  return operationalWebhookEndpointHeadersIn;
}
var operationalWebhookEndpointHeadersOut = {};
var hasRequiredOperationalWebhookEndpointHeadersOut;
function requireOperationalWebhookEndpointHeadersOut() {
  if (hasRequiredOperationalWebhookEndpointHeadersOut) return operationalWebhookEndpointHeadersOut;
  hasRequiredOperationalWebhookEndpointHeadersOut = 1;
  Object.defineProperty(operationalWebhookEndpointHeadersOut, "__esModule", { value: true });
  operationalWebhookEndpointHeadersOut.OperationalWebhookEndpointHeadersOutSerializer = void 0;
  operationalWebhookEndpointHeadersOut.OperationalWebhookEndpointHeadersOutSerializer = {
    _fromJsonObject(object) {
      return {
        headers: object["headers"],
        sensitive: object["sensitive"]
      };
    },
    _toJsonObject(self) {
      return {
        headers: self.headers,
        sensitive: self.sensitive
      };
    }
  };
  return operationalWebhookEndpointHeadersOut;
}
var operationalWebhookEndpointIn = {};
var hasRequiredOperationalWebhookEndpointIn;
function requireOperationalWebhookEndpointIn() {
  if (hasRequiredOperationalWebhookEndpointIn) return operationalWebhookEndpointIn;
  hasRequiredOperationalWebhookEndpointIn = 1;
  Object.defineProperty(operationalWebhookEndpointIn, "__esModule", { value: true });
  operationalWebhookEndpointIn.OperationalWebhookEndpointInSerializer = void 0;
  operationalWebhookEndpointIn.OperationalWebhookEndpointInSerializer = {
    _fromJsonObject(object) {
      return {
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        secret: object["secret"],
        uid: object["uid"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        secret: self.secret,
        uid: self.uid,
        url: self.url
      };
    }
  };
  return operationalWebhookEndpointIn;
}
var operationalWebhookEndpointSecretIn = {};
var hasRequiredOperationalWebhookEndpointSecretIn;
function requireOperationalWebhookEndpointSecretIn() {
  if (hasRequiredOperationalWebhookEndpointSecretIn) return operationalWebhookEndpointSecretIn;
  hasRequiredOperationalWebhookEndpointSecretIn = 1;
  Object.defineProperty(operationalWebhookEndpointSecretIn, "__esModule", { value: true });
  operationalWebhookEndpointSecretIn.OperationalWebhookEndpointSecretInSerializer = void 0;
  operationalWebhookEndpointSecretIn.OperationalWebhookEndpointSecretInSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
  return operationalWebhookEndpointSecretIn;
}
var operationalWebhookEndpointSecretOut = {};
var hasRequiredOperationalWebhookEndpointSecretOut;
function requireOperationalWebhookEndpointSecretOut() {
  if (hasRequiredOperationalWebhookEndpointSecretOut) return operationalWebhookEndpointSecretOut;
  hasRequiredOperationalWebhookEndpointSecretOut = 1;
  Object.defineProperty(operationalWebhookEndpointSecretOut, "__esModule", { value: true });
  operationalWebhookEndpointSecretOut.OperationalWebhookEndpointSecretOutSerializer = void 0;
  operationalWebhookEndpointSecretOut.OperationalWebhookEndpointSecretOutSerializer = {
    _fromJsonObject(object) {
      return {
        key: object["key"]
      };
    },
    _toJsonObject(self) {
      return {
        key: self.key
      };
    }
  };
  return operationalWebhookEndpointSecretOut;
}
var operationalWebhookEndpointUpdate = {};
var hasRequiredOperationalWebhookEndpointUpdate;
function requireOperationalWebhookEndpointUpdate() {
  if (hasRequiredOperationalWebhookEndpointUpdate) return operationalWebhookEndpointUpdate;
  hasRequiredOperationalWebhookEndpointUpdate = 1;
  Object.defineProperty(operationalWebhookEndpointUpdate, "__esModule", { value: true });
  operationalWebhookEndpointUpdate.OperationalWebhookEndpointUpdateSerializer = void 0;
  operationalWebhookEndpointUpdate.OperationalWebhookEndpointUpdateSerializer = {
    _fromJsonObject(object) {
      return {
        description: object["description"],
        disabled: object["disabled"],
        filterTypes: object["filterTypes"],
        metadata: object["metadata"],
        rateLimit: object["rateLimit"],
        uid: object["uid"],
        url: object["url"]
      };
    },
    _toJsonObject(self) {
      return {
        description: self.description,
        disabled: self.disabled,
        filterTypes: self.filterTypes,
        metadata: self.metadata,
        rateLimit: self.rateLimit,
        uid: self.uid,
        url: self.url
      };
    }
  };
  return operationalWebhookEndpointUpdate;
}
var hasRequiredOperationalWebhookEndpoint;
function requireOperationalWebhookEndpoint() {
  if (hasRequiredOperationalWebhookEndpoint) return operationalWebhookEndpoint;
  hasRequiredOperationalWebhookEndpoint = 1;
  Object.defineProperty(operationalWebhookEndpoint, "__esModule", { value: true });
  operationalWebhookEndpoint.OperationalWebhookEndpoint = void 0;
  const listResponseOperationalWebhookEndpointOut_1 = /* @__PURE__ */ requireListResponseOperationalWebhookEndpointOut();
  const operationalWebhookEndpointHeadersIn_1 = /* @__PURE__ */ requireOperationalWebhookEndpointHeadersIn();
  const operationalWebhookEndpointHeadersOut_1 = /* @__PURE__ */ requireOperationalWebhookEndpointHeadersOut();
  const operationalWebhookEndpointIn_1 = /* @__PURE__ */ requireOperationalWebhookEndpointIn();
  const operationalWebhookEndpointOut_1 = /* @__PURE__ */ requireOperationalWebhookEndpointOut();
  const operationalWebhookEndpointSecretIn_1 = /* @__PURE__ */ requireOperationalWebhookEndpointSecretIn();
  const operationalWebhookEndpointSecretOut_1 = /* @__PURE__ */ requireOperationalWebhookEndpointSecretOut();
  const operationalWebhookEndpointUpdate_1 = /* @__PURE__ */ requireOperationalWebhookEndpointUpdate();
  const request_1 = /* @__PURE__ */ requireRequest();
  class OperationalWebhookEndpoint {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    list(options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint");
      request2.setQueryParam("limit", options === null || options === void 0 ? void 0 : options.limit);
      request2.setQueryParam("iterator", options === null || options === void 0 ? void 0 : options.iterator);
      request2.setQueryParam("order", options === null || options === void 0 ? void 0 : options.order);
      return request2.send(this.requestCtx, listResponseOperationalWebhookEndpointOut_1.ListResponseOperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    create(operationalWebhookEndpointIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/operational-webhook/endpoint");
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(operationalWebhookEndpointIn_1.OperationalWebhookEndpointInSerializer._toJsonObject(operationalWebhookEndpointIn2));
      return request2.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    get(endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    update(endpointId, operationalWebhookEndpointUpdate2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(operationalWebhookEndpointUpdate_1.OperationalWebhookEndpointUpdateSerializer._toJsonObject(operationalWebhookEndpointUpdate2));
      return request2.send(this.requestCtx, operationalWebhookEndpointOut_1.OperationalWebhookEndpointOutSerializer._fromJsonObject);
    }
    delete(endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.DELETE, "/api/v1/operational-webhook/endpoint/{endpoint_id}");
      request2.setPathParam("endpoint_id", endpointId);
      return request2.sendNoResponseBody(this.requestCtx);
    }
    getHeaders(endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}/headers");
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, operationalWebhookEndpointHeadersOut_1.OperationalWebhookEndpointHeadersOutSerializer._fromJsonObject);
    }
    updateHeaders(endpointId, operationalWebhookEndpointHeadersIn2) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/operational-webhook/endpoint/{endpoint_id}/headers");
      request2.setPathParam("endpoint_id", endpointId);
      request2.setBody(operationalWebhookEndpointHeadersIn_1.OperationalWebhookEndpointHeadersInSerializer._toJsonObject(operationalWebhookEndpointHeadersIn2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
    getSecret(endpointId) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.GET, "/api/v1/operational-webhook/endpoint/{endpoint_id}/secret");
      request2.setPathParam("endpoint_id", endpointId);
      return request2.send(this.requestCtx, operationalWebhookEndpointSecretOut_1.OperationalWebhookEndpointSecretOutSerializer._fromJsonObject);
    }
    rotateSecret(endpointId, operationalWebhookEndpointSecretIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/operational-webhook/endpoint/{endpoint_id}/secret/rotate");
      request2.setPathParam("endpoint_id", endpointId);
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(operationalWebhookEndpointSecretIn_1.OperationalWebhookEndpointSecretInSerializer._toJsonObject(operationalWebhookEndpointSecretIn2));
      return request2.sendNoResponseBody(this.requestCtx);
    }
  }
  operationalWebhookEndpoint.OperationalWebhookEndpoint = OperationalWebhookEndpoint;
  return operationalWebhookEndpoint;
}
var hasRequiredOperationalWebhook;
function requireOperationalWebhook() {
  if (hasRequiredOperationalWebhook) return operationalWebhook;
  hasRequiredOperationalWebhook = 1;
  Object.defineProperty(operationalWebhook, "__esModule", { value: true });
  operationalWebhook.OperationalWebhook = void 0;
  const operationalWebhookEndpoint_1 = /* @__PURE__ */ requireOperationalWebhookEndpoint();
  class OperationalWebhook {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    get endpoint() {
      return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
    }
  }
  operationalWebhook.OperationalWebhook = OperationalWebhook;
  return operationalWebhook;
}
var statistics = {};
var aggregateEventTypesOut = {};
var hasRequiredAggregateEventTypesOut;
function requireAggregateEventTypesOut() {
  if (hasRequiredAggregateEventTypesOut) return aggregateEventTypesOut;
  hasRequiredAggregateEventTypesOut = 1;
  Object.defineProperty(aggregateEventTypesOut, "__esModule", { value: true });
  aggregateEventTypesOut.AggregateEventTypesOutSerializer = void 0;
  const backgroundTaskStatus_1 = /* @__PURE__ */ requireBackgroundTaskStatus();
  const backgroundTaskType_1 = /* @__PURE__ */ requireBackgroundTaskType();
  aggregateEventTypesOut.AggregateEventTypesOutSerializer = {
    _fromJsonObject(object) {
      return {
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"])
      };
    },
    _toJsonObject(self) {
      return {
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task)
      };
    }
  };
  return aggregateEventTypesOut;
}
var appUsageStatsIn = {};
var hasRequiredAppUsageStatsIn;
function requireAppUsageStatsIn() {
  if (hasRequiredAppUsageStatsIn) return appUsageStatsIn;
  hasRequiredAppUsageStatsIn = 1;
  Object.defineProperty(appUsageStatsIn, "__esModule", { value: true });
  appUsageStatsIn.AppUsageStatsInSerializer = void 0;
  appUsageStatsIn.AppUsageStatsInSerializer = {
    _fromJsonObject(object) {
      return {
        appIds: object["appIds"],
        since: new Date(object["since"]),
        until: new Date(object["until"])
      };
    },
    _toJsonObject(self) {
      return {
        appIds: self.appIds,
        since: self.since,
        until: self.until
      };
    }
  };
  return appUsageStatsIn;
}
var appUsageStatsOut = {};
var hasRequiredAppUsageStatsOut;
function requireAppUsageStatsOut() {
  if (hasRequiredAppUsageStatsOut) return appUsageStatsOut;
  hasRequiredAppUsageStatsOut = 1;
  Object.defineProperty(appUsageStatsOut, "__esModule", { value: true });
  appUsageStatsOut.AppUsageStatsOutSerializer = void 0;
  const backgroundTaskStatus_1 = /* @__PURE__ */ requireBackgroundTaskStatus();
  const backgroundTaskType_1 = /* @__PURE__ */ requireBackgroundTaskType();
  appUsageStatsOut.AppUsageStatsOutSerializer = {
    _fromJsonObject(object) {
      return {
        id: object["id"],
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._fromJsonObject(object["status"]),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._fromJsonObject(object["task"]),
        unresolvedAppIds: object["unresolvedAppIds"]
      };
    },
    _toJsonObject(self) {
      return {
        id: self.id,
        status: backgroundTaskStatus_1.BackgroundTaskStatusSerializer._toJsonObject(self.status),
        task: backgroundTaskType_1.BackgroundTaskTypeSerializer._toJsonObject(self.task),
        unresolvedAppIds: self.unresolvedAppIds
      };
    }
  };
  return appUsageStatsOut;
}
var hasRequiredStatistics;
function requireStatistics() {
  if (hasRequiredStatistics) return statistics;
  hasRequiredStatistics = 1;
  Object.defineProperty(statistics, "__esModule", { value: true });
  statistics.Statistics = void 0;
  const aggregateEventTypesOut_1 = /* @__PURE__ */ requireAggregateEventTypesOut();
  const appUsageStatsIn_1 = /* @__PURE__ */ requireAppUsageStatsIn();
  const appUsageStatsOut_1 = /* @__PURE__ */ requireAppUsageStatsOut();
  const request_1 = /* @__PURE__ */ requireRequest();
  class Statistics {
    constructor(requestCtx) {
      this.requestCtx = requestCtx;
    }
    aggregateAppStats(appUsageStatsIn2, options) {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.POST, "/api/v1/stats/usage/app");
      request2.setHeaderParam("idempotency-key", options === null || options === void 0 ? void 0 : options.idempotencyKey);
      request2.setBody(appUsageStatsIn_1.AppUsageStatsInSerializer._toJsonObject(appUsageStatsIn2));
      return request2.send(this.requestCtx, appUsageStatsOut_1.AppUsageStatsOutSerializer._fromJsonObject);
    }
    aggregateEventTypes() {
      const request2 = new request_1.SvixRequest(request_1.HttpMethod.PUT, "/api/v1/stats/usage/event-types");
      return request2.send(this.requestCtx, aggregateEventTypesOut_1.AggregateEventTypesOutSerializer._fromJsonObject);
    }
  }
  statistics.Statistics = Statistics;
  return statistics;
}
var HttpErrors = {};
var hasRequiredHttpErrors;
function requireHttpErrors() {
  if (hasRequiredHttpErrors) return HttpErrors;
  hasRequiredHttpErrors = 1;
  Object.defineProperty(HttpErrors, "__esModule", { value: true });
  HttpErrors.HTTPValidationError = HttpErrors.ValidationError = HttpErrors.HttpErrorOut = void 0;
  class HttpErrorOut {
    static getAttributeTypeMap() {
      return HttpErrorOut.attributeTypeMap;
    }
  }
  HttpErrors.HttpErrorOut = HttpErrorOut;
  HttpErrorOut.discriminator = void 0;
  HttpErrorOut.mapping = void 0;
  HttpErrorOut.attributeTypeMap = [
    {
      name: "code",
      baseName: "code",
      type: "string",
      format: ""
    },
    {
      name: "detail",
      baseName: "detail",
      type: "string",
      format: ""
    }
  ];
  class ValidationError {
    static getAttributeTypeMap() {
      return ValidationError.attributeTypeMap;
    }
  }
  HttpErrors.ValidationError = ValidationError;
  ValidationError.discriminator = void 0;
  ValidationError.mapping = void 0;
  ValidationError.attributeTypeMap = [
    {
      name: "loc",
      baseName: "loc",
      type: "Array<string>",
      format: ""
    },
    {
      name: "msg",
      baseName: "msg",
      type: "string",
      format: ""
    },
    {
      name: "type",
      baseName: "type",
      type: "string",
      format: ""
    }
  ];
  class HTTPValidationError {
    static getAttributeTypeMap() {
      return HTTPValidationError.attributeTypeMap;
    }
  }
  HttpErrors.HTTPValidationError = HTTPValidationError;
  HTTPValidationError.discriminator = void 0;
  HTTPValidationError.mapping = void 0;
  HTTPValidationError.attributeTypeMap = [
    {
      name: "detail",
      baseName: "detail",
      type: "Array<ValidationError>",
      format: ""
    }
  ];
  return HttpErrors;
}
var webhook = {};
var timing_safe_equal = {};
var hasRequiredTiming_safe_equal;
function requireTiming_safe_equal() {
  if (hasRequiredTiming_safe_equal) return timing_safe_equal;
  hasRequiredTiming_safe_equal = 1;
  Object.defineProperty(timing_safe_equal, "__esModule", { value: true });
  timing_safe_equal.timingSafeEqual = void 0;
  function assert(expr, msg = "") {
    if (!expr) {
      throw new Error(msg);
    }
  }
  function timingSafeEqual(a, b) {
    if (a.byteLength !== b.byteLength) {
      return false;
    }
    if (!(a instanceof DataView)) {
      a = new DataView(ArrayBuffer.isView(a) ? a.buffer : a);
    }
    if (!(b instanceof DataView)) {
      b = new DataView(ArrayBuffer.isView(b) ? b.buffer : b);
    }
    assert(a instanceof DataView);
    assert(b instanceof DataView);
    const length = a.byteLength;
    let out = 0;
    let i = -1;
    while (++i < length) {
      out |= a.getUint8(i) ^ b.getUint8(i);
    }
    return out === 0;
  }
  timing_safe_equal.timingSafeEqual = timingSafeEqual;
  return timing_safe_equal;
}
var hasRequiredWebhook;
function requireWebhook() {
  if (hasRequiredWebhook) return webhook;
  hasRequiredWebhook = 1;
  Object.defineProperty(webhook, "__esModule", { value: true });
  webhook.Webhook = webhook.WebhookVerificationError = void 0;
  const timing_safe_equal_1 = /* @__PURE__ */ requireTiming_safe_equal();
  const base64 = /* @__PURE__ */ requireBase64();
  const sha256 = /* @__PURE__ */ requireSha256();
  const WEBHOOK_TOLERANCE_IN_SECONDS = 5 * 60;
  class ExtendableError extends Error {
    constructor(message2) {
      super(message2);
      Object.setPrototypeOf(this, ExtendableError.prototype);
      this.name = "ExtendableError";
      this.stack = new Error(message2).stack;
    }
  }
  class WebhookVerificationError extends ExtendableError {
    constructor(message2) {
      super(message2);
      Object.setPrototypeOf(this, WebhookVerificationError.prototype);
      this.name = "WebhookVerificationError";
    }
  }
  webhook.WebhookVerificationError = WebhookVerificationError;
  class Webhook {
    constructor(secret, options) {
      if (!secret) {
        throw new Error("Secret can't be empty.");
      }
      if ((options === null || options === void 0 ? void 0 : options.format) === "raw") {
        if (secret instanceof Uint8Array) {
          this.key = secret;
        } else {
          this.key = Uint8Array.from(secret, (c) => c.charCodeAt(0));
        }
      } else {
        if (typeof secret !== "string") {
          throw new Error("Expected secret to be of type string");
        }
        if (secret.startsWith(Webhook.prefix)) {
          secret = secret.substring(Webhook.prefix.length);
        }
        this.key = base64.decode(secret);
      }
    }
    verify(payload, headers_) {
      const headers = {};
      for (const key of Object.keys(headers_)) {
        headers[key.toLowerCase()] = headers_[key];
      }
      let msgId = headers["svix-id"];
      let msgSignature = headers["svix-signature"];
      let msgTimestamp = headers["svix-timestamp"];
      if (!msgSignature || !msgId || !msgTimestamp) {
        msgId = headers["webhook-id"];
        msgSignature = headers["webhook-signature"];
        msgTimestamp = headers["webhook-timestamp"];
        if (!msgSignature || !msgId || !msgTimestamp) {
          throw new WebhookVerificationError("Missing required headers");
        }
      }
      const timestamp = this.verifyTimestamp(msgTimestamp);
      const computedSignature = this.sign(msgId, timestamp, payload);
      const expectedSignature = computedSignature.split(",")[1];
      const passedSignatures = msgSignature.split(" ");
      const encoder = new globalThis.TextEncoder();
      for (const versionedSignature of passedSignatures) {
        const [version, signature] = versionedSignature.split(",");
        if (version !== "v1") {
          continue;
        }
        if ((0, timing_safe_equal_1.timingSafeEqual)(encoder.encode(signature), encoder.encode(expectedSignature))) {
          return JSON.parse(payload.toString());
        }
      }
      throw new WebhookVerificationError("No matching signature found");
    }
    sign(msgId, timestamp, payload) {
      if (typeof payload === "string") ;
      else if (payload.constructor.name === "Buffer") {
        payload = payload.toString();
      } else {
        throw new Error("Expected payload to be of type string or Buffer. Please refer to https://docs.svix.com/receiving/verifying-payloads/how for more information.");
      }
      const encoder = new TextEncoder();
      const timestampNumber = Math.floor(timestamp.getTime() / 1e3);
      const toSign = encoder.encode(`${msgId}.${timestampNumber}.${payload}`);
      const expectedSignature = base64.encode(sha256.hmac(this.key, toSign));
      return `v1,${expectedSignature}`;
    }
    verifyTimestamp(timestampHeader) {
      const now = Math.floor(Date.now() / 1e3);
      const timestamp = parseInt(timestampHeader, 10);
      if (isNaN(timestamp)) {
        throw new WebhookVerificationError("Invalid Signature Headers");
      }
      if (now - timestamp > WEBHOOK_TOLERANCE_IN_SECONDS) {
        throw new WebhookVerificationError("Message timestamp too old");
      }
      if (timestamp > now + WEBHOOK_TOLERANCE_IN_SECONDS) {
        throw new WebhookVerificationError("Message timestamp too new");
      }
      return new Date(timestamp * 1e3);
    }
  }
  webhook.Webhook = Webhook;
  Webhook.prefix = "whsec_";
  return webhook;
}
var models = {};
var endpointDisabledTrigger = {};
var hasRequiredEndpointDisabledTrigger;
function requireEndpointDisabledTrigger() {
  if (hasRequiredEndpointDisabledTrigger) return endpointDisabledTrigger;
  hasRequiredEndpointDisabledTrigger = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.EndpointDisabledTriggerSerializer = exports$1.EndpointDisabledTrigger = void 0;
    (function(EndpointDisabledTrigger) {
      EndpointDisabledTrigger["Manual"] = "manual";
      EndpointDisabledTrigger["Automatic"] = "automatic";
    })(exports$1.EndpointDisabledTrigger || (exports$1.EndpointDisabledTrigger = {}));
    exports$1.EndpointDisabledTriggerSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  })(endpointDisabledTrigger);
  return endpointDisabledTrigger;
}
var ordering = {};
var hasRequiredOrdering;
function requireOrdering() {
  if (hasRequiredOrdering) return ordering;
  hasRequiredOrdering = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.OrderingSerializer = exports$1.Ordering = void 0;
    (function(Ordering) {
      Ordering["Ascending"] = "ascending";
      Ordering["Descending"] = "descending";
    })(exports$1.Ordering || (exports$1.Ordering = {}));
    exports$1.OrderingSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  })(ordering);
  return ordering;
}
var statusCodeClass = {};
var hasRequiredStatusCodeClass;
function requireStatusCodeClass() {
  if (hasRequiredStatusCodeClass) return statusCodeClass;
  hasRequiredStatusCodeClass = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.StatusCodeClassSerializer = exports$1.StatusCodeClass = void 0;
    (function(StatusCodeClass) {
      StatusCodeClass[StatusCodeClass["CodeNone"] = 0] = "CodeNone";
      StatusCodeClass[StatusCodeClass["Code1xx"] = 100] = "Code1xx";
      StatusCodeClass[StatusCodeClass["Code2xx"] = 200] = "Code2xx";
      StatusCodeClass[StatusCodeClass["Code3xx"] = 300] = "Code3xx";
      StatusCodeClass[StatusCodeClass["Code4xx"] = 400] = "Code4xx";
      StatusCodeClass[StatusCodeClass["Code5xx"] = 500] = "Code5xx";
    })(exports$1.StatusCodeClass || (exports$1.StatusCodeClass = {}));
    exports$1.StatusCodeClassSerializer = {
      _fromJsonObject(object) {
        return object;
      },
      _toJsonObject(self) {
        return self;
      }
    };
  })(statusCodeClass);
  return statusCodeClass;
}
var hasRequiredModels;
function requireModels() {
  if (hasRequiredModels) return models;
  hasRequiredModels = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.StatusCodeClass = exports$1.Ordering = exports$1.MessageStatusText = exports$1.MessageStatus = exports$1.MessageAttemptTriggerType = exports$1.EndpointDisabledTrigger = exports$1.ConnectorKind = exports$1.BackgroundTaskType = exports$1.BackgroundTaskStatus = exports$1.AppPortalCapability = void 0;
    var appPortalCapability_1 = /* @__PURE__ */ requireAppPortalCapability();
    Object.defineProperty(exports$1, "AppPortalCapability", { enumerable: true, get: function() {
      return appPortalCapability_1.AppPortalCapability;
    } });
    var backgroundTaskStatus_1 = /* @__PURE__ */ requireBackgroundTaskStatus();
    Object.defineProperty(exports$1, "BackgroundTaskStatus", { enumerable: true, get: function() {
      return backgroundTaskStatus_1.BackgroundTaskStatus;
    } });
    var backgroundTaskType_1 = /* @__PURE__ */ requireBackgroundTaskType();
    Object.defineProperty(exports$1, "BackgroundTaskType", { enumerable: true, get: function() {
      return backgroundTaskType_1.BackgroundTaskType;
    } });
    var connectorKind_1 = /* @__PURE__ */ requireConnectorKind();
    Object.defineProperty(exports$1, "ConnectorKind", { enumerable: true, get: function() {
      return connectorKind_1.ConnectorKind;
    } });
    var endpointDisabledTrigger_1 = /* @__PURE__ */ requireEndpointDisabledTrigger();
    Object.defineProperty(exports$1, "EndpointDisabledTrigger", { enumerable: true, get: function() {
      return endpointDisabledTrigger_1.EndpointDisabledTrigger;
    } });
    var messageAttemptTriggerType_1 = /* @__PURE__ */ requireMessageAttemptTriggerType();
    Object.defineProperty(exports$1, "MessageAttemptTriggerType", { enumerable: true, get: function() {
      return messageAttemptTriggerType_1.MessageAttemptTriggerType;
    } });
    var messageStatus_1 = /* @__PURE__ */ requireMessageStatus();
    Object.defineProperty(exports$1, "MessageStatus", { enumerable: true, get: function() {
      return messageStatus_1.MessageStatus;
    } });
    var messageStatusText_1 = /* @__PURE__ */ requireMessageStatusText();
    Object.defineProperty(exports$1, "MessageStatusText", { enumerable: true, get: function() {
      return messageStatusText_1.MessageStatusText;
    } });
    var ordering_1 = /* @__PURE__ */ requireOrdering();
    Object.defineProperty(exports$1, "Ordering", { enumerable: true, get: function() {
      return ordering_1.Ordering;
    } });
    var statusCodeClass_1 = /* @__PURE__ */ requireStatusCodeClass();
    Object.defineProperty(exports$1, "StatusCodeClass", { enumerable: true, get: function() {
      return statusCodeClass_1.StatusCodeClass;
    } });
  })(models);
  return models;
}
var hasRequiredDist;
function requireDist() {
  if (hasRequiredDist) return dist;
  hasRequiredDist = 1;
  (function(exports$1) {
    var __createBinding = dist && dist.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = dist && dist.__exportStar || function(m, exports$12) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$12, p)) __createBinding(exports$12, m, p);
    };
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.Svix = exports$1.messageInRaw = exports$1.ValidationError = exports$1.HttpErrorOut = exports$1.HTTPValidationError = exports$1.ApiException = void 0;
    const application_1 = /* @__PURE__ */ requireApplication();
    const authentication_1 = /* @__PURE__ */ requireAuthentication();
    const backgroundTask_1 = /* @__PURE__ */ requireBackgroundTask();
    const endpoint_1 = /* @__PURE__ */ requireEndpoint();
    const environment_1 = /* @__PURE__ */ requireEnvironment();
    const eventType_1 = /* @__PURE__ */ requireEventType();
    const health_1 = /* @__PURE__ */ requireHealth();
    const ingest_1 = /* @__PURE__ */ requireIngest();
    const integration_1 = /* @__PURE__ */ requireIntegration();
    const message_1 = /* @__PURE__ */ requireMessage();
    const messageAttempt_1 = /* @__PURE__ */ requireMessageAttempt();
    const operationalWebhook_1 = /* @__PURE__ */ requireOperationalWebhook();
    const statistics_1 = /* @__PURE__ */ requireStatistics();
    const operationalWebhookEndpoint_1 = /* @__PURE__ */ requireOperationalWebhookEndpoint();
    var util_1 = /* @__PURE__ */ requireUtil();
    Object.defineProperty(exports$1, "ApiException", { enumerable: true, get: function() {
      return util_1.ApiException;
    } });
    var HttpErrors_1 = /* @__PURE__ */ requireHttpErrors();
    Object.defineProperty(exports$1, "HTTPValidationError", { enumerable: true, get: function() {
      return HttpErrors_1.HTTPValidationError;
    } });
    Object.defineProperty(exports$1, "HttpErrorOut", { enumerable: true, get: function() {
      return HttpErrors_1.HttpErrorOut;
    } });
    Object.defineProperty(exports$1, "ValidationError", { enumerable: true, get: function() {
      return HttpErrors_1.ValidationError;
    } });
    __exportStar(/* @__PURE__ */ requireWebhook(), exports$1);
    __exportStar(/* @__PURE__ */ requireModels(), exports$1);
    var message_2 = /* @__PURE__ */ requireMessage();
    Object.defineProperty(exports$1, "messageInRaw", { enumerable: true, get: function() {
      return message_2.messageInRaw;
    } });
    const REGIONS = [
      { region: "us", url: "https://api.us.svix.com" },
      { region: "eu", url: "https://api.eu.svix.com" },
      { region: "in", url: "https://api.in.svix.com" },
      { region: "ca", url: "https://api.ca.svix.com" },
      { region: "au", url: "https://api.au.svix.com" }
    ];
    class Svix {
      constructor(token, options = {}) {
        var _a, _b, _c;
        const regionalUrl = (_a = REGIONS.find((x) => x.region === token.split(".")[1])) === null || _a === void 0 ? void 0 : _a.url;
        const baseUrl = (_c = (_b = options.serverUrl) !== null && _b !== void 0 ? _b : regionalUrl) !== null && _c !== void 0 ? _c : "https://api.svix.com";
        if (options.retryScheduleInMs) {
          this.requestCtx = {
            baseUrl,
            token,
            timeout: options.requestTimeout,
            retryScheduleInMs: options.retryScheduleInMs
          };
          return;
        }
        if (options.numRetries) {
          this.requestCtx = {
            baseUrl,
            token,
            timeout: options.requestTimeout,
            numRetries: options.numRetries
          };
          return;
        }
        this.requestCtx = {
          baseUrl,
          token,
          timeout: options.requestTimeout
        };
      }
      get application() {
        return new application_1.Application(this.requestCtx);
      }
      get authentication() {
        return new authentication_1.Authentication(this.requestCtx);
      }
      get backgroundTask() {
        return new backgroundTask_1.BackgroundTask(this.requestCtx);
      }
      get endpoint() {
        return new endpoint_1.Endpoint(this.requestCtx);
      }
      get environment() {
        return new environment_1.Environment(this.requestCtx);
      }
      get eventType() {
        return new eventType_1.EventType(this.requestCtx);
      }
      get health() {
        return new health_1.Health(this.requestCtx);
      }
      get ingest() {
        return new ingest_1.Ingest(this.requestCtx);
      }
      get integration() {
        return new integration_1.Integration(this.requestCtx);
      }
      get message() {
        return new message_1.Message(this.requestCtx);
      }
      get messageAttempt() {
        return new messageAttempt_1.MessageAttempt(this.requestCtx);
      }
      get operationalWebhook() {
        return new operationalWebhook_1.OperationalWebhook(this.requestCtx);
      }
      get statistics() {
        return new statistics_1.Statistics(this.requestCtx);
      }
      get operationalWebhookEndpoint() {
        return new operationalWebhookEndpoint_1.OperationalWebhookEndpoint(this.requestCtx);
      }
    }
    exports$1.Svix = Svix;
  })(dist);
  return dist;
}
var distExports = /* @__PURE__ */ requireDist();
export {
  distExports as d
};
