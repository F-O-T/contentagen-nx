function token(onToken, onEnd) {
  return (data, i) => {
    let position = i;
    let value = void 0;
    if (i < data.tokens.length) {
      value = onToken(data.tokens[i], data, i);
      if (value !== void 0) {
        position++;
      }
    }
    return value === void 0 ? { matched: false } : {
      matched: true,
      position,
      value
    };
  };
}
function mapInner(r, f) {
  return r.matched ? {
    matched: true,
    position: r.position,
    value: f(r.value, r.position)
  } : r;
}
function mapOuter(r, f) {
  return r.matched ? f(r) : r;
}
function map(p, mapper) {
  return (data, i) => mapInner(p(data, i), (v, j) => mapper(v, data, i, j));
}
function option(p, def) {
  return (data, i) => {
    const r = p(data, i);
    return r.matched ? r : {
      matched: true,
      position: i,
      value: def
    };
  };
}
function choice(...ps) {
  return (data, i) => {
    for (const p of ps) {
      const result = p(data, i);
      if (result.matched) {
        return result;
      }
    }
    return { matched: false };
  };
}
function otherwise(pa, pb) {
  return (data, i) => {
    const r1 = pa(data, i);
    return r1.matched ? r1 : pb(data, i);
  };
}
function takeWhile(p, test) {
  return (data, i) => {
    const values = [];
    let success = true;
    do {
      const r = p(data, i);
      if (r.matched && test(r.value, values.length + 1, data, i, r.position)) {
        values.push(r.value);
        i = r.position;
      } else {
        success = false;
      }
    } while (success);
    return {
      matched: true,
      position: i,
      value: values
    };
  };
}
function many(p) {
  return takeWhile(p, () => true);
}
function many1(p) {
  return ab(p, many(p), (head, tail) => [head, ...tail]);
}
function ab(pa, pb, join) {
  return (data, i) => mapOuter(pa(data, i), (ma) => mapInner(pb(data, ma.position), (vb, j) => join(ma.value, vb, data, i, j)));
}
function left(pa, pb) {
  return ab(pa, pb, (va) => va);
}
function right(pa, pb) {
  return ab(pa, pb, (va, vb) => vb);
}
function abc(pa, pb, pc, join) {
  return (data, i) => mapOuter(pa(data, i), (ma) => mapOuter(pb(data, ma.position), (mb) => mapInner(pc(data, mb.position), (vc, j) => join(ma.value, mb.value, vc, data, i, j))));
}
function middle(pa, pb, pc) {
  return abc(pa, pb, pc, (ra, rb) => rb);
}
function all(...ps) {
  return (data, i) => {
    const result = [];
    let position = i;
    for (const p of ps) {
      const r1 = p(data, position);
      if (r1.matched) {
        result.push(r1.value);
        position = r1.position;
      } else {
        return { matched: false };
      }
    }
    return {
      matched: true,
      position,
      value: result
    };
  };
}
function flatten(...ps) {
  return flatten1(all(...ps));
}
function flatten1(p) {
  return map(p, (vs) => vs.flatMap((v) => v));
}
function chainReduce(acc, f) {
  return (data, i) => {
    let loop = true;
    let acc1 = acc;
    let pos = i;
    do {
      const r = f(acc1, data, pos)(data, pos);
      if (r.matched) {
        acc1 = r.value;
        pos = r.position;
      } else {
        loop = false;
      }
    } while (loop);
    return {
      matched: true,
      position: pos,
      value: acc1
    };
  };
}
function reduceLeft(acc, p, reducer) {
  return chainReduce(acc, (acc2) => map(p, (v, data, i, j) => reducer(acc2, v, data, i, j)));
}
function leftAssoc2(pLeft, pOper, pRight) {
  return chain(pLeft, (v0) => reduceLeft(v0, ab(pOper, pRight, (f, y) => [f, y]), (acc, [f, y]) => f(acc, y)));
}
function chain(p, f) {
  return (data, i) => mapOuter(p(data, i), (m1) => f(m1.value, data, i, m1.position)(data, m1.position));
}
export {
  map as a,
  many as b,
  choice as c,
  otherwise as d,
  ab as e,
  flatten as f,
  many1 as g,
  abc as h,
  left as i,
  leftAssoc2 as l,
  middle as m,
  option as o,
  right as r,
  token as t
};
