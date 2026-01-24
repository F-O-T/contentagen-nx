import { d as distExports } from "./svix.mjs";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var version = "6.4.2";
function buildPaginationQuery(options) {
  const searchParams = new URLSearchParams();
  if (options.limit !== void 0) {
    searchParams.set("limit", options.limit.toString());
  }
  if ("after" in options && options.after !== void 0) {
    searchParams.set("after", options.after);
  }
  if ("before" in options && options.before !== void 0) {
    searchParams.set("before", options.before);
  }
  return searchParams.toString();
}
var ApiKeys = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    const data = await this.resend.post(
      "/api-keys",
      payload,
      options
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/api-keys?${queryString}` : "/api-keys";
    const data = await this.resend.get(url);
    return data;
  }
  async remove(id) {
    const data = await this.resend.delete(
      `/api-keys/${id}`
    );
    return data;
  }
};
function parseAttachments(attachments) {
  return attachments == null ? void 0 : attachments.map((attachment) => ({
    content: attachment.content,
    filename: attachment.filename,
    path: attachment.path,
    content_type: attachment.contentType,
    content_id: attachment.contentId
  }));
}
function parseEmailToApiOptions(email) {
  return {
    attachments: parseAttachments(email.attachments),
    bcc: email.bcc,
    cc: email.cc,
    from: email.from,
    headers: email.headers,
    html: email.html,
    reply_to: email.replyTo,
    scheduled_at: email.scheduledAt,
    subject: email.subject,
    tags: email.tags,
    text: email.text,
    to: email.to,
    template: email.template ? {
      id: email.template.id,
      variables: email.template.variables
    } : void 0,
    topic_id: email.topicId
  };
}
async function render(node) {
  let render2;
  try {
    ({ render: render2 } = await import("../_chunks/_libs/@react-email/render.mjs"));
  } catch (e) {
    throw new Error(
      "Failed to render React component. Make sure to install `@react-email/render` or `@react-email/components`."
    );
  }
  return render2(node);
}
var Batch = class {
  constructor(resend) {
    this.resend = resend;
  }
  async send(payload, options) {
    return this.create(payload, options);
  }
  async create(payload, options) {
    var _a;
    const emails = [];
    for (const email of payload) {
      if (email.react) {
        email.html = await render(email.react);
        email.react = void 0;
      }
      emails.push(parseEmailToApiOptions(email));
    }
    const data = await this.resend.post(
      "/emails/batch",
      emails,
      __spreadProps(__spreadValues({}, options), {
        headers: __spreadValues({
          "x-batch-validation": (_a = options == null ? void 0 : options.batchValidation) != null ? _a : "strict"
        }, options == null ? void 0 : options.headers)
      })
    );
    return data;
  }
};
var Broadcasts = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    if (payload.react) {
      payload.html = await render(payload.react);
    }
    const data = await this.resend.post(
      "/broadcasts",
      {
        name: payload.name,
        segment_id: payload.segmentId,
        audience_id: payload.audienceId,
        preview_text: payload.previewText,
        from: payload.from,
        html: payload.html,
        reply_to: payload.replyTo,
        subject: payload.subject,
        text: payload.text,
        topic_id: payload.topicId
      },
      options
    );
    return data;
  }
  async send(id, payload) {
    const data = await this.resend.post(
      `/broadcasts/${id}/send`,
      { scheduled_at: payload == null ? void 0 : payload.scheduledAt }
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/broadcasts?${queryString}` : "/broadcasts";
    const data = await this.resend.get(url);
    return data;
  }
  async get(id) {
    const data = await this.resend.get(
      `/broadcasts/${id}`
    );
    return data;
  }
  async remove(id) {
    const data = await this.resend.delete(
      `/broadcasts/${id}`
    );
    return data;
  }
  async update(id, payload) {
    if (payload.react) {
      payload.html = await render(payload.react);
    }
    const data = await this.resend.patch(
      `/broadcasts/${id}`,
      {
        name: payload.name,
        segment_id: payload.segmentId,
        audience_id: payload.audienceId,
        from: payload.from,
        html: payload.html,
        text: payload.text,
        subject: payload.subject,
        reply_to: payload.replyTo,
        preview_text: payload.previewText,
        topic_id: payload.topicId
      }
    );
    return data;
  }
};
function parseContactPropertyFromApi(contactProperty) {
  return {
    id: contactProperty.id,
    key: contactProperty.key,
    createdAt: contactProperty.created_at,
    type: contactProperty.type,
    fallbackValue: contactProperty.fallback_value
  };
}
function parseContactPropertyToApiOptions(contactProperty) {
  if ("key" in contactProperty) {
    return {
      key: contactProperty.key,
      type: contactProperty.type,
      fallback_value: contactProperty.fallbackValue
    };
  }
  return {
    fallback_value: contactProperty.fallbackValue
  };
}
var ContactProperties = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(options) {
    const apiOptions = parseContactPropertyToApiOptions(options);
    const data = await this.resend.post(
      "/contact-properties",
      apiOptions
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/contact-properties?${queryString}` : "/contact-properties";
    const response = await this.resend.get(url);
    if (response.data) {
      return {
        data: __spreadProps(__spreadValues({}, response.data), {
          data: response.data.data.map(
            (apiContactProperty) => parseContactPropertyFromApi(apiContactProperty)
          )
        }),
        headers: response.headers,
        error: null
      };
    }
    return response;
  }
  async get(id) {
    if (!id) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const response = await this.resend.get(
      `/contact-properties/${id}`
    );
    if (response.data) {
      return {
        data: __spreadValues({
          object: "contact_property"
        }, parseContactPropertyFromApi(response.data)),
        headers: response.headers,
        error: null
      };
    }
    return response;
  }
  async update(payload) {
    if (!payload.id) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const apiOptions = parseContactPropertyToApiOptions(payload);
    const data = await this.resend.patch(
      `/contact-properties/${payload.id}`,
      apiOptions
    );
    return data;
  }
  async remove(id) {
    if (!id) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const data = await this.resend.delete(
      `/contact-properties/${id}`
    );
    return data;
  }
};
var ContactSegments = class {
  constructor(resend) {
    this.resend = resend;
  }
  async list(options) {
    if (!options.contactId && !options.email) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const identifier = options.email ? options.email : options.contactId;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/contacts/${identifier}/segments?${queryString}` : `/contacts/${identifier}/segments`;
    const data = await this.resend.get(url);
    return data;
  }
  async add(options) {
    if (!options.contactId && !options.email) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const identifier = options.email ? options.email : options.contactId;
    return this.resend.post(
      `/contacts/${identifier}/segments/${options.segmentId}`
    );
  }
  async remove(options) {
    if (!options.contactId && !options.email) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const identifier = options.email ? options.email : options.contactId;
    return this.resend.delete(
      `/contacts/${identifier}/segments/${options.segmentId}`
    );
  }
};
var ContactTopics = class {
  constructor(resend) {
    this.resend = resend;
  }
  async update(payload) {
    if (!payload.id && !payload.email) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const identifier = payload.email ? payload.email : payload.id;
    return this.resend.patch(
      `/contacts/${identifier}/topics`,
      payload.topics
    );
  }
  async list(options) {
    if (!options.id && !options.email) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const identifier = options.email ? options.email : options.id;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/contacts/${identifier}/topics?${queryString}` : `/contacts/${identifier}/topics`;
    return this.resend.get(url);
  }
};
var Contacts = class {
  constructor(resend) {
    this.resend = resend;
    this.topics = new ContactTopics(this.resend);
    this.segments = new ContactSegments(this.resend);
  }
  async create(payload, options = {}) {
    if (!payload.audienceId) {
      const data2 = await this.resend.post(
        "/contacts",
        {
          unsubscribed: payload.unsubscribed,
          email: payload.email,
          first_name: payload.firstName,
          last_name: payload.lastName,
          properties: payload.properties
        },
        options
      );
      return data2;
    }
    const data = await this.resend.post(
      `/audiences/${payload.audienceId}/contacts`,
      {
        unsubscribed: payload.unsubscribed,
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        properties: payload.properties
      },
      options
    );
    return data;
  }
  async list(options = {}) {
    var _a;
    const segmentId = (_a = options.segmentId) != null ? _a : options.audienceId;
    if (!segmentId) {
      const queryString2 = buildPaginationQuery(options);
      const url2 = queryString2 ? `/contacts?${queryString2}` : "/contacts";
      const data2 = await this.resend.get(url2);
      return data2;
    }
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/segments/${segmentId}/contacts?${queryString}` : `/segments/${segmentId}/contacts`;
    const data = await this.resend.get(url);
    return data;
  }
  async get(options) {
    if (typeof options === "string") {
      return this.resend.get(`/contacts/${options}`);
    }
    if (!options.id && !options.email) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    if (!options.audienceId) {
      return this.resend.get(
        `/contacts/${(options == null ? void 0 : options.email) ? options == null ? void 0 : options.email : options == null ? void 0 : options.id}`
      );
    }
    return this.resend.get(
      `/audiences/${options.audienceId}/contacts/${(options == null ? void 0 : options.email) ? options == null ? void 0 : options.email : options == null ? void 0 : options.id}`
    );
  }
  async update(options) {
    if (!options.id && !options.email) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    if (!options.audienceId) {
      const data2 = await this.resend.patch(
        `/contacts/${(options == null ? void 0 : options.email) ? options == null ? void 0 : options.email : options == null ? void 0 : options.id}`,
        {
          unsubscribed: options.unsubscribed,
          first_name: options.firstName,
          last_name: options.lastName,
          properties: options.properties
        }
      );
      return data2;
    }
    const data = await this.resend.patch(
      `/audiences/${options.audienceId}/contacts/${(options == null ? void 0 : options.email) ? options == null ? void 0 : options.email : options == null ? void 0 : options.id}`,
      {
        unsubscribed: options.unsubscribed,
        first_name: options.firstName,
        last_name: options.lastName,
        properties: options.properties
      }
    );
    return data;
  }
  async remove(payload) {
    if (typeof payload === "string") {
      return this.resend.delete(
        `/contacts/${payload}`
      );
    }
    if (!payload.id && !payload.email) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` or `email` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    if (!payload.audienceId) {
      return this.resend.delete(
        `/contacts/${(payload == null ? void 0 : payload.email) ? payload == null ? void 0 : payload.email : payload == null ? void 0 : payload.id}`
      );
    }
    return this.resend.delete(
      `/audiences/${payload.audienceId}/contacts/${(payload == null ? void 0 : payload.email) ? payload == null ? void 0 : payload.email : payload == null ? void 0 : payload.id}`
    );
  }
};
function parseDomainToApiOptions(domain) {
  return {
    name: domain.name,
    region: domain.region,
    custom_return_path: domain.customReturnPath
  };
}
var Domains = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    const data = await this.resend.post(
      "/domains",
      parseDomainToApiOptions(payload),
      options
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/domains?${queryString}` : "/domains";
    const data = await this.resend.get(url);
    return data;
  }
  async get(id) {
    const data = await this.resend.get(
      `/domains/${id}`
    );
    return data;
  }
  async update(payload) {
    const data = await this.resend.patch(
      `/domains/${payload.id}`,
      {
        click_tracking: payload.clickTracking,
        open_tracking: payload.openTracking,
        tls: payload.tls
      }
    );
    return data;
  }
  async remove(id) {
    const data = await this.resend.delete(
      `/domains/${id}`
    );
    return data;
  }
  async verify(id) {
    const data = await this.resend.post(
      `/domains/${id}/verify`
    );
    return data;
  }
};
var Attachments = class {
  constructor(resend) {
    this.resend = resend;
  }
  async get(options) {
    const { emailId, id } = options;
    const data = await this.resend.get(
      `/emails/${emailId}/attachments/${id}`
    );
    return data;
  }
  async list(options) {
    const { emailId } = options;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails/${emailId}/attachments?${queryString}` : `/emails/${emailId}/attachments`;
    const data = await this.resend.get(url);
    return data;
  }
};
var Attachments2 = class {
  constructor(resend) {
    this.resend = resend;
  }
  async get(options) {
    const { emailId, id } = options;
    const data = await this.resend.get(
      `/emails/receiving/${emailId}/attachments/${id}`
    );
    return data;
  }
  async list(options) {
    const { emailId } = options;
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails/receiving/${emailId}/attachments?${queryString}` : `/emails/receiving/${emailId}/attachments`;
    const data = await this.resend.get(url);
    return data;
  }
};
var Receiving = class {
  constructor(resend) {
    this.resend = resend;
    this.attachments = new Attachments2(resend);
  }
  async get(id) {
    const data = await this.resend.get(
      `/emails/receiving/${id}`
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails/receiving?${queryString}` : "/emails/receiving";
    const data = await this.resend.get(url);
    return data;
  }
};
var Emails = class {
  constructor(resend) {
    this.resend = resend;
    this.attachments = new Attachments(resend);
    this.receiving = new Receiving(resend);
  }
  async send(payload, options = {}) {
    return this.create(payload, options);
  }
  async create(payload, options = {}) {
    if (payload.react) {
      payload.html = await render(payload.react);
    }
    const data = await this.resend.post(
      "/emails",
      parseEmailToApiOptions(payload),
      options
    );
    return data;
  }
  async get(id) {
    const data = await this.resend.get(
      `/emails/${id}`
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/emails?${queryString}` : "/emails";
    const data = await this.resend.get(url);
    return data;
  }
  async update(payload) {
    const data = await this.resend.patch(
      `/emails/${payload.id}`,
      {
        scheduled_at: payload.scheduledAt
      }
    );
    return data;
  }
  async cancel(id) {
    const data = await this.resend.post(
      `/emails/${id}/cancel`
    );
    return data;
  }
};
var Segments = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    const data = await this.resend.post(
      "/segments",
      payload,
      options
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/segments?${queryString}` : "/segments";
    const data = await this.resend.get(url);
    return data;
  }
  async get(id) {
    const data = await this.resend.get(
      `/segments/${id}`
    );
    return data;
  }
  async remove(id) {
    const data = await this.resend.delete(
      `/segments/${id}`
    );
    return data;
  }
};
function getPaginationQueryProperties(options = {}) {
  const query = new URLSearchParams();
  if (options.before) query.set("before", options.before);
  if (options.after) query.set("after", options.after);
  if (options.limit) query.set("limit", options.limit.toString());
  return query.size > 0 ? `?${query.toString()}` : "";
}
function parseVariables(variables) {
  return variables == null ? void 0 : variables.map((variable) => ({
    key: variable.key,
    type: variable.type,
    fallback_value: variable.fallbackValue
  }));
}
function parseTemplateToApiOptions(template) {
  return {
    name: "name" in template ? template.name : void 0,
    subject: template.subject,
    html: template.html,
    text: template.text,
    alias: template.alias,
    from: template.from,
    reply_to: template.replyTo,
    variables: parseVariables(template.variables)
  };
}
var ChainableTemplateResult = class {
  constructor(promise, publishFn) {
    this.promise = promise;
    this.publishFn = publishFn;
  }
  // If user calls `then` or only awaits for the result of create() or duplicate(), the behavior should be
  // exactly as if they called create() or duplicate() directly. This will act as a normal promise
  // biome-ignore lint/suspicious/noThenProperty: This class intentionally implements PromiseLike
  then(onfulfilled, onrejected) {
    return this.promise.then(onfulfilled, onrejected);
  }
  async publish() {
    const { data, error } = await this.promise;
    if (error) {
      return {
        data: null,
        headers: null,
        error
      };
    }
    return this.publishFn(data.id);
  }
};
var Templates = class {
  constructor(resend) {
    this.resend = resend;
  }
  create(payload) {
    const createPromise = this.performCreate(payload);
    return new ChainableTemplateResult(createPromise, this.publish.bind(this));
  }
  // This creation process is being done separately from the public create so that
  // the user can chain the publish operation after the create operation. Otherwise, due
  // to the async nature of the renderAsync, the return type would be
  // Promise<ChainableTemplateResult<CreateTemplateResponse>> which wouldn't be chainable.
  async performCreate(payload) {
    if (payload.react) {
      if (!this.renderAsync) {
        try {
          const { renderAsync } = await import("../_chunks/_libs/@react-email/render.mjs");
          this.renderAsync = renderAsync;
        } catch (e) {
          throw new Error(
            "Failed to render React component. Make sure to install `@react-email/render`"
          );
        }
      }
      payload.html = await this.renderAsync(
        payload.react
      );
    }
    return this.resend.post(
      "/templates",
      parseTemplateToApiOptions(payload)
    );
  }
  async remove(identifier) {
    const data = await this.resend.delete(
      `/templates/${identifier}`
    );
    return data;
  }
  async get(identifier) {
    const data = await this.resend.get(
      `/templates/${identifier}`
    );
    return data;
  }
  async list(options = {}) {
    return this.resend.get(
      `/templates${getPaginationQueryProperties(options)}`
    );
  }
  duplicate(identifier) {
    const promiseDuplicate = this.resend.post(
      `/templates/${identifier}/duplicate`
    );
    return new ChainableTemplateResult(
      promiseDuplicate,
      this.publish.bind(this)
    );
  }
  async publish(identifier) {
    const data = await this.resend.post(
      `/templates/${identifier}/publish`
    );
    return data;
  }
  async update(identifier, payload) {
    const data = await this.resend.patch(
      `/templates/${identifier}`,
      parseTemplateToApiOptions(payload)
    );
    return data;
  }
};
var Topics = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload) {
    const _a = payload, { defaultSubscription } = _a, body = __objRest(_a, ["defaultSubscription"]);
    const data = await this.resend.post("/topics", __spreadProps(__spreadValues({}, body), {
      default_subscription: defaultSubscription
    }));
    return data;
  }
  async list() {
    const data = await this.resend.get("/topics");
    return data;
  }
  async get(id) {
    if (!id) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const data = await this.resend.get(
      `/topics/${id}`
    );
    return data;
  }
  async update(payload) {
    if (!payload.id) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const data = await this.resend.patch(
      `/topics/${payload.id}`,
      payload
    );
    return data;
  }
  async remove(id) {
    if (!id) {
      return {
        data: null,
        headers: null,
        error: {
          message: "Missing `id` field.",
          statusCode: null,
          name: "missing_required_field"
        }
      };
    }
    const data = await this.resend.delete(
      `/topics/${id}`
    );
    return data;
  }
};
var Webhooks = class {
  constructor(resend) {
    this.resend = resend;
  }
  async create(payload, options = {}) {
    const data = await this.resend.post(
      "/webhooks",
      payload,
      options
    );
    return data;
  }
  async get(id) {
    const data = await this.resend.get(
      `/webhooks/${id}`
    );
    return data;
  }
  async list(options = {}) {
    const queryString = buildPaginationQuery(options);
    const url = queryString ? `/webhooks?${queryString}` : "/webhooks";
    const data = await this.resend.get(url);
    return data;
  }
  async update(id, payload) {
    const data = await this.resend.patch(
      `/webhooks/${id}`,
      payload
    );
    return data;
  }
  async remove(id) {
    const data = await this.resend.delete(
      `/webhooks/${id}`
    );
    return data;
  }
  verify(payload) {
    const webhook = new distExports.Webhook(payload.webhookSecret);
    return webhook.verify(payload.payload, {
      "svix-id": payload.headers.id,
      "svix-timestamp": payload.headers.timestamp,
      "svix-signature": payload.headers.signature
    });
  }
};
var defaultBaseUrl = "https://api.resend.com";
var defaultUserAgent = `resend-node:${version}`;
var baseUrl = typeof process !== "undefined" && process.env ? process.env.RESEND_BASE_URL || defaultBaseUrl : defaultBaseUrl;
var userAgent = typeof process !== "undefined" && process.env ? process.env.RESEND_USER_AGENT || defaultUserAgent : defaultUserAgent;
var Resend = class {
  constructor(key) {
    this.key = key;
    this.apiKeys = new ApiKeys(this);
    this.segments = new Segments(this);
    this.audiences = this.segments;
    this.batch = new Batch(this);
    this.broadcasts = new Broadcasts(this);
    this.contacts = new Contacts(this);
    this.contactProperties = new ContactProperties(this);
    this.domains = new Domains(this);
    this.emails = new Emails(this);
    this.webhooks = new Webhooks(this);
    this.templates = new Templates(this);
    this.topics = new Topics(this);
    if (!key) {
      if (typeof process !== "undefined" && process.env) {
        this.key = process.env.RESEND_API_KEY;
      }
      if (!this.key) {
        throw new Error(
          'Missing API key. Pass it to the constructor `new Resend("re_123")`'
        );
      }
    }
    this.headers = new Headers({
      Authorization: `Bearer ${this.key}`,
      "User-Agent": userAgent,
      "Content-Type": "application/json"
    });
  }
  async fetchRequest(path, options = {}) {
    try {
      const response = await fetch(`${baseUrl}${path}`, options);
      if (!response.ok) {
        try {
          const rawError = await response.text();
          return {
            data: null,
            error: JSON.parse(rawError),
            headers: Object.fromEntries(response.headers.entries())
          };
        } catch (err) {
          if (err instanceof SyntaxError) {
            return {
              data: null,
              error: {
                name: "application_error",
                statusCode: response.status,
                message: "Internal server error. We are unable to process your request right now, please try again later."
              },
              headers: Object.fromEntries(response.headers.entries())
            };
          }
          const error = {
            message: response.statusText,
            statusCode: response.status,
            name: "application_error"
          };
          if (err instanceof Error) {
            return {
              data: null,
              error: __spreadProps(__spreadValues({}, error), { message: err.message }),
              headers: Object.fromEntries(response.headers.entries())
            };
          }
          return {
            data: null,
            error,
            headers: Object.fromEntries(response.headers.entries())
          };
        }
      }
      const data = await response.json();
      return {
        data,
        error: null,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (e) {
      return {
        data: null,
        error: {
          name: "application_error",
          statusCode: null,
          message: "Unable to fetch data. The request could not be resolved."
        },
        headers: null
      };
    }
  }
  async post(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) {
      for (const [key, value] of new Headers(options.headers).entries()) {
        headers.set(key, value);
      }
    }
    if (options.idempotencyKey) {
      headers.set("Idempotency-Key", options.idempotencyKey);
    }
    const requestOptions = __spreadProps(__spreadValues({
      method: "POST",
      body: JSON.stringify(entity)
    }, options), {
      headers
    });
    return this.fetchRequest(path, requestOptions);
  }
  async get(path, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) {
      for (const [key, value] of new Headers(options.headers).entries()) {
        headers.set(key, value);
      }
    }
    const requestOptions = __spreadProps(__spreadValues({
      method: "GET"
    }, options), {
      headers
    });
    return this.fetchRequest(path, requestOptions);
  }
  async put(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) {
      for (const [key, value] of new Headers(options.headers).entries()) {
        headers.set(key, value);
      }
    }
    const requestOptions = __spreadProps(__spreadValues({
      method: "PUT",
      body: JSON.stringify(entity)
    }, options), {
      headers
    });
    return this.fetchRequest(path, requestOptions);
  }
  async patch(path, entity, options = {}) {
    const headers = new Headers(this.headers);
    if (options.headers) {
      for (const [key, value] of new Headers(options.headers).entries()) {
        headers.set(key, value);
      }
    }
    const requestOptions = __spreadProps(__spreadValues({
      method: "PATCH",
      body: JSON.stringify(entity)
    }, options), {
      headers
    });
    return this.fetchRequest(path, requestOptions);
  }
  async delete(path, query) {
    const requestOptions = {
      method: "DELETE",
      body: JSON.stringify(query),
      headers: this.headers
    };
    return this.fetchRequest(path, requestOptions);
  }
};
export {
  Resend as R
};
