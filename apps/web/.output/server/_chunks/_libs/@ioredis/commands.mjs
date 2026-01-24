var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, "__esModule")) return n;
  var f = n.default;
  if (typeof f == "function") {
    var a = function a2() {
      var isInstance = false;
      try {
        isInstance = this instanceof a2;
      } catch {
      }
      if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor);
      }
      return f.apply(this, arguments);
    };
    a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
var built = {};
const acl = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const append = { "arity": 3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const asking = { "arity": 1, "flags": ["fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const auth = { "arity": -2, "flags": ["noscript", "loading", "stale", "fast", "no_auth", "allow_busy"], "keyStart": 0, "keyStop": 0, "step": 0 };
const bgrewriteaof = { "arity": 1, "flags": ["admin", "noscript", "no_async_loading"], "keyStart": 0, "keyStop": 0, "step": 0 };
const bgsave = { "arity": -1, "flags": ["admin", "noscript", "no_async_loading"], "keyStart": 0, "keyStop": 0, "step": 0 };
const bitcount = { "arity": -2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const bitfield = { "arity": -2, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 1, "step": 1 };
const bitfield_ro = { "arity": -2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const bitop = { "arity": -4, "flags": ["write", "denyoom"], "keyStart": 2, "keyStop": -1, "step": 1 };
const bitpos = { "arity": -3, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const blmove = { "arity": 6, "flags": ["write", "denyoom", "noscript", "blocking"], "keyStart": 1, "keyStop": 2, "step": 1 };
const blmpop = { "arity": -5, "flags": ["write", "blocking", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const blpop = { "arity": -3, "flags": ["write", "noscript", "blocking"], "keyStart": 1, "keyStop": -2, "step": 1 };
const brpop = { "arity": -3, "flags": ["write", "noscript", "blocking"], "keyStart": 1, "keyStop": -2, "step": 1 };
const brpoplpush = { "arity": 4, "flags": ["write", "denyoom", "noscript", "blocking"], "keyStart": 1, "keyStop": 2, "step": 1 };
const bzmpop = { "arity": -5, "flags": ["write", "blocking", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const bzpopmax = { "arity": -3, "flags": ["write", "noscript", "blocking", "fast"], "keyStart": 1, "keyStop": -2, "step": 1 };
const bzpopmin = { "arity": -3, "flags": ["write", "noscript", "blocking", "fast"], "keyStart": 1, "keyStop": -2, "step": 1 };
const client = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const cluster = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const command = { "arity": -1, "flags": ["loading", "stale"], "keyStart": 0, "keyStop": 0, "step": 0 };
const config = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const copy = { "arity": -3, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 2, "step": 1 };
const dbsize = { "arity": 1, "flags": ["readonly", "fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const debug = { "arity": -2, "flags": ["admin", "noscript", "loading", "stale"], "keyStart": 0, "keyStop": 0, "step": 0 };
const decr = { "arity": 2, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const decrby = { "arity": 3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const del = { "arity": -2, "flags": ["write"], "keyStart": 1, "keyStop": -1, "step": 1 };
const discard = { "arity": 1, "flags": ["noscript", "loading", "stale", "fast", "allow_busy"], "keyStart": 0, "keyStop": 0, "step": 0 };
const dump = { "arity": 2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const echo = { "arity": 2, "flags": ["fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const eval_ro = { "arity": -3, "flags": ["readonly", "noscript", "stale", "skip_monitor", "no_mandatory_keys", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const evalsha = { "arity": -3, "flags": ["noscript", "stale", "skip_monitor", "no_mandatory_keys", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const evalsha_ro = { "arity": -3, "flags": ["readonly", "noscript", "stale", "skip_monitor", "no_mandatory_keys", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const exec = { "arity": 1, "flags": ["noscript", "loading", "stale", "skip_slowlog"], "keyStart": 0, "keyStop": 0, "step": 0 };
const exists = { "arity": -2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": -1, "step": 1 };
const expire = { "arity": -3, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const expireat = { "arity": -3, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const expiretime = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const failover = { "arity": -1, "flags": ["admin", "noscript", "stale"], "keyStart": 0, "keyStop": 0, "step": 0 };
const fcall = { "arity": -3, "flags": ["noscript", "stale", "skip_monitor", "no_mandatory_keys", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const fcall_ro = { "arity": -3, "flags": ["readonly", "noscript", "stale", "skip_monitor", "no_mandatory_keys", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const flushall = { "arity": -1, "flags": ["write"], "keyStart": 0, "keyStop": 0, "step": 0 };
const flushdb = { "arity": -1, "flags": ["write"], "keyStart": 0, "keyStop": 0, "step": 0 };
const geoadd = { "arity": -5, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 1, "step": 1 };
const geodist = { "arity": -4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const geohash = { "arity": -2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const geopos = { "arity": -2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const georadius = { "arity": -6, "flags": ["write", "denyoom", "movablekeys"], "keyStart": 1, "keyStop": 1, "step": 1 };
const georadius_ro = { "arity": -6, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const georadiusbymember = { "arity": -5, "flags": ["write", "denyoom", "movablekeys"], "keyStart": 1, "keyStop": 1, "step": 1 };
const georadiusbymember_ro = { "arity": -5, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const geosearch = { "arity": -7, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const geosearchstore = { "arity": -8, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 2, "step": 1 };
const get = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const getbit = { "arity": 3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const getdel = { "arity": 2, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const getex = { "arity": -2, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const getrange = { "arity": 4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const getset = { "arity": 3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hdel = { "arity": -3, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hello = { "arity": -1, "flags": ["noscript", "loading", "stale", "fast", "no_auth", "allow_busy"], "keyStart": 0, "keyStop": 0, "step": 0 };
const hexists = { "arity": 3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hexpire = { "arity": -6, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hpexpire = { "arity": -6, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hget = { "arity": 3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hgetall = { "arity": 2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hincrby = { "arity": 4, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hincrbyfloat = { "arity": 4, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hkeys = { "arity": 2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hlen = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hmget = { "arity": -3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hmset = { "arity": -4, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hrandfield = { "arity": -2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hscan = { "arity": -3, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hset = { "arity": -4, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hsetnx = { "arity": 4, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hstrlen = { "arity": 3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const hvals = { "arity": 2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const incr = { "arity": 2, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const incrby = { "arity": 3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const incrbyfloat = { "arity": 3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const info = { "arity": -1, "flags": ["loading", "stale"], "keyStart": 0, "keyStop": 0, "step": 0 };
const keys = { "arity": 2, "flags": ["readonly"], "keyStart": 0, "keyStop": 0, "step": 0 };
const lastsave = { "arity": 1, "flags": ["loading", "stale", "fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const latency = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const lcs = { "arity": -3, "flags": ["readonly"], "keyStart": 1, "keyStop": 2, "step": 1 };
const lindex = { "arity": 3, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const linsert = { "arity": 5, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 1, "step": 1 };
const llen = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const lmove = { "arity": 5, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 2, "step": 1 };
const lmpop = { "arity": -4, "flags": ["write", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const lolwut = { "arity": -1, "flags": ["readonly", "fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const lpop = { "arity": -2, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const lpos = { "arity": -3, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const lpush = { "arity": -3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const lpushx = { "arity": -3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const lrange = { "arity": 4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const lrem = { "arity": 4, "flags": ["write"], "keyStart": 1, "keyStop": 1, "step": 1 };
const lset = { "arity": 4, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 1, "step": 1 };
const ltrim = { "arity": 4, "flags": ["write"], "keyStart": 1, "keyStop": 1, "step": 1 };
const memory = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const mget = { "arity": -2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": -1, "step": 1 };
const migrate = { "arity": -6, "flags": ["write", "movablekeys"], "keyStart": 3, "keyStop": 3, "step": 1 };
const module$1 = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const monitor = { "arity": 1, "flags": ["admin", "noscript", "loading", "stale"], "keyStart": 0, "keyStop": 0, "step": 0 };
const move = { "arity": 3, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const mset = { "arity": -3, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": -1, "step": 2 };
const msetnx = { "arity": -3, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": -1, "step": 2 };
const multi = { "arity": 1, "flags": ["noscript", "loading", "stale", "fast", "allow_busy"], "keyStart": 0, "keyStop": 0, "step": 0 };
const object = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const persist = { "arity": 2, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const pexpire = { "arity": -3, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const pexpireat = { "arity": -3, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const pexpiretime = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const pfadd = { "arity": -2, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const pfcount = { "arity": -2, "flags": ["readonly"], "keyStart": 1, "keyStop": -1, "step": 1 };
const pfdebug = { "arity": 3, "flags": ["write", "denyoom", "admin"], "keyStart": 2, "keyStop": 2, "step": 1 };
const pfmerge = { "arity": -2, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": -1, "step": 1 };
const pfselftest = { "arity": 1, "flags": ["admin"], "keyStart": 0, "keyStop": 0, "step": 0 };
const ping = { "arity": -1, "flags": ["fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const psetex = { "arity": 4, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 1, "step": 1 };
const psubscribe = { "arity": -2, "flags": ["pubsub", "noscript", "loading", "stale"], "keyStart": 0, "keyStop": 0, "step": 0 };
const psync = { "arity": -3, "flags": ["admin", "noscript", "no_async_loading", "no_multi"], "keyStart": 0, "keyStop": 0, "step": 0 };
const pttl = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const publish = { "arity": 3, "flags": ["pubsub", "loading", "stale", "fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const pubsub = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const punsubscribe = { "arity": -1, "flags": ["pubsub", "noscript", "loading", "stale"], "keyStart": 0, "keyStop": 0, "step": 0 };
const quit = { "arity": -1, "flags": ["noscript", "loading", "stale", "fast", "no_auth", "allow_busy"], "keyStart": 0, "keyStop": 0, "step": 0 };
const randomkey = { "arity": 1, "flags": ["readonly"], "keyStart": 0, "keyStop": 0, "step": 0 };
const readonly = { "arity": 1, "flags": ["loading", "stale", "fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const readwrite = { "arity": 1, "flags": ["loading", "stale", "fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const rename = { "arity": 3, "flags": ["write"], "keyStart": 1, "keyStop": 2, "step": 1 };
const renamenx = { "arity": 3, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 2, "step": 1 };
const replconf = { "arity": -1, "flags": ["admin", "noscript", "loading", "stale", "allow_busy"], "keyStart": 0, "keyStop": 0, "step": 0 };
const replicaof = { "arity": 3, "flags": ["admin", "noscript", "stale", "no_async_loading"], "keyStart": 0, "keyStop": 0, "step": 0 };
const reset = { "arity": 1, "flags": ["noscript", "loading", "stale", "fast", "no_auth", "allow_busy"], "keyStart": 0, "keyStop": 0, "step": 0 };
const restore = { "arity": -4, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 1, "step": 1 };
const role = { "arity": 1, "flags": ["noscript", "loading", "stale", "fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const rpop = { "arity": -2, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const rpoplpush = { "arity": 3, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 2, "step": 1 };
const rpush = { "arity": -3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const rpushx = { "arity": -3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const sadd = { "arity": -3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const save = { "arity": 1, "flags": ["admin", "noscript", "no_async_loading", "no_multi"], "keyStart": 0, "keyStop": 0, "step": 0 };
const scan = { "arity": -2, "flags": ["readonly"], "keyStart": 0, "keyStop": 0, "step": 0 };
const scard = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const script = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const sdiff = { "arity": -2, "flags": ["readonly"], "keyStart": 1, "keyStop": -1, "step": 1 };
const sdiffstore = { "arity": -3, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": -1, "step": 1 };
const select = { "arity": 2, "flags": ["loading", "stale", "fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const set = { "arity": -3, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 1, "step": 1 };
const setbit = { "arity": 4, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 1, "step": 1 };
const setex = { "arity": 4, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 1, "step": 1 };
const setnx = { "arity": 3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const setrange = { "arity": 4, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 1, "step": 1 };
const shutdown = { "arity": -1, "flags": ["admin", "noscript", "loading", "stale", "no_multi", "allow_busy"], "keyStart": 0, "keyStop": 0, "step": 0 };
const sinter = { "arity": -2, "flags": ["readonly"], "keyStart": 1, "keyStop": -1, "step": 1 };
const sintercard = { "arity": -3, "flags": ["readonly", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const sinterstore = { "arity": -3, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": -1, "step": 1 };
const sismember = { "arity": 3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const slaveof = { "arity": 3, "flags": ["admin", "noscript", "stale", "no_async_loading"], "keyStart": 0, "keyStop": 0, "step": 0 };
const slowlog = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const smembers = { "arity": 2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const smismember = { "arity": -3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const smove = { "arity": 4, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 2, "step": 1 };
const sort = { "arity": -2, "flags": ["write", "denyoom", "movablekeys"], "keyStart": 1, "keyStop": 1, "step": 1 };
const sort_ro = { "arity": -2, "flags": ["readonly", "movablekeys"], "keyStart": 1, "keyStop": 1, "step": 1 };
const spop = { "arity": -2, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const spublish = { "arity": 3, "flags": ["pubsub", "loading", "stale", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const srandmember = { "arity": -2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const srem = { "arity": -3, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const sscan = { "arity": -3, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const ssubscribe = { "arity": -2, "flags": ["pubsub", "noscript", "loading", "stale"], "keyStart": 1, "keyStop": -1, "step": 1 };
const strlen = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const subscribe = { "arity": -2, "flags": ["pubsub", "noscript", "loading", "stale"], "keyStart": 0, "keyStop": 0, "step": 0 };
const substr = { "arity": 4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const sunion = { "arity": -2, "flags": ["readonly"], "keyStart": 1, "keyStop": -1, "step": 1 };
const sunionstore = { "arity": -3, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": -1, "step": 1 };
const sunsubscribe = { "arity": -1, "flags": ["pubsub", "noscript", "loading", "stale"], "keyStart": 1, "keyStop": -1, "step": 1 };
const swapdb = { "arity": 3, "flags": ["write", "fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const sync = { "arity": 1, "flags": ["admin", "noscript", "no_async_loading", "no_multi"], "keyStart": 0, "keyStop": 0, "step": 0 };
const time = { "arity": 1, "flags": ["loading", "stale", "fast"], "keyStart": 0, "keyStop": 0, "step": 0 };
const touch = { "arity": -2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": -1, "step": 1 };
const ttl = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const type = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const unlink = { "arity": -2, "flags": ["write", "fast"], "keyStart": 1, "keyStop": -1, "step": 1 };
const unsubscribe = { "arity": -1, "flags": ["pubsub", "noscript", "loading", "stale"], "keyStart": 0, "keyStop": 0, "step": 0 };
const unwatch = { "arity": 1, "flags": ["noscript", "loading", "stale", "fast", "allow_busy"], "keyStart": 0, "keyStop": 0, "step": 0 };
const wait = { "arity": 3, "flags": ["noscript"], "keyStart": 0, "keyStop": 0, "step": 0 };
const watch = { "arity": -2, "flags": ["noscript", "loading", "stale", "fast", "allow_busy"], "keyStart": 1, "keyStop": -1, "step": 1 };
const xack = { "arity": -4, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xadd = { "arity": -5, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xautoclaim = { "arity": -6, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xclaim = { "arity": -6, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xdel = { "arity": -3, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xdelex = { "arity": -5, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xgroup = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const xinfo = { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 };
const xlen = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xpending = { "arity": -3, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xrange = { "arity": -4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xread = { "arity": -4, "flags": ["readonly", "blocking", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const xreadgroup = { "arity": -7, "flags": ["write", "blocking", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const xrevrange = { "arity": -4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xsetid = { "arity": -3, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const xtrim = { "arity": -4, "flags": ["write"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zadd = { "arity": -4, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zcard = { "arity": 2, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zcount = { "arity": 4, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zdiff = { "arity": -3, "flags": ["readonly", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const zdiffstore = { "arity": -4, "flags": ["write", "denyoom", "movablekeys"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zincrby = { "arity": 4, "flags": ["write", "denyoom", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zinter = { "arity": -3, "flags": ["readonly", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const zintercard = { "arity": -3, "flags": ["readonly", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const zinterstore = { "arity": -4, "flags": ["write", "denyoom", "movablekeys"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zlexcount = { "arity": 4, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zmpop = { "arity": -4, "flags": ["write", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const zmscore = { "arity": -3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zpopmax = { "arity": -2, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zpopmin = { "arity": -2, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zrandmember = { "arity": -2, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zrange = { "arity": -4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zrangebylex = { "arity": -4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zrangebyscore = { "arity": -4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zrangestore = { "arity": -5, "flags": ["write", "denyoom"], "keyStart": 1, "keyStop": 2, "step": 1 };
const zrank = { "arity": 3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zrem = { "arity": -3, "flags": ["write", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zremrangebylex = { "arity": 4, "flags": ["write"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zremrangebyrank = { "arity": 4, "flags": ["write"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zremrangebyscore = { "arity": 4, "flags": ["write"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zrevrange = { "arity": -4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zrevrangebylex = { "arity": -4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zrevrangebyscore = { "arity": -4, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zrevrank = { "arity": 3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zscan = { "arity": -3, "flags": ["readonly"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zscore = { "arity": 3, "flags": ["readonly", "fast"], "keyStart": 1, "keyStop": 1, "step": 1 };
const zunion = { "arity": -3, "flags": ["readonly", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 };
const zunionstore = { "arity": -4, "flags": ["write", "denyoom", "movablekeys"], "keyStart": 1, "keyStop": 1, "step": 1 };
const require$$0 = {
  acl,
  append,
  asking,
  auth,
  bgrewriteaof,
  bgsave,
  bitcount,
  bitfield,
  bitfield_ro,
  bitop,
  bitpos,
  blmove,
  blmpop,
  blpop,
  brpop,
  brpoplpush,
  bzmpop,
  bzpopmax,
  bzpopmin,
  client,
  cluster,
  command,
  config,
  copy,
  dbsize,
  debug,
  decr,
  decrby,
  del,
  discard,
  dump,
  echo,
  "eval": { "arity": -3, "flags": ["noscript", "stale", "skip_monitor", "no_mandatory_keys", "movablekeys"], "keyStart": 0, "keyStop": 0, "step": 0 },
  eval_ro,
  evalsha,
  evalsha_ro,
  exec,
  exists,
  expire,
  expireat,
  expiretime,
  failover,
  fcall,
  fcall_ro,
  flushall,
  flushdb,
  "function": { "arity": -2, "flags": [], "keyStart": 0, "keyStop": 0, "step": 0 },
  geoadd,
  geodist,
  geohash,
  geopos,
  georadius,
  georadius_ro,
  georadiusbymember,
  georadiusbymember_ro,
  geosearch,
  geosearchstore,
  get,
  getbit,
  getdel,
  getex,
  getrange,
  getset,
  hdel,
  hello,
  hexists,
  hexpire,
  hpexpire,
  hget,
  hgetall,
  hincrby,
  hincrbyfloat,
  hkeys,
  hlen,
  hmget,
  hmset,
  hrandfield,
  hscan,
  hset,
  hsetnx,
  hstrlen,
  hvals,
  incr,
  incrby,
  incrbyfloat,
  info,
  keys,
  lastsave,
  latency,
  lcs,
  lindex,
  linsert,
  llen,
  lmove,
  lmpop,
  lolwut,
  lpop,
  lpos,
  lpush,
  lpushx,
  lrange,
  lrem,
  lset,
  ltrim,
  memory,
  mget,
  migrate,
  module: module$1,
  monitor,
  move,
  mset,
  msetnx,
  multi,
  object,
  persist,
  pexpire,
  pexpireat,
  pexpiretime,
  pfadd,
  pfcount,
  pfdebug,
  pfmerge,
  pfselftest,
  ping,
  psetex,
  psubscribe,
  psync,
  pttl,
  publish,
  pubsub,
  punsubscribe,
  quit,
  randomkey,
  readonly,
  readwrite,
  rename,
  renamenx,
  replconf,
  replicaof,
  reset,
  restore,
  "restore-asking": { "arity": -4, "flags": ["write", "denyoom", "asking"], "keyStart": 1, "keyStop": 1, "step": 1 },
  role,
  rpop,
  rpoplpush,
  rpush,
  rpushx,
  sadd,
  save,
  scan,
  scard,
  script,
  sdiff,
  sdiffstore,
  select,
  set,
  setbit,
  setex,
  setnx,
  setrange,
  shutdown,
  sinter,
  sintercard,
  sinterstore,
  sismember,
  slaveof,
  slowlog,
  smembers,
  smismember,
  smove,
  sort,
  sort_ro,
  spop,
  spublish,
  srandmember,
  srem,
  sscan,
  ssubscribe,
  strlen,
  subscribe,
  substr,
  sunion,
  sunionstore,
  sunsubscribe,
  swapdb,
  sync,
  time,
  touch,
  ttl,
  type,
  unlink,
  unsubscribe,
  unwatch,
  wait,
  watch,
  xack,
  xadd,
  xautoclaim,
  xclaim,
  xdel,
  xdelex,
  xgroup,
  xinfo,
  xlen,
  xpending,
  xrange,
  xread,
  xreadgroup,
  xrevrange,
  xsetid,
  xtrim,
  zadd,
  zcard,
  zcount,
  zdiff,
  zdiffstore,
  zincrby,
  zinter,
  zintercard,
  zinterstore,
  zlexcount,
  zmpop,
  zmscore,
  zpopmax,
  zpopmin,
  zrandmember,
  zrange,
  zrangebylex,
  zrangebyscore,
  zrangestore,
  zrank,
  zrem,
  zremrangebylex,
  zremrangebyrank,
  zremrangebyscore,
  zrevrange,
  zrevrangebylex,
  zrevrangebyscore,
  zrevrank,
  zscan,
  zscore,
  zunion,
  zunionstore
};
var hasRequiredBuilt;
function requireBuilt() {
  if (hasRequiredBuilt) return built;
  hasRequiredBuilt = 1;
  (function(exports$1) {
    var __importDefault = built && built.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.getKeyIndexes = exports$1.hasFlag = exports$1.exists = exports$1.list = void 0;
    const commands_json_1 = __importDefault(require$$0);
    exports$1.list = Object.keys(commands_json_1.default);
    const flags = {};
    exports$1.list.forEach((commandName) => {
      flags[commandName] = commands_json_1.default[commandName].flags.reduce(function(flags2, flag) {
        flags2[flag] = true;
        return flags2;
      }, {});
    });
    function exists2(commandName) {
      return Boolean(commands_json_1.default[commandName]);
    }
    exports$1.exists = exists2;
    function hasFlag(commandName, flag) {
      if (!flags[commandName]) {
        throw new Error("Unknown command " + commandName);
      }
      return Boolean(flags[commandName][flag]);
    }
    exports$1.hasFlag = hasFlag;
    function getKeyIndexes(commandName, args, options) {
      const command2 = commands_json_1.default[commandName];
      if (!command2) {
        throw new Error("Unknown command " + commandName);
      }
      if (!Array.isArray(args)) {
        throw new Error("Expect args to be an array");
      }
      const keys2 = [];
      const parseExternalKey = Boolean(options && options.parseExternalKey);
      const takeDynamicKeys = (args2, startIndex) => {
        const keys3 = [];
        const keyStop = Number(args2[startIndex]);
        for (let i = 0; i < keyStop; i++) {
          keys3.push(i + startIndex + 1);
        }
        return keys3;
      };
      const takeKeyAfterToken = (args2, startIndex, token) => {
        for (let i = startIndex; i < args2.length - 1; i += 1) {
          if (String(args2[i]).toLowerCase() === token.toLowerCase()) {
            return i + 1;
          }
        }
        return null;
      };
      switch (commandName) {
        case "zunionstore":
        case "zinterstore":
        case "zdiffstore":
          keys2.push(0, ...takeDynamicKeys(args, 1));
          break;
        case "eval":
        case "evalsha":
        case "eval_ro":
        case "evalsha_ro":
        case "fcall":
        case "fcall_ro":
        case "blmpop":
        case "bzmpop":
          keys2.push(...takeDynamicKeys(args, 1));
          break;
        case "sintercard":
        case "lmpop":
        case "zunion":
        case "zinter":
        case "zmpop":
        case "zintercard":
        case "zdiff": {
          keys2.push(...takeDynamicKeys(args, 0));
          break;
        }
        case "georadius": {
          keys2.push(0);
          const storeKey = takeKeyAfterToken(args, 5, "STORE");
          if (storeKey)
            keys2.push(storeKey);
          const distKey = takeKeyAfterToken(args, 5, "STOREDIST");
          if (distKey)
            keys2.push(distKey);
          break;
        }
        case "georadiusbymember": {
          keys2.push(0);
          const storeKey = takeKeyAfterToken(args, 4, "STORE");
          if (storeKey)
            keys2.push(storeKey);
          const distKey = takeKeyAfterToken(args, 4, "STOREDIST");
          if (distKey)
            keys2.push(distKey);
          break;
        }
        case "sort":
        case "sort_ro":
          keys2.push(0);
          for (let i = 1; i < args.length - 1; i++) {
            let arg = args[i];
            if (typeof arg !== "string") {
              continue;
            }
            const directive = arg.toUpperCase();
            if (directive === "GET") {
              i += 1;
              arg = args[i];
              if (arg !== "#") {
                if (parseExternalKey) {
                  keys2.push([i, getExternalKeyNameLength(arg)]);
                } else {
                  keys2.push(i);
                }
              }
            } else if (directive === "BY") {
              i += 1;
              if (parseExternalKey) {
                keys2.push([i, getExternalKeyNameLength(args[i])]);
              } else {
                keys2.push(i);
              }
            } else if (directive === "STORE") {
              i += 1;
              keys2.push(i);
            }
          }
          break;
        case "migrate":
          if (args[2] === "") {
            for (let i = 5; i < args.length - 1; i++) {
              const arg = args[i];
              if (typeof arg === "string" && arg.toUpperCase() === "KEYS") {
                for (let j = i + 1; j < args.length; j++) {
                  keys2.push(j);
                }
                break;
              }
            }
          } else {
            keys2.push(2);
          }
          break;
        case "xreadgroup":
        case "xread":
          for (let i = commandName === "xread" ? 0 : 3; i < args.length - 1; i++) {
            if (String(args[i]).toUpperCase() === "STREAMS") {
              for (let j = i + 1; j <= i + (args.length - 1 - i) / 2; j++) {
                keys2.push(j);
              }
              break;
            }
          }
          break;
        default:
          if (command2.step > 0) {
            const keyStart = command2.keyStart - 1;
            const keyStop = command2.keyStop > 0 ? command2.keyStop : args.length + command2.keyStop + 1;
            for (let i = keyStart; i < keyStop; i += command2.step) {
              keys2.push(i);
            }
          }
          break;
      }
      return keys2;
    }
    exports$1.getKeyIndexes = getKeyIndexes;
    function getExternalKeyNameLength(key) {
      if (typeof key !== "string") {
        key = String(key);
      }
      const hashPos = key.indexOf("->");
      return hashPos === -1 ? key.length : hashPos;
    }
  })(built);
  return built;
}
export {
  getAugmentedNamespace as a,
  commonjsGlobal as c,
  getDefaultExportFromCjs as g,
  requireBuilt as r
};
