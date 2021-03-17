// math-inlining.
const { abs, cos, sin, acos, atan2, sqrt, pow } = Math;
// cube root function yielding real roots
function crt(v) {
	return v < 0 ? -pow(-v, 1 / 3) : pow(v, 1 / 3);
}
// trig constants
const pi = Math.PI, tau = 2 * pi, quart = pi / 2, 
// float precision significant decimal
epsilon = 0.000001, 
// extremas used in bbox calculation and similar algorithms
nMax = Number.MAX_SAFE_INTEGER || 9007199254740991, nMin = Number.MIN_SAFE_INTEGER || -9007199254740991, 
// a zero coordinate, which is surprisingly useful
ZERO = { x: 0, y: 0, z: 0 };
// Bezier utility functions
const utils = {
	// Legendre-Gauss abscissae with n=24 (x_i values, defined at i=n as the roots of the nth order Legendre polynomial Pn(x))
	Tvalues: [
		-0.0640568928626056260850430826247450385909,
		0.0640568928626056260850430826247450385909,
		-0.1911188674736163091586398207570696318404,
		0.1911188674736163091586398207570696318404,
		-0.3150426796961633743867932913198102407864,
		0.3150426796961633743867932913198102407864,
		-0.4337935076260451384870842319133497124524,
		0.4337935076260451384870842319133497124524,
		-0.5454214713888395356583756172183723700107,
		0.5454214713888395356583756172183723700107,
		-0.6480936519369755692524957869107476266696,
		0.6480936519369755692524957869107476266696,
		-0.7401241915785543642438281030999784255232,
		0.7401241915785543642438281030999784255232,
		-0.8200019859739029219539498726697452080761,
		0.8200019859739029219539498726697452080761,
		-0.8864155270044010342131543419821967550873,
		0.8864155270044010342131543419821967550873,
		-0.9382745520027327585236490017087214496548,
		0.9382745520027327585236490017087214496548,
		-0.9747285559713094981983919930081690617411,
		0.9747285559713094981983919930081690617411,
		-0.9951872199970213601799974097007368118745,
		0.9951872199970213601799974097007368118745,
	],
	// Legendre-Gauss weights with n=24 (w_i values, defined by a function linked to in the Bezier primer article)
	Cvalues: [
		0.1279381953467521569740561652246953718517,
		0.1279381953467521569740561652246953718517,
		0.1258374563468282961213753825111836887264,
		0.1258374563468282961213753825111836887264,
		0.121670472927803391204463153476262425607,
		0.121670472927803391204463153476262425607,
		0.1155056680537256013533444839067835598622,
		0.1155056680537256013533444839067835598622,
		0.1074442701159656347825773424466062227946,
		0.1074442701159656347825773424466062227946,
		0.0976186521041138882698806644642471544279,
		0.0976186521041138882698806644642471544279,
		0.086190161531953275917185202983742667185,
		0.086190161531953275917185202983742667185,
		0.0733464814110803057340336152531165181193,
		0.0733464814110803057340336152531165181193,
		0.0592985849154367807463677585001085845412,
		0.0592985849154367807463677585001085845412,
		0.0442774388174198061686027482113382288593,
		0.0442774388174198061686027482113382288593,
		0.0285313886289336631813078159518782864491,
		0.0285313886289336631813078159518782864491,
		0.0123412297999871995468056670700372915759,
		0.0123412297999871995468056670700372915759,
	],
	arcfn: function (t, derivativeFn) {
		const d = derivativeFn(t);
		let l = d.x * d.x + d.y * d.y;
		if (typeof d.z !== "undefined") {
			l += d.z * d.z;
		}
		return sqrt(l);
	},
	compute: function (t, points, _3d) {
		// shortcuts
		if (t === 0) {
			points[0].t = 0;
			return points[0];
		}
		const order = points.length - 1;
		if (t === 1) {
			points[order].t = 1;
			return points[order];
		}
		const mt = 1 - t;
		let p = points;
		// constant?
		if (order === 0) {
			points[0].t = t;
			return points[0];
		}
		// linear?
		if (order === 1) {
			const ret = {
				x: mt * p[0].x + t * p[1].x,
				y: mt * p[0].y + t * p[1].y,
				t: t,
			};
			if (_3d) {
				ret.z = mt * p[0].z + t * p[1].z;
			}
			return ret;
		}
		// quadratic/cubic curve?
		if (order < 4) {
			let mt2 = mt * mt, t2 = t * t, a, b, c, d = 0;
			if (order === 2) {
				p = [p[0], p[1], p[2], ZERO];
				a = mt2;
				b = mt * t * 2;
				c = t2;
			}
			else if (order === 3) {
				a = mt2 * mt;
				b = mt2 * t * 3;
				c = mt * t2 * 3;
				d = t * t2;
			}
			const ret = {
				x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
				y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y,
				t: t,
			};
			if (_3d) {
				ret.z = a * p[0].z + b * p[1].z + c * p[2].z + d * p[3].z;
			}
			return ret;
		}
		// higher order curves: use de Casteljau's computation
		const dCpts = JSON.parse(JSON.stringify(points));
		while (dCpts.length > 1) {
			for (let i = 0; i < dCpts.length - 1; i++) {
				dCpts[i] = {
					x: dCpts[i].x + (dCpts[i + 1].x - dCpts[i].x) * t,
					y: dCpts[i].y + (dCpts[i + 1].y - dCpts[i].y) * t,
				};
				if (typeof dCpts[i].z !== "undefined") {
					dCpts[i] = dCpts[i].z + (dCpts[i + 1].z - dCpts[i].z) * t;
				}
			}
			dCpts.splice(dCpts.length - 1, 1);
		}
		dCpts[0].t = t;
		return dCpts[0];
	},
	computeWithRatios: function (t, points, ratios, _3d) {
		const mt = 1 - t, r = ratios, p = points;
		let f1 = r[0], f2 = r[1], f3 = r[2], f4 = r[3], d;
		// spec for linear
		f1 *= mt;
		f2 *= t;
		if (p.length === 2) {
			d = f1 + f2;
			return {
				x: (f1 * p[0].x + f2 * p[1].x) / d,
				y: (f1 * p[0].y + f2 * p[1].y) / d,
				z: !_3d ? false : (f1 * p[0].z + f2 * p[1].z) / d,
				t: t,
			};
		}
		// upgrade to quadratic
		f1 *= mt;
		f2 *= 2 * mt;
		f3 *= t * t;
		if (p.length === 3) {
			d = f1 + f2 + f3;
			return {
				x: (f1 * p[0].x + f2 * p[1].x + f3 * p[2].x) / d,
				y: (f1 * p[0].y + f2 * p[1].y + f3 * p[2].y) / d,
				z: !_3d ? false : (f1 * p[0].z + f2 * p[1].z + f3 * p[2].z) / d,
				t: t,
			};
		}
		// upgrade to cubic
		f1 *= mt;
		f2 *= 1.5 * mt;
		f3 *= 3 * mt;
		f4 *= t * t * t;
		if (p.length === 4) {
			d = f1 + f2 + f3 + f4;
			return {
				x: (f1 * p[0].x + f2 * p[1].x + f3 * p[2].x + f4 * p[3].x) / d,
				y: (f1 * p[0].y + f2 * p[1].y + f3 * p[2].y + f4 * p[3].y) / d,
				z: !_3d
					? false
					: (f1 * p[0].z + f2 * p[1].z + f3 * p[2].z + f4 * p[3].z) / d,
				t: t,
			};
		}
	},
	derive: function (points, _3d) {
		const dpoints = [];
		for (let p = points, d = p.length, c = d - 1; d > 1; d--, c--) {
			const list = [];
			for (let j = 0, dpt; j < c; j++) {
				dpt = {
					x: c * (p[j + 1].x - p[j].x),
					y: c * (p[j + 1].y - p[j].y),
				};
				if (_3d) {
					dpt.z = c * (p[j + 1].z - p[j].z);
				}
				list.push(dpt);
			}
			dpoints.push(list);
			p = list;
		}
		return dpoints;
	},
	between: function (v, m, M) {
		return ((m <= v && v <= M) ||
			utils.approximately(v, m) ||
			utils.approximately(v, M));
	},
	approximately: function (a, b, precision) {
		return abs(a - b) <= (precision || epsilon);
	},
	length: function (derivativeFn) {
		const z = 0.5, len = utils.Tvalues.length;
		let sum = 0;
		for (let i = 0, t; i < len; i++) {
			t = z * utils.Tvalues[i] + z;
			sum += utils.Cvalues[i] * utils.arcfn(t, derivativeFn);
		}
		return z * sum;
	},
	map: function (v, ds, de, ts, te) {
		const d1 = de - ds, d2 = te - ts, v2 = v - ds, r = v2 / d1;
		return ts + d2 * r;
	},
	lerp: function (r, v1, v2) {
		const ret = {
			x: v1.x + r * (v2.x - v1.x),
			y: v1.y + r * (v2.y - v1.y),
		};
		if (!!v1.z && !!v2.z) {
			ret.z = v1.z + r * (v2.z - v1.z);
		}
		return ret;
	},
	pointToString: function (p) {
		let s = p.x + "/" + p.y;
		if (typeof p.z !== "undefined") {
			s += "/" + p.z;
		}
		return s;
	},
	pointsToString: function (points) {
		return "[" + points.map(utils.pointToString).join(", ") + "]";
	},
	copy: function (obj) {
		return JSON.parse(JSON.stringify(obj));
	},
	angle: function (o, v1, v2) {
		const dx1 = v1.x - o.x, dy1 = v1.y - o.y, dx2 = v2.x - o.x, dy2 = v2.y - o.y, cross = dx1 * dy2 - dy1 * dx2, dot = dx1 * dx2 + dy1 * dy2;
		return atan2(cross, dot);
	},
	// round as string, to avoid rounding errors
	round: function (v, d) {
		const s = "" + v;
		const pos = s.indexOf(".");
		return parseFloat(s.substring(0, pos + 1 + d));
	},
	dist: function (p1, p2) {
		const dx = p1.x - p2.x, dy = p1.y - p2.y;
		return sqrt(dx * dx + dy * dy);
	},
	closest: function (LUT, point) {
		let mdist = pow(2, 63), mpos, d;
		LUT.forEach(function (p, idx) {
			d = utils.dist(point, p);
			if (d < mdist) {
				mdist = d;
				mpos = idx;
			}
		});
		return { mdist: mdist, mpos: mpos };
	},
	abcratio: function (t, n) {
		// see ratio(t) note on http://pomax.github.io/bezierinfo/#abc
		if (n !== 2 && n !== 3) {
			return false;
		}
		if (typeof t === "undefined") {
			t = 0.5;
		}
		else if (t === 0 || t === 1) {
			return t;
		}
		const bottom = pow(t, n) + pow(1 - t, n), top = bottom - 1;
		return abs(top / bottom);
	},
	projectionratio: function (t, n) {
		// see u(t) note on http://pomax.github.io/bezierinfo/#abc
		if (n !== 2 && n !== 3) {
			return false;
		}
		if (typeof t === "undefined") {
			t = 0.5;
		}
		else if (t === 0 || t === 1) {
			return t;
		}
		const top = pow(1 - t, n), bottom = pow(t, n) + top;
		return top / bottom;
	},
	lli8: function (x1, y1, x2, y2, x3, y3, x4, y4) {
		const nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4), ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4), d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
		if (d == 0) {
			return false;
		}
		return { x: nx / d, y: ny / d };
	},
	lli4: function (p1, p2, p3, p4) {
		const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, x3 = p3.x, y3 = p3.y, x4 = p4.x, y4 = p4.y;
		return utils.lli8(x1, y1, x2, y2, x3, y3, x4, y4);
	},
	lli: function (v1, v2) {
		return utils.lli4(v1, v1.c, v2, v2.c);
	},
	makeline: function (p1, p2) {
		const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, dx = (x2 - x1) / 3, dy = (y2 - y1) / 3;
		return new Bezier(x1, y1, x1 + dx, y1 + dy, x1 + 2 * dx, y1 + 2 * dy, x2, y2);
	},
	findbbox: function (sections) {
		let mx = nMax, my = nMax, MX = nMin, MY = nMin;
		sections.forEach(function (s) {
			const bbox = s.bbox();
			if (mx > bbox.x.min)
				mx = bbox.x.min;
			if (my > bbox.y.min)
				my = bbox.y.min;
			if (MX < bbox.x.max)
				MX = bbox.x.max;
			if (MY < bbox.y.max)
				MY = bbox.y.max;
		});
		return {
			x: { min: mx, mid: (mx + MX) / 2, max: MX, size: MX - mx },
			y: { min: my, mid: (my + MY) / 2, max: MY, size: MY - my },
		};
	},
	shapeintersections: function (s1, bbox1, s2, bbox2, curveIntersectionThreshold) {
		if (!utils.bboxoverlap(bbox1, bbox2))
			return [];
		const intersections = [];
		const a1 = [s1.startcap, s1.forward, s1.back, s1.endcap];
		const a2 = [s2.startcap, s2.forward, s2.back, s2.endcap];
		a1.forEach(function (l1) {
			if (l1.virtual)
				return;
			a2.forEach(function (l2) {
				if (l2.virtual)
					return;
				const iss = l1.intersects(l2, curveIntersectionThreshold);
				if (iss.length > 0) {
					iss.c1 = l1;
					iss.c2 = l2;
					iss.s1 = s1;
					iss.s2 = s2;
					intersections.push(iss);
				}
			});
		});
		return intersections;
	},
	makeshape: function (forward, back, curveIntersectionThreshold) {
		const bpl = back.points.length;
		const fpl = forward.points.length;
		const start = utils.makeline(back.points[bpl - 1], forward.points[0]);
		const end = utils.makeline(forward.points[fpl - 1], back.points[0]);
		const shape = {
			startcap: start,
			forward: forward,
			back: back,
			endcap: end,
			bbox: utils.findbbox([start, forward, back, end]),
		};
		shape.intersections = function (s2) {
			return utils.shapeintersections(shape, shape.bbox, s2, s2.bbox, curveIntersectionThreshold);
		};
		return shape;
	},
	getminmax: function (curve, d, list) {
		if (!list)
			return { min: 0, max: 0 };
		let min = nMax, max = nMin, t, c;
		if (list.indexOf(0) === -1) {
			list = [0].concat(list);
		}
		if (list.indexOf(1) === -1) {
			list.push(1);
		}
		for (let i = 0, len = list.length; i < len; i++) {
			t = list[i];
			c = curve.get(t);
			if (c[d] < min) {
				min = c[d];
			}
			if (c[d] > max) {
				max = c[d];
			}
		}
		return { min: min, mid: (min + max) / 2, max: max, size: max - min };
	},
	align: function (points, line) {
		const tx = line.p1.x, ty = line.p1.y, a = -atan2(line.p2.y - ty, line.p2.x - tx), d = function (v) {
			return {
				x: (v.x - tx) * cos(a) - (v.y - ty) * sin(a),
				y: (v.x - tx) * sin(a) + (v.y - ty) * cos(a),
			};
		};
		return points.map(d);
	},
	roots: function (points, line) {
		line = line || { p1: { x: 0, y: 0 }, p2: { x: 1, y: 0 } };
		const order = points.length - 1;
		const aligned = utils.align(points, line);
		const reduce = function (t) {
			return 0 <= t && t <= 1;
		};
		if (order === 2) {
			const a = aligned[0].y, b = aligned[1].y, c = aligned[2].y, d = a - 2 * b + c;
			if (d !== 0) {
				const m1 = -sqrt(b * b - a * c), m2 = -a + b, v1 = -(m1 + m2) / d, v2 = -(-m1 + m2) / d;
				return [v1, v2].filter(reduce);
			}
			else if (b !== c && d === 0) {
				return [(2 * b - c) / (2 * b - 2 * c)].filter(reduce);
			}
			return [];
		}
		// see http://www.trans4mind.com/personal_development/mathematics/polynomials/cubicAlgebra.htm
		const pa = aligned[0].y, pb = aligned[1].y, pc = aligned[2].y, pd = aligned[3].y;
		let d = -pa + 3 * pb - 3 * pc + pd, a = 3 * pa - 6 * pb + 3 * pc, b = -3 * pa + 3 * pb, c = pa;
		if (utils.approximately(d, 0)) {
			// this is not a cubic curve.
			if (utils.approximately(a, 0)) {
				// in fact, this is not a quadratic curve either.
				if (utils.approximately(b, 0)) {
					// in fact in fact, there are no solutions.
					return [];
				}
				// linear solution:
				return [-c / b].filter(reduce);
			}
			// quadratic solution:
			const q = sqrt(b * b - 4 * a * c), a2 = 2 * a;
			return [(q - b) / a2, (-b - q) / a2].filter(reduce);
		}
		// at this point, we know we need a cubic solution:
		a /= d;
		b /= d;
		c /= d;
		const p = (3 * b - a * a) / 3, p3 = p / 3, q = (2 * a * a * a - 9 * a * b + 27 * c) / 27, q2 = q / 2, discriminant = q2 * q2 + p3 * p3 * p3;
		let u1, v1, x1, x2, x3;
		if (discriminant < 0) {
			const mp3 = -p / 3, mp33 = mp3 * mp3 * mp3, r = sqrt(mp33), t = -q / (2 * r), cosphi = t < -1 ? -1 : t > 1 ? 1 : t, phi = acos(cosphi), crtr = crt(r), t1 = 2 * crtr;
			x1 = t1 * cos(phi / 3) - a / 3;
			x2 = t1 * cos((phi + tau) / 3) - a / 3;
			x3 = t1 * cos((phi + 2 * tau) / 3) - a / 3;
			return [x1, x2, x3].filter(reduce);
		}
		else if (discriminant === 0) {
			u1 = q2 < 0 ? crt(-q2) : -crt(q2);
			x1 = 2 * u1 - a / 3;
			x2 = -u1 - a / 3;
			return [x1, x2].filter(reduce);
		}
		else {
			const sd = sqrt(discriminant);
			u1 = crt(-q2 + sd);
			v1 = crt(q2 + sd);
			return [u1 - v1 - a / 3].filter(reduce);
		}
	},
	droots: function (p) {
		// quadratic roots are easy
		if (p.length === 3) {
			const a = p[0], b = p[1], c = p[2], d = a - 2 * b + c;
			if (d !== 0) {
				const m1 = -sqrt(b * b - a * c), m2 = -a + b, v1 = -(m1 + m2) / d, v2 = -(-m1 + m2) / d;
				return [v1, v2];
			}
			else if (b !== c && d === 0) {
				return [(2 * b - c) / (2 * (b - c))];
			}
			return [];
		}
		// linear roots are even easier
		if (p.length === 2) {
			const a = p[0], b = p[1];
			if (a !== b) {
				return [a / (a - b)];
			}
			return [];
		}
		return [];
	},
	curvature: function (t, d1, d2, _3d, kOnly) {
		let num, dnm, adk, dk, k = 0, r = 0;
		//
		// We're using the following formula for curvature:
		//
		//              x'y" - y'x"
		//   k(t) = ------------------
		//           (x'² + y'²)^(3/2)
		//
		// from https://en.wikipedia.org/wiki/Radius_of_curvature#Definition
		//
		// With it corresponding 3D counterpart:
		//
		//          sqrt( (y'z" - y"z')² + (z'x" - z"x')² + (x'y" - x"y')²)
		//   k(t) = -------------------------------------------------------
		//                     (x'² + y'² + z'²)^(3/2)
		//
		const d = utils.compute(t, d1);
		const dd = utils.compute(t, d2);
		const qdsum = d.x * d.x + d.y * d.y;
		if (_3d) {
			num = sqrt(pow(d.y * dd.z - dd.y * d.z, 2) +
				pow(d.z * dd.x - dd.z * d.x, 2) +
				pow(d.x * dd.y - dd.x * d.y, 2));
			dnm = pow(qdsum + d.z * d.z, 3 / 2);
		}
		else {
			num = d.x * dd.y - d.y * dd.x;
			dnm = pow(qdsum, 3 / 2);
		}
		if (num === 0 || dnm === 0) {
			return { k: 0, r: 0 };
		}
		k = num / dnm;
		r = dnm / num;
		// We're also computing the derivative of kappa, because
		// there is value in knowing the rate of change for the
		// curvature along the curve. And we're just going to
		// ballpark it based on an epsilon.
		if (!kOnly) {
			// compute k'(t) based on the interval before, and after it,
			// to at least try to not introduce forward/backward pass bias.
			const pk = utils.curvature(t - 0.001, d1, d2, _3d, true).k;
			const nk = utils.curvature(t + 0.001, d1, d2, _3d, true).k;
			dk = (nk - k + (k - pk)) / 2;
			adk = (abs(nk - k) + abs(k - pk)) / 2;
		}
		return { k: k, r: r, dk: dk, adk: adk };
	},
	inflections: function (points) {
		if (points.length < 4)
			return [];
		// FIXME: TODO: add in inflection abstraction for quartic+ curves?
		const p = utils.align(points, { p1: points[0], p2: points.slice(-1)[0] }), a = p[2].x * p[1].y, b = p[3].x * p[1].y, c = p[1].x * p[2].y, d = p[3].x * p[2].y, v1 = 18 * (-3 * a + 2 * b + 3 * c - d), v2 = 18 * (3 * a - b - 3 * c), v3 = 18 * (c - a);
		if (utils.approximately(v1, 0)) {
			if (!utils.approximately(v2, 0)) {
				let t = -v3 / v2;
				if (0 <= t && t <= 1)
					return [t];
			}
			return [];
		}
		const trm = v2 * v2 - 4 * v1 * v3, sq = Math.sqrt(trm), d2 = 2 * v1;
		if (utils.approximately(d2, 0))
			return [];
		return [(sq - v2) / d2, -(v2 + sq) / d2].filter(function (r) {
			return 0 <= r && r <= 1;
		});
	},
	bboxoverlap: function (b1, b2) {
		const dims = ["x", "y"], len = dims.length;
		for (let i = 0, dim, l, t, d; i < len; i++) {
			dim = dims[i];
			l = b1[dim].mid;
			t = b2[dim].mid;
			d = (b1[dim].size + b2[dim].size) / 2;
			if (abs(l - t) >= d)
				return false;
		}
		return true;
	},
	expandbox: function (bbox, _bbox) {
		if (_bbox.x.min < bbox.x.min) {
			bbox.x.min = _bbox.x.min;
		}
		if (_bbox.y.min < bbox.y.min) {
			bbox.y.min = _bbox.y.min;
		}
		if (_bbox.z && _bbox.z.min < bbox.z.min) {
			bbox.z.min = _bbox.z.min;
		}
		if (_bbox.x.max > bbox.x.max) {
			bbox.x.max = _bbox.x.max;
		}
		if (_bbox.y.max > bbox.y.max) {
			bbox.y.max = _bbox.y.max;
		}
		if (_bbox.z && _bbox.z.max > bbox.z.max) {
			bbox.z.max = _bbox.z.max;
		}
		bbox.x.mid = (bbox.x.min + bbox.x.max) / 2;
		bbox.y.mid = (bbox.y.min + bbox.y.max) / 2;
		if (bbox.z) {
			bbox.z.mid = (bbox.z.min + bbox.z.max) / 2;
		}
		bbox.x.size = bbox.x.max - bbox.x.min;
		bbox.y.size = bbox.y.max - bbox.y.min;
		if (bbox.z) {
			bbox.z.size = bbox.z.max - bbox.z.min;
		}
	},
	pairiteration: function (c1, c2, curveIntersectionThreshold) {
		const c1b = c1.bbox(), c2b = c2.bbox(), r = 100000, threshold = curveIntersectionThreshold || 0.5;
		if (c1b.x.size + c1b.y.size < threshold &&
			c2b.x.size + c2b.y.size < threshold) {
			return [
				(((r * (c1._t1 + c1._t2)) / 2) | 0) / r +
					"/" +
					(((r * (c2._t1 + c2._t2)) / 2) | 0) / r,
			];
		}
		let cc1 = c1.split(0.5), cc2 = c2.split(0.5), pairs = [
			{ left: cc1.left, right: cc2.left },
			{ left: cc1.left, right: cc2.right },
			{ left: cc1.right, right: cc2.right },
			{ left: cc1.right, right: cc2.left },
		];
		pairs = pairs.filter(function (pair) {
			return utils.bboxoverlap(pair.left.bbox(), pair.right.bbox());
		});
		let results = [];
		if (pairs.length === 0)
			return results;
		pairs.forEach(function (pair) {
			results = results.concat(utils.pairiteration(pair.left, pair.right, threshold));
		});
		results = results.filter(function (v, i) {
			return results.indexOf(v) === i;
		});
		return results;
	},
	getccenter: function (p1, p2, p3) {
		const dx1 = p2.x - p1.x, dy1 = p2.y - p1.y, dx2 = p3.x - p2.x, dy2 = p3.y - p2.y, dx1p = dx1 * cos(quart) - dy1 * sin(quart), dy1p = dx1 * sin(quart) + dy1 * cos(quart), dx2p = dx2 * cos(quart) - dy2 * sin(quart), dy2p = dx2 * sin(quart) + dy2 * cos(quart), 
		// chord midpoints
		mx1 = (p1.x + p2.x) / 2, my1 = (p1.y + p2.y) / 2, mx2 = (p2.x + p3.x) / 2, my2 = (p2.y + p3.y) / 2, 
		// midpoint offsets
		mx1n = mx1 + dx1p, my1n = my1 + dy1p, mx2n = mx2 + dx2p, my2n = my2 + dy2p, 
		// intersection of these lines:
		arc = utils.lli8(mx1, my1, mx1n, my1n, mx2, my2, mx2n, my2n), r = utils.dist(arc, p1);
		// arc start/end values, over mid point:
		let s = atan2(p1.y - arc.y, p1.x - arc.x), m = atan2(p2.y - arc.y, p2.x - arc.x), e = atan2(p3.y - arc.y, p3.x - arc.x), _;
		// determine arc direction (cw/ccw correction)
		if (s < e) {
			// if s<m<e, arc(s, e)
			// if m<s<e, arc(e, s + tau)
			// if s<e<m, arc(e, s + tau)
			if (s > m || m > e) {
				s += tau;
			}
			if (s > e) {
				_ = e;
				e = s;
				s = _;
			}
		}
		else {
			// if e<m<s, arc(e, s)
			// if m<e<s, arc(s, e + tau)
			// if e<s<m, arc(s, e + tau)
			if (e < m && m < s) {
				_ = e;
				e = s;
				s = _;
			}
			else {
				e += tau;
			}
		}
		// assign and done.
		arc.s = s;
		arc.e = e;
		arc.r = r;
		return arc;
	},
	numberSort: function (a, b) {
		return a - b;
	},
};
/**
* Poly Bezier
* @param {[type]} curves [description]
*/
class PolyBezier {
	constructor(curves) {
		this.curves = [];
		this._3d = false;
		if (!!curves) {
			this.curves = curves;
			this._3d = this.curves[0]._3d;
		}
	}
	valueOf() {
		return this.toString();
	}
	toString() {
		return ("[" +
			this.curves
				.map(function (curve) {
				return utils.pointsToString(curve.points);
			})
				.join(", ") +
			"]");
	}
	addCurve(curve) {
		this.curves.push(curve);
		this._3d = this._3d || curve._3d;
	}
	length() {
		return this.curves
			.map(function (v) {
			return v.length();
		})
			.reduce(function (a, b) {
			return a + b;
		});
	}
	curve(idx) {
		return this.curves[idx];
	}
	bbox() {
		const c = this.curves;
		var bbox = c[0].bbox();
		for (var i = 1; i < c.length; i++) {
			utils.expandbox(bbox, c[i].bbox());
		}
		return bbox;
	}
	offset(d) {
		const offset = [];
		this.curves.forEach(function (v) {
			offset.push(...v.offset(d));
		});
		return new PolyBezier(offset);
	}
}
/**
A javascript Bezier curve library by Pomax.

Based on http://pomax.github.io/bezierinfo

This code is MIT licensed.
**/
// math-inlining.
const { abs: abs$1, min, max, cos: cos$1, sin: sin$1, acos: acos$1, sqrt: sqrt$1 } = Math;
const pi$1 = Math.PI;
/**
* Bezier curve constructor.
*
* ...docs pending...
*/
class Bezier {
	constructor(coords) {
		let args = coords && coords.forEach ? coords : Array.from(arguments).slice();
		let coordlen = false;
		if (typeof args[0] === "object") {
			coordlen = args.length;
			const newargs = [];
			args.forEach(function (point) {
				["x", "y", "z"].forEach(function (d) {
					if (typeof point[d] !== "undefined") {
						newargs.push(point[d]);
					}
				});
			});
			args = newargs;
		}
		let higher = false;
		const len = args.length;
		if (coordlen) {
			if (coordlen > 4) {
				if (arguments.length !== 1) {
					throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");
				}
				higher = true;
			}
		}
		else {
			if (len !== 6 && len !== 8 && len !== 9 && len !== 12) {
				if (arguments.length !== 1) {
					throw new Error("Only new Bezier(point[]) is accepted for 4th and higher order curves");
				}
			}
		}
		const _3d = (this._3d =
			(!higher && (len === 9 || len === 12)) ||
				(coords && coords[0] && typeof coords[0].z !== "undefined"));
		const points = (this.points = []);
		for (let idx = 0, step = _3d ? 3 : 2; idx < len; idx += step) {
			var point = {
				x: args[idx],
				y: args[idx + 1],
			};
			if (_3d) {
				point.z = args[idx + 2];
			}
			points.push(point);
		}
		const order = (this.order = points.length - 1);
		const dims = (this.dims = ["x", "y"]);
		if (_3d)
			dims.push("z");
		this.dimlen = dims.length;
		const aligned = utils.align(points, { p1: points[0], p2: points[order] });
		this._linear = !aligned.some((p) => abs$1(p.y) > 0.0001);
		this._lut = [];
		this._t1 = 0;
		this._t2 = 1;
		this.update();
	}
	static quadraticFromPoints(p1, p2, p3, t) {
		if (typeof t === "undefined") {
			t = 0.5;
		}
		// shortcuts, although they're really dumb
		if (t === 0) {
			return new Bezier(p2, p2, p3);
		}
		if (t === 1) {
			return new Bezier(p1, p2, p2);
		}
		// real fitting.
		const abc = Bezier.getABC(2, p1, p2, p3, t);
		return new Bezier(p1, abc.A, p3);
	}
	static cubicFromPoints(S, B, E, t, d1) {
		if (typeof t === "undefined") {
			t = 0.5;
		}
		const abc = Bezier.getABC(3, S, B, E, t);
		if (typeof d1 === "undefined") {
			d1 = utils.dist(B, abc.C);
		}
		const d2 = (d1 * (1 - t)) / t;
		const selen = utils.dist(S, E), lx = (E.x - S.x) / selen, ly = (E.y - S.y) / selen, bx1 = d1 * lx, by1 = d1 * ly, bx2 = d2 * lx, by2 = d2 * ly;
		// derivation of new hull coordinates
		const e1 = { x: B.x - bx1, y: B.y - by1 }, e2 = { x: B.x + bx2, y: B.y + by2 }, A = abc.A, v1 = { x: A.x + (e1.x - A.x) / (1 - t), y: A.y + (e1.y - A.y) / (1 - t) }, v2 = { x: A.x + (e2.x - A.x) / t, y: A.y + (e2.y - A.y) / t }, nc1 = { x: S.x + (v1.x - S.x) / t, y: S.y + (v1.y - S.y) / t }, nc2 = {
			x: E.x + (v2.x - E.x) / (1 - t),
			y: E.y + (v2.y - E.y) / (1 - t),
		};
		// ...done
		return new Bezier(S, nc1, nc2, E);
	}
	static getUtils() {
		return utils;
	}
	getUtils() {
		return Bezier.getUtils();
	}
	static get PolyBezier() {
		return PolyBezier;
	}
	valueOf() {
		return this.toString();
	}
	toString() {
		return utils.pointsToString(this.points);
	}
	toSVG() {
		if (this._3d)
			return false;
		const p = this.points, x = p[0].x, y = p[0].y, s = ["M", x, y, this.order === 2 ? "Q" : "C"];
		for (let i = 1, last = p.length; i < last; i++) {
			s.push(p[i].x);
			s.push(p[i].y);
		}
		return s.join(" ");
	}
	setRatios(ratios) {
		if (ratios.length !== this.points.length) {
			throw new Error("incorrect number of ratio values");
		}
		this.ratios = ratios;
		this._lut = []; //  invalidate any precomputed LUT
	}
	verify() {
		const print = this.coordDigest();
		if (print !== this._print) {
			this._print = print;
			this.update();
		}
	}
	coordDigest() {
		return this.points
			.map(function (c, pos) {
			return "" + pos + c.x + c.y + (c.z ? c.z : 0);
		})
			.join("");
	}
	update() {
		// invalidate any precomputed LUT
		this._lut = [];
		this.dpoints = utils.derive(this.points, this._3d);
		this.computedirection();
	}
	computedirection() {
		const points = this.points;
		const angle = utils.angle(points[0], points[this.order], points[1]);
		this.clockwise = angle > 0;
	}
	length() {
		return utils.length(this.derivative.bind(this));
	}
	static getABC(order = 2, S, B, E, t = 0.5) {
		const u = utils.projectionratio(t, order), um = 1 - u, C = {
			x: u * S.x + um * E.x,
			y: u * S.y + um * E.y,
		}, s = utils.abcratio(t, order), A = {
			x: B.x + (B.x - C.x) / s,
			y: B.y + (B.y - C.y) / s,
		};
		return { A, B, C, S, E };
	}
	getABC(t, B) {
		B = B || this.get(t);
		let S = this.points[0];
		let E = this.points[this.order];
		return Bezier.getABC(this.order, S, B, E, t);
	}
	getLUT(steps) {
		this.verify();
		steps = steps || 100;
		if (this._lut.length === steps) {
			return this._lut;
		}
		this._lut = [];
		// We want a range from 0 to 1 inclusive, so
		// we decrement and then use <= rather than <:
		steps--;
		for (let i = 0, p, t; i < steps; i++) {
			t = i / (steps - 1);
			p = this.compute(t);
			p.t = t;
			this._lut.push(p);
		}
		return this._lut;
	}
	on(point, error) {
		error = error || 5;
		const lut = this.getLUT(), hits = [];
		for (let i = 0, c, t = 0; i < lut.length; i++) {
			c = lut[i];
			if (utils.dist(c, point) < error) {
				hits.push(c);
				t += i / lut.length;
			}
		}
		if (!hits.length)
			return false;
		return (t /= hits.length);
	}
	project(point) {
		// step 1: coarse check
		const LUT = this.getLUT(), l = LUT.length - 1, closest = utils.closest(LUT, point), mpos = closest.mpos, t1 = (mpos - 1) / l, t2 = (mpos + 1) / l, step = 0.1 / l;
		// step 2: fine check
		let mdist = closest.mdist, t = t1, ft = t, p;
		mdist += 1;
		for (let d; t < t2 + step; t += step) {
			p = this.compute(t);
			d = utils.dist(point, p);
			if (d < mdist) {
				mdist = d;
				ft = t;
			}
		}
		ft = ft < 0 ? 0 : ft > 1 ? 1 : ft;
		p = this.compute(ft);
		p.t = ft;
		p.d = mdist;
		return p;
	}
	get(t) {
		return this.compute(t);
	}
	point(idx) {
		return this.points[idx];
	}
	compute(t) {
		if (this.ratios) {
			return utils.computeWithRatios(t, this.points, this.ratios, this._3d);
		}
		return utils.compute(t, this.points, this._3d, this.ratios);
	}
	raise() {
		const p = this.points, np = [p[0]], k = p.length;
		for (let i = 1, pi, pim; i < k; i++) {
			pi = p[i];
			pim = p[i - 1];
			np[i] = {
				x: ((k - i) / k) * pi.x + (i / k) * pim.x,
				y: ((k - i) / k) * pi.y + (i / k) * pim.y,
			};
		}
		np[k] = p[k - 1];
		return new Bezier(np);
	}
	derivative(t) {
		return utils.compute(t, this.dpoints[0]);
	}
	dderivative(t) {
		return utils.compute(t, this.dpoints[1]);
	}
	align() {
		let p = this.points;
		return new Bezier(utils.align(p, { p1: p[0], p2: p[p.length - 1] }));
	}
	curvature(t) {
		return utils.curvature(t, this.dpoints[0], this.dpoints[1], this._3d);
	}
	inflections() {
		return utils.inflections(this.points);
	}
	normal(t) {
		return this._3d ? this.__normal3(t) : this.__normal2(t);
	}
	__normal2(t) {
		const d = this.derivative(t);
		const q = sqrt$1(d.x * d.x + d.y * d.y);
		return { x: -d.y / q, y: d.x / q };
	}
	__normal3(t) {
		// see http://stackoverflow.com/questions/25453159
		const r1 = this.derivative(t), r2 = this.derivative(t + 0.01), q1 = sqrt$1(r1.x * r1.x + r1.y * r1.y + r1.z * r1.z), q2 = sqrt$1(r2.x * r2.x + r2.y * r2.y + r2.z * r2.z);
		r1.x /= q1;
		r1.y /= q1;
		r1.z /= q1;
		r2.x /= q2;
		r2.y /= q2;
		r2.z /= q2;
		// cross product
		const c = {
			x: r2.y * r1.z - r2.z * r1.y,
			y: r2.z * r1.x - r2.x * r1.z,
			z: r2.x * r1.y - r2.y * r1.x,
		};
		const m = sqrt$1(c.x * c.x + c.y * c.y + c.z * c.z);
		c.x /= m;
		c.y /= m;
		c.z /= m;
		// rotation matrix
		const R = [
			c.x * c.x,
			c.x * c.y - c.z,
			c.x * c.z + c.y,
			c.x * c.y + c.z,
			c.y * c.y,
			c.y * c.z - c.x,
			c.x * c.z - c.y,
			c.y * c.z + c.x,
			c.z * c.z,
		];
		// normal vector:
		const n = {
			x: R[0] * r1.x + R[1] * r1.y + R[2] * r1.z,
			y: R[3] * r1.x + R[4] * r1.y + R[5] * r1.z,
			z: R[6] * r1.x + R[7] * r1.y + R[8] * r1.z,
		};
		return n;
	}
	hull(t) {
		let p = this.points, _p = [], q = [], idx = 0;
		q[idx++] = p[0];
		q[idx++] = p[1];
		q[idx++] = p[2];
		if (this.order === 3) {
			q[idx++] = p[3];
		}
		// we lerp between all points at each iteration, until we have 1 point left.
		while (p.length > 1) {
			_p = [];
			for (let i = 0, pt, l = p.length - 1; i < l; i++) {
				pt = utils.lerp(t, p[i], p[i + 1]);
				q[idx++] = pt;
				_p.push(pt);
			}
			p = _p;
		}
		return q;
	}
	split(t1, t2) {
		// shortcuts
		if (t1 === 0 && !!t2) {
			return this.split(t2).left;
		}
		if (t2 === 1) {
			return this.split(t1).right;
		}
		// no shortcut: use "de Casteljau" iteration.
		const q = this.hull(t1);
		const result = {
			left: this.order === 2
				? new Bezier([q[0], q[3], q[5]])
				: new Bezier([q[0], q[4], q[7], q[9]]),
			right: this.order === 2
				? new Bezier([q[5], q[4], q[2]])
				: new Bezier([q[9], q[8], q[6], q[3]]),
			span: q,
		};
		// make sure we bind _t1/_t2 information!
		result.left._t1 = utils.map(0, 0, 1, this._t1, this._t2);
		result.left._t2 = utils.map(t1, 0, 1, this._t1, this._t2);
		result.right._t1 = utils.map(t1, 0, 1, this._t1, this._t2);
		result.right._t2 = utils.map(1, 0, 1, this._t1, this._t2);
		// if we have no t2, we're done
		if (!t2) {
			return result;
		}
		// if we have a t2, split again:
		t2 = utils.map(t2, t1, 1, 0, 1);
		return result.right.split(t2).left;
	}
	extrema() {
		const result = {};
		let roots = [];
		this.dims.forEach(function (dim) {
			let mfn = function (v) {
				return v[dim];
			};
			let p = this.dpoints[0].map(mfn);
			result[dim] = utils.droots(p);
			if (this.order === 3) {
				p = this.dpoints[1].map(mfn);
				result[dim] = result[dim].concat(utils.droots(p));
			}
			result[dim] = result[dim].filter(function (t) {
				return t >= 0 && t <= 1;
			});
			roots = roots.concat(result[dim].sort(utils.numberSort));
		}.bind(this));
		result.values = roots.sort(utils.numberSort).filter(function (v, idx) {
			return roots.indexOf(v) === idx;
		});
		return result;
	}
	bbox() {
		const extrema = this.extrema(), result = {};
		this.dims.forEach(function (d) {
			result[d] = utils.getminmax(this, d, extrema[d]);
		}.bind(this));
		return result;
	}
	overlaps(curve) {
		const lbbox = this.bbox(), tbbox = curve.bbox();
		return utils.bboxoverlap(lbbox, tbbox);
	}
	offset(t, d) {
		if (typeof d !== "undefined") {
			const c = this.get(t), n = this.normal(t);
			const ret = {
				c: c,
				n: n,
				x: c.x + n.x * d,
				y: c.y + n.y * d,
			};
			if (this._3d) {
				ret.z = c.z + n.z * d;
			}
			return ret;
		}
		if (this._linear) {
			const nv = this.normal(0), coords = this.points.map(function (p) {
				const ret = {
					x: p.x + t * nv.x,
					y: p.y + t * nv.y,
				};
				if (p.z && nv.z) {
					ret.z = p.z + t * nv.z;
				}
				return ret;
			});
			return [new Bezier(coords)];
		}
		return this.reduce().map(function (s) {
			if (s._linear) {
				return s.offset(t)[0];
			}
			return s.scale(t);
		});
	}
	simple() {
		if (this.order === 3) {
			const a1 = utils.angle(this.points[0], this.points[3], this.points[1]);
			const a2 = utils.angle(this.points[0], this.points[3], this.points[2]);
			if ((a1 > 0 && a2 < 0) || (a1 < 0 && a2 > 0))
				return false;
		}
		const n1 = this.normal(0);
		const n2 = this.normal(1);
		let s = n1.x * n2.x + n1.y * n2.y;
		if (this._3d) {
			s += n1.z * n2.z;
		}
		return abs$1(acos$1(s)) < pi$1 / 3;
	}
	reduce() {
		// TODO: examine these var types in more detail...
		let i, t1 = 0, t2 = 0, step = 0.01, segment, pass1 = [], pass2 = [];
		// first pass: split on extrema
		let extrema = this.extrema().values;
		if (extrema.indexOf(0) === -1) {
			extrema = [0].concat(extrema);
		}
		if (extrema.indexOf(1) === -1) {
			extrema.push(1);
		}
		for (t1 = extrema[0], i = 1; i < extrema.length; i++) {
			t2 = extrema[i];
			segment = this.split(t1, t2);
			segment._t1 = t1;
			segment._t2 = t2;
			pass1.push(segment);
			t1 = t2;
		}
		// second pass: further reduce these segments to simple segments
		pass1.forEach(function (p1) {
			t1 = 0;
			t2 = 0;
			while (t2 <= 1) {
				for (t2 = t1 + step; t2 <= 1 + step; t2 += step) {
					segment = p1.split(t1, t2);
					if (!segment.simple()) {
						t2 -= step;
						if (abs$1(t1 - t2) < step) {
							// we can never form a reduction
							return [];
						}
						segment = p1.split(t1, t2);
						segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
						segment._t2 = utils.map(t2, 0, 1, p1._t1, p1._t2);
						pass2.push(segment);
						t1 = t2;
						break;
					}
				}
			}
			if (t1 < 1) {
				segment = p1.split(t1, 1);
				segment._t1 = utils.map(t1, 0, 1, p1._t1, p1._t2);
				segment._t2 = p1._t2;
				pass2.push(segment);
			}
		});
		return pass2;
	}
	scale(d) {
		const order = this.order;
		let distanceFn = false;
		if (typeof d === "function") {
			distanceFn = d;
		}
		if (distanceFn && order === 2) {
			return this.raise().scale(distanceFn);
		}
		// TODO: add special handling for degenerate (=linear) curves.
		const clockwise = this.clockwise;
		const r1 = distanceFn ? distanceFn(0) : d;
		const r2 = distanceFn ? distanceFn(1) : d;
		const v = [this.offset(0, 10), this.offset(1, 10)];
		const points = this.points;
		const np = [];
		const o = utils.lli4(v[0], v[0].c, v[1], v[1].c);
		if (!o) {
			throw new Error("cannot scale this curve. Try reducing it first.");
		}
		// move all points by distance 'd' wrt the origin 'o'
		// move end points by fixed distance along normal.
		[0, 1].forEach(function (t) {
			const p = (np[t * order] = utils.copy(points[t * order]));
			p.x += (t ? r2 : r1) * v[t].n.x;
			p.y += (t ? r2 : r1) * v[t].n.y;
		});
		if (!distanceFn) {
			// move control points to lie on the intersection of the offset
			// derivative vector, and the origin-through-control vector
			[0, 1].forEach((t) => {
				if (order === 2 && !!t)
					return;
				const p = np[t * order];
				const d = this.derivative(t);
				const p2 = { x: p.x + d.x, y: p.y + d.y };
				np[t + 1] = utils.lli4(p, p2, o, points[t + 1]);
			});
			return new Bezier(np);
		}
		// move control points by "however much necessary to
		// ensure the correct tangent to endpoint".
		[0, 1].forEach(function (t) {
			if (order === 2 && !!t)
				return;
			var p = points[t + 1];
			var ov = {
				x: p.x - o.x,
				y: p.y - o.y,
			};
			var rc = distanceFn ? distanceFn((t + 1) / order) : d;
			if (distanceFn && !clockwise)
				rc = -rc;
			var m = sqrt$1(ov.x * ov.x + ov.y * ov.y);
			ov.x /= m;
			ov.y /= m;
			np[t + 1] = {
				x: p.x + rc * ov.x,
				y: p.y + rc * ov.y,
			};
		});
		return new Bezier(np);
	}
	outline(d1, d2, d3, d4) {
		d2 = typeof d2 === "undefined" ? d1 : d2;
		const reduced = this.reduce(), len = reduced.length, fcurves = [];
		let bcurves = [], p, alen = 0, tlen = this.length();
		const graduated = typeof d3 !== "undefined" && typeof d4 !== "undefined";
		function linearDistanceFunction(s, e, tlen, alen, slen) {
			return function (v) {
				const f1 = alen / tlen, f2 = (alen + slen) / tlen, d = e - s;
				return utils.map(v, 0, 1, s + f1 * d, s + f2 * d);
			};
		}
		// form curve oulines
		reduced.forEach(function (segment) {
			const slen = segment.length();
			if (graduated) {
				fcurves.push(segment.scale(linearDistanceFunction(d1, d3, tlen, alen, slen)));
				bcurves.push(segment.scale(linearDistanceFunction(-d2, -d4, tlen, alen, slen)));
			}
			else {
				fcurves.push(segment.scale(d1));
				bcurves.push(segment.scale(-d2));
			}
			alen += slen;
		});
		// reverse the "return" outline
		bcurves = bcurves
			.map(function (s) {
			p = s.points;
			if (p[3]) {
				s.points = [p[3], p[2], p[1], p[0]];
			}
			else {
				s.points = [p[2], p[1], p[0]];
			}
			return s;
		})
			.reverse();
		// form the endcaps as lines
		const fs = fcurves[0].points[0], fe = fcurves[len - 1].points[fcurves[len - 1].points.length - 1], bs = bcurves[len - 1].points[bcurves[len - 1].points.length - 1], be = bcurves[0].points[0], ls = utils.makeline(bs, fs), le = utils.makeline(fe, be), segments = [ls].concat(fcurves).concat([le]).concat(bcurves);
		return new PolyBezier(segments);
	}
	outlineshapes(d1, d2, curveIntersectionThreshold) {
		d2 = d2 || d1;
		const outline = this.outline(d1, d2).curves;
		const shapes = [];
		for (let i = 1, len = outline.length; i < len / 2; i++) {
			const shape = utils.makeshape(outline[i], outline[len - i], curveIntersectionThreshold);
			shape.startcap.virtual = i > 1;
			shape.endcap.virtual = i < len / 2 - 1;
			shapes.push(shape);
		}
		return shapes;
	}
	intersects(curve, curveIntersectionThreshold) {
		if (!curve)
			return this.selfintersects(curveIntersectionThreshold);
		if (curve.p1 && curve.p2) {
			return this.lineIntersects(curve);
		}
		if (curve instanceof Bezier) {
			curve = curve.reduce();
		}
		return this.curveintersects(this.reduce(), curve, curveIntersectionThreshold);
	}
	lineIntersects(line) {
		const mx = min(line.p1.x, line.p2.x), my = min(line.p1.y, line.p2.y), MX = max(line.p1.x, line.p2.x), MY = max(line.p1.y, line.p2.y);
		return utils.roots(this.points, line).filter((t) => {
			var p = this.get(t);
			return utils.between(p.x, mx, MX) && utils.between(p.y, my, MY);
		});
	}
	selfintersects(curveIntersectionThreshold) {
		// "simple" curves cannot intersect with their direct
		// neighbour, so for each segment X we check whether
		// it intersects [0:x-2][x+2:last].
		const reduced = this.reduce(), len = reduced.length - 2, results = [];
		for (let i = 0, result, left, right; i < len; i++) {
			left = reduced.slice(i, i + 1);
			right = reduced.slice(i + 2);
			result = this.curveintersects(left, right, curveIntersectionThreshold);
			results.push(...result);
		}
		return results;
	}
	curveintersects(c1, c2, curveIntersectionThreshold) {
		const pairs = [];
		// step 1: pair off any overlapping segments
		c1.forEach(function (l) {
			c2.forEach(function (r) {
				if (l.overlaps(r)) {
					pairs.push({ left: l, right: r });
				}
			});
		});
		// step 2: for each pairing, run through the convergence algorithm.
		let intersections = [];
		pairs.forEach(function (pair) {
			const result = utils.pairiteration(pair.left, pair.right, curveIntersectionThreshold);
			if (result.length > 0) {
				intersections = intersections.concat(result);
			}
		});
		return intersections;
	}
	arcs(errorThreshold) {
		errorThreshold = errorThreshold || 0.5;
		return this._iterate(errorThreshold, []);
	}
	_error(pc, np1, s, e) {
		const q = (e - s) / 4, c1 = this.get(s + q), c2 = this.get(e - q), ref = utils.dist(pc, np1), d1 = utils.dist(pc, c1), d2 = utils.dist(pc, c2);
		return abs$1(d1 - ref) + abs$1(d2 - ref);
	}
	_iterate(errorThreshold, circles) {
		let t_s = 0, t_e = 1, safety;
		// we do a binary search to find the "good `t` closest to no-longer-good"
		do {
			safety = 0;
			// step 1: start with the maximum possible arc
			t_e = 1;
			// points:
			let np1 = this.get(t_s), np2, np3, arc, prev_arc;
			// booleans:
			let curr_good = false, prev_good = false, done;
			// numbers:
			let t_m = t_e, prev_e = 1;
			// step 2: find the best possible arc
			do {
				prev_good = curr_good;
				prev_arc = arc;
				t_m = (t_s + t_e) / 2;
				np2 = this.get(t_m);
				np3 = this.get(t_e);
				arc = utils.getccenter(np1, np2, np3);
				//also save the t values
				arc.interval = {
					start: t_s,
					end: t_e,
				};
				let error = this._error(arc, np1, t_s, t_e);
				curr_good = error <= errorThreshold;
				done = prev_good && !curr_good;
				if (!done)
					prev_e = t_e;
				// this arc is fine: we can move 'e' up to see if we can find a wider arc
				if (curr_good) {
					// if e is already at max, then we're done for this arc.
					if (t_e >= 1) {
						// make sure we cap at t=1
						arc.interval.end = prev_e = 1;
						prev_arc = arc;
						// if we capped the arc segment to t=1 we also need to make sure that
						// the arc's end angle is correct with respect to the bezier end point.
						if (t_e > 1) {
							let d = {
								x: arc.x + arc.r * cos$1(arc.e),
								y: arc.y + arc.r * sin$1(arc.e),
							};
							arc.e += utils.angle({ x: arc.x, y: arc.y }, d, this.get(1));
						}
						break;
					}
					// if not, move it up by half the iteration distance
					t_e = t_e + (t_e - t_s) / 2;
				}
				else {
					// this is a bad arc: we need to move 'e' down to find a good arc
					t_e = t_m;
				}
			} while (!done && safety++ < 100);
			if (safety >= 100) {
				break;
			}
			// console.log("L835: [F] arc found", t_s, prev_e, prev_arc.x, prev_arc.y, prev_arc.s, prev_arc.e);
			prev_arc = prev_arc ? prev_arc : arc;
			circles.push(prev_arc);
			t_s = prev_e;
		} while (t_e < 1);
		return circles;
	}
}
export { Bezier };

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2RmLWN1cnZ5LXdhbGxzL3NyYy9saWIvYmV6aWVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLGlCQUFpQjtBQUNqQixNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBRXZELHlDQUF5QztBQUN6QyxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2hELENBQUM7QUFFRCxpQkFBaUI7QUFDakIsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFDakIsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQ1osS0FBSyxHQUFHLEVBQUUsR0FBRyxDQUFDO0FBQ2Qsc0NBQXNDO0FBQ3RDLE9BQU8sR0FBRyxRQUFRO0FBQ2xCLDJEQUEyRDtBQUMzRCxJQUFJLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixJQUFJLGdCQUFnQixFQUNsRCxJQUFJLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixJQUFJLENBQUMsZ0JBQWdCO0FBQ25ELGtEQUFrRDtBQUNsRCxJQUFJLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBRTdCLDJCQUEyQjtBQUMzQixNQUFNLEtBQUssR0FBRztJQUNiLDBIQUEwSDtJQUMxSCxPQUFPLEVBQUU7UUFDUixDQUFDLDBDQUEwQztRQUMzQywwQ0FBMEM7UUFDMUMsQ0FBQywwQ0FBMEM7UUFDM0MsMENBQTBDO1FBQzFDLENBQUMsMENBQTBDO1FBQzNDLDBD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Q0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7Z0JBQzlELENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDOUQsQ0FBQyxFQUFFLENBQUMsR0FBRztvQkFDTixDQUFDLENBQUMsS0FBSztvQkFDUCxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7Z0JBQzlELENBQUMsRUFBRSxDQUFDO2FBQ0osQ0FBQztTQUNGO0lBQ0YsQ0FBQztJQUVELE1BQU0sRUFBRSxVQUFVLE1BQU0sRUFBRSxHQUFHO1FBQzVCLE1BQU0sT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNuQixLQUFLLElBQUksQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzlELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNoQixLQUFLLElBQUksQ0FB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QUUsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO0lBQ2pDLENBQUM7SUFFRCxJQUFJLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO1FBQzdCLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ2QsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ1QsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ1QsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ1QsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ1QsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ1QsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQ1QsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDWCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRCxHQUFHLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTtRQUNwQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRUQsUUFBUSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7UUFDekIsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDZCxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDVCxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDVCxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFDVCxFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUNsQixFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLE9BQU8sSUFBSSxNQUFNLENBQ2hCLEVBQUUsRUFDRixFQUFFLEVBQ0YsRUFBRSxHQUFHLEVBQUUsRUFDUCxFQUFFLEdBQUcsRUFBRSxFQUNQLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUNYLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUNYLEVBQUUsRUFDRixFQUFFLENBQ0YsQ0FBQztJQUNILENBQUM7SUFFRCxRQUFRLEVBQUUsVUFBVSxRQUFRO1FBQzNCLElBQUksRUFBRSxHQUFHLElBQUksRUFDWixFQUFFLEdBQUcsSUFBSSxFQUNULEVBQUUsR0FBRyxJQUFJLEVBQ1QsRUFBRSxHQUFHLElBQUksQ0FBQztRQUNYLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDO1lBQzNCLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN0QixJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7Z0JBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQ3JDLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRztnQkFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDckMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHO2dCQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztZQUNyQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUc7Z0JBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTztZQUNOLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFO1lBQzFELENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFO1NBQzFELENBQUM7SUFDSCxDQUFDO0lBRUQsa0JBQWtCLEVBQUUsVUFDbkIsRUFBRSxFQUNGLEtBQUssRUFDTCxFQUFFLEVBQ0YsS0FBSyxFQUNMLDBCQUEwQjtRQUUxQixJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDO1lBQUUsT0FBTyxFQUFFLENBQUM7UUFDaEQsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO1FBQ3pCLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pELE1BQU0sRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3pELEVBQUUsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFO1lBQ3RCLElBQUksRUFBRSxDQUFDLE9BQU87Z0JBQUUsT0FBTztZQUN2QixFQUFFLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRTtnQkFDdEIsSUFBSSxFQUFFLENBQUMsT0FBTztvQkFBRSxPQUFPO2dCQUN2QixNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUNuQixHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztvQkFDWixHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztvQkFDWixHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztvQkFDWixHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztvQkFDWixhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUN4QjtZQUNGLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLGFBQWEsQ0FBQztJQUN0QixDQUFDO0lBRUQsU0FBUyxFQUFFLFVBQVUsT0FBTyxFQUFFLElBQUksRUFBRSwwQkFBMEI7UUFDN0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDL0IsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDbEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEUsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEUsTUFBTSxLQUFLLEdBQUc7WUFDYixRQUFRLEVBQUUsS0FBSztZQUNmLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLElBQUksRUFBRSxJQUFJO1lBQ1YsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ2pELENBQUM7UUFDRixLQUFLLENBQUMsYUFBYSxHQUFHLFVBQVUsRUFBRTtZQUNqQyxPQUFPLEtBQUssQ0FBQyxrQkFBa0IsQ0FDOUIsS0FBSyxFQUNMLEtBQUssQ0FBQyxJQUFJLEVBQ1YsRUFBRSxFQUNGLEVBQUUsQ0FBQyxJQUFJLEVBQ1AsMEJBQTBCLENBQzFCLENBQUM7UUFDSCxDQUFDLENBQUM7UUFDRixPQUFPLEtBQUssQ0FBQztJQUNkLENBQUM7SUFFRCxTQUFTLEVBQUUsVUFBVSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUk7UUFDbEMsSUFBSSxDQUFDLElBQUk7WUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDckMsSUFBSSxHQUFHLEdBQUcsSUFBSSxFQUNiLEdBQUcsR0FBRyxJQUFJLEVBQ1YsQ0FBQyxFQUNELENBQUMsQ0FBQztRQUNILElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtZQUMzQixJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDeEI7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDM0IsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNiO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNoRCxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ1osQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFO2dCQUNmLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDWDtZQUNELElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRTtnQkFDZixHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ1g7U0FDRDtRQUNELE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQ3RFLENBQUM7SUFFRCxLQUFLLEVBQUUsVUFBVSxNQUFNLEVBQUUsSUFBSTtRQUM1QixNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsRUFDbkIsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUNkLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQzFDLENBQUMsR0FBRyxVQUFVLENBQUM7WUFDZCxPQUFPO2dCQUNOLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUM1QyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUM1QyxDQUFDO1FBQ0gsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFFRCxLQUFLLEVBQUUsVUFBVSxNQUFNLEVBQUUsSUFBSTtRQUM1QixJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUUxRCxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNoQyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMxQyxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUM7WUFDekIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekIsQ0FBQyxDQUFDO1FBRUYsSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO1lBQ2hCLE1BQU0sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3JCLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNoQixDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDaEIsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ1osTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQzlCLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQ1gsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUNuQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdEIsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDL0I7aUJBQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQzlCLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN0RDtZQUNELE9BQU8sRUFBRSxDQUFDO1NBQ1Y7UUFFRCw4RkFBOEY7UUFDOUYsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDdEIsRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ2pCLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNqQixFQUFFLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVuQixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUNqQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQzVCLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFDcEIsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVSLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDOUIsNkJBQTZCO1lBQzdCLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7Z0JBQzlCLGlEQUFpRDtnQkFDakQsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRTtvQkFDOUIsMkNBQTJDO29CQUMzQyxPQUFPLEVBQUUsQ0FBQztpQkFDVjtnQkFDRCxtQkFBbUI7Z0JBQ25CLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDL0I7WUFDRCxzQkFBc0I7WUFDdEIsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFDaEMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDWixPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3BEO1FBRUQsbURBQW1EO1FBRW5ELENBQUMsSUFBSSxDQUFDLENBQUM7UUFDUCxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVQLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUM1QixFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFDVixDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFDN0MsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQ1YsWUFBWSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFFdkMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBQ3ZCLElBQUksWUFBWSxHQUFHLENBQUMsRUFBRTtZQUNyQixNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQ2pCLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsRUFDdEIsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDZCxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQ2hCLE1BQU0sR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDcEMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFDbEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFDYixFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztZQUNmLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQy9CLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkMsRUFBRSxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDM0MsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ25DO2FBQU0sSUFBSSxZQUFZLEtBQUssQ0FBQyxFQUFFO1lBQzlCLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDbEMsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQixFQUFFLEdBQUcsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQixPQUFPLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUMvQjthQUFNO1lBQ04sTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlCLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDbkIsRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDbEIsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN4QztJQUNGLENBQUM7SUFFRCxNQUFNLEVBQUUsVUFBVSxDQUFDO1FBQ2xCLDJCQUEyQjtRQUMzQixJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ25CLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDYixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNSLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ1IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ1osTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQzlCLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQ1gsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUNuQixFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdEIsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzthQUNoQjtpQkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDOUIsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDckM7WUFDRCxPQUFPLEVBQUUsQ0FBQztTQUNWO1FBRUQsK0JBQStCO1FBQy9CLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDbkIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUNiLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDVixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ1osT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3JCO1lBQ0QsT0FBTyxFQUFFLENBQUM7U0FDVjtRQUVELE9BQU8sRUFBRSxDQUFDO0lBQ1gsQ0FBQztJQUVELFNBQVMsRUFBRSxVQUFVLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLO1FBQ3pDLElBQUksR0FBRyxFQUNOLEdBQUcsRUFDSCxHQUFHLEVBQ0gsRUFBRSxFQUNGLENBQUMsR0FBRyxDQUFDLEVBQ0wsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVQLEVBQUU7UUFDRixtREFBbUQ7UUFDbkQsRUFBRTtRQUNGLDJCQUEyQjtRQUMzQiw4QkFBOEI7UUFDOUIsOEJBQThCO1FBQzlCLEVBQUU7UUFDRixvRUFBb0U7UUFDcEUsRUFBRTtRQUNGLHdDQUF3QztRQUN4QyxFQUFFO1FBQ0YsbUVBQW1FO1FBQ25FLG1FQUFtRTtRQUNuRSw4Q0FBOEM7UUFDOUMsRUFBRTtRQUVGLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQy9CLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2hDLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFcEMsSUFBSSxHQUFHLEVBQUU7WUFDUixHQUFHLEdBQUcsSUFBSSxDQUNULEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDL0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FDL0IsQ0FBQztZQUNGLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDcEM7YUFBTTtZQUNOLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlCLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUN4QjtRQUVELElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFO1lBQzNCLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztTQUN0QjtRQUVELENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2QsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFFZCx3REFBd0Q7UUFDeEQsdURBQXVEO1FBQ3ZELHFEQUFxRDtRQUNyRCxtQ0FBbUM7UUFDbkMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNYLDREQUE0RDtZQUM1RCwrREFBK0Q7WUFDL0QsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzRCxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNELEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDN0IsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUN6QyxDQUFDO0lBRUQsV0FBVyxFQUFFLFVBQVUsTUFBTTtRQUM1QixJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUFFLE9BQU8sRUFBRSxDQUFDO1FBRWpDLGtFQUFrRTtRQUVsRSxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQ3hFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ25CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ25CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ25CLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ25CLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUN0QyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUM3QixFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBRW5CLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUU7WUFDL0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFO2dCQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7Z0JBQ2pCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztvQkFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDakM7WUFDRCxPQUFPLEVBQUUsQ0FBQztTQUNWO1FBRUQsTUFBTSxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDaEMsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQ25CLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRWIsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFBRSxPQUFPLEVBQUUsQ0FBQztRQUUxQyxPQUFPLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztZQUMxRCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QixDQUFDLENBQUMsQ0FBQztJQUNKLENBQUM7SUFFRCxXQUFXLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRTtRQUM1QixNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsRUFDdEIsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFFbkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDM0MsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNkLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQ2hCLENBQUMsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQ2hCLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN0QyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFBRSxPQUFPLEtBQUssQ0FBQztTQUNsQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELFNBQVMsRUFBRSxVQUFVLElBQUksRUFBRSxLQUFLO1FBQy9CLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUU7WUFDN0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7U0FDekI7UUFDRCxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFO1lBQzdCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1NBQ3pCO1FBQ0QsSUFBSSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFO1lBQ3hDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1NBQ3pCO1FBQ0QsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRTtZQUM3QixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztTQUN6QjtRQUNELElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUU7WUFDN0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7U0FDekI7UUFDRCxJQUFJLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUU7WUFDeEMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7U0FDekI7UUFDRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0MsSUFBSSxJQUFJLENBQUMsQ0FBQyxFQUFFO1lBQ1gsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUMzQztRQUNELElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ3RDLElBQUksSUFBSSxDQUFDLENBQUMsRUFBRTtZQUNYLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1NB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UUFFOUIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQzdCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFDeEIsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxFQUN4QixHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDYixHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDYixHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFDYixHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztRQUNmLHFDQUFxQztRQUNyQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsRUFDeEMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUNuQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFDVCxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFDekUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMs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QUM7SUFDMUMsQ0FBQztJQUVELFdBQVcsQ0FBQyxDQUFDO1FBQ1osT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVELEtBQUs7UUFDSixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3BCLE9BQU8sSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQsU0FBUyxDQUFDLENBQUM7UUFDVixPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVELFdBQVc7UUFDVixPQUFPLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxNQUFNLENBQUMsQ0FBQztRQUNQLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQsU0FBUyxDQUFDLENBQUM7UUFDVixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdCLE1BQU0sQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFD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Q0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDdkIsR0FBRyxHQUFHLE1BQU0sQ0FBQztTQUNiLFFBQVEsR0FBRyxHQUFHLENBQUMsRUFBRTtRQUNsQixPQUFPLE9BQU8sQ0FBQztJQUNoQixDQUFDO0NBQ0Q7QUFFRCxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMiLCJmaWxlIjoibGliL2Jlemllci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIG1hdGgtaW5saW5pbmcuXG5jb25zdCB7IGFicywgY29zLCBzaW4sIGFjb3MsIGF0YW4yLCBzcXJ0LCBwb3cgfSA9IE1hdGg7XG5cbi8vIGN1YmUgcm9vdCBmdW5jdGlvbiB5aWVsZGluZyByZWFsIHJvb3RzXG5mdW5jdGlvbiBjcnQodikge1xuXHRyZXR1cm4gdiA8IDAgPyAtcG93KC12LCAxIC8gMykgOiBwb3codiwgMSAvIDMpO1xufVxuXG4vLyB0cmlnIGNvbnN0YW50c1xuY29uc3QgcGkgPSBNYXRoLlBJLFxuXHR0YXUgPSAyICogcGksXG5cdHF1YXJ0ID0gcGkgLyAyLFxuXHQvLyBmbG9hdCBwcmVjaXNpb24gc2lnbmlmaWNhbnQgZGVjaW1hbFxuXHRlcHNpbG9uID0gMC4wMDAwMDEsXG5cdC8vIGV4dHJlbWFzIHVzZWQgaW4gYmJveCBjYWxjdWxhdGlvbiBhbmQgc2ltaWxhciBhbGdvcml0aG1zXG5cdG5NYXggPSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiB8fCA5MDA3MTk5MjU0NzQwOTkxLFxuXHRuTWluID0gTnVtYmVyLk1JTl9TQUZFX0lOVEVHRVIgfHwgLTkwMDcxOTkyNTQ3NDA5OTEsXG5cdC8vIGEgemVybyBjb29yZGluYXRlLCB3aGljaCBpcyBzdXJwcmlzaW5nbHkgdXNlZnVsXG5cdFpFUk8gPSB7IHg6IDAsIHk6IDAsIHo6IDAgfTtcblxuLy8gQmV6aWVyIHV0aWxpdHkgZnVuY3Rpb25zXG5jb25zdCB1dGlscyA9IHtcblx0Ly8gTGVnZW5kcmUtR2F1c3MgYWJzY2lzc2FlIHdpdGggbj0yNCAoeF9pIHZhbHVlcywgZGVmaW5lZCBhdCBpPW4gYXMgdGhlIHJvb3RzIG9mIHRoZSBudGggb3JkZXIgTGVnZW5kcmUgcG9seW5vbWlhbCBQbih4KSlcblx0VHZhbHVlczogW1xuXHRcdC0wLjA2NDA1Njg5Mjg2MjYwNTYyNjA4NTA0MzA4MjYyNDc0NTAzODU5MDksXG5cdFx0MC4wNjQwNTY4OTI4NjI2MDU2MjYwODUwNDMwODI2MjQ3NDUwMzg1OTA5LFxuXHRcdC0wLjE5MTExODg2NzQ3MzYxNjMwOTE1ODYzOTgyMDc1NzA2OTYzMTg0MDQsXG5cdFx0MC4xOTExMTg4Njc0NzM2MTYzMDkxNTg2Mzk4MjA3NTcwNjk2MzE4NDA0LFxuXHRcdC0wLjMxNTA0MjY3OTY5NjE2MzM3NDM4Njc5MzI5MTMxOTgxMDI0MDc4NjQsXG5cdFx0MC4zMTUwNDI2Nzk2OTYxNjMzNzQzODY3OTMyOTEzMTk4MTAyNDA3ODY0LFxuXHRcdC0wLjQzMzc5MzUwNzYyNjA0NTEzODQ4NzA4NDIzMTkxMzM0OTcxMjQ1MjQsXG5cdFx0MC40MzM3OTM1MDc2MjYwNDUxMzg0ODcwODQyMzE5MTMzNDk3MTI0NTI0LFxuXHRcdC0wLjU0NTQyMTQ3MTM4ODgzOTUzNTY1ODM3NTYxNzIxODM3MjM3MDAxMDcsXG5cdFx0MC41NDU0MjE0NzEzODg4Mzk1MzU2NTgzNzU2MTcyMTgzNzIzNzAwMTA3LFxuXHRcdC0wLjY0ODA5MzY1MTkzNjk3NTU2OTI1MjQ5NTc4NjkxMDc0NzYyNjY2OTYsXG5cdFx0MC42NDgwOTM2NTE5MzY5NzU1NjkyNTI0OTU3ODY5MTA3NDc2MjY2Njk2LFxuXHRcdC0wLjc0MDEyNDE5MTU3ODU1NDM2NDI0MzgyODEwMzA5OTk3ODQyNTUyMzIsXG5cdFx0MC43NDAxMjQxOTE1Nzg1NTQzNjQyNDM4MjgxMDMwOTk5Nzg0MjU1MjMyLFxuXHRcdC0wLjgyMDAwMTk4NTk3MzkwMjkyMTk1Mzk0OTg3MjY2OTc0NTIwODA3NjEsXG5cdFx0MC44MjAwMDE5ODU5NzM5MDI5MjE5NTM5NDk4NzI2Njk3NDUyMDgwNzYxLFxuXHRcdC0wLjg4NjQxNTUyNzAwNDQwMTAzNDIxMzE1NDM0MTk4MjE5Njc1NTA4NzMsXG5cdFx0MC44ODY0MTU1MjcwMDQ0MDEwMzQyMTMxNTQzNDE5ODIxOTY3NTUwODczLFxuXHRcdC0wLjkzODI3NDU1MjAwMjczMjc1ODUyMzY0OTAwMTcwODcyMTQ0OTY1NDgsXG5cdFx0MC45MzgyNzQ1NTIwMDI3MzI3NTg1MjM2NDkwMDE3MDg3MjE0NDk2NTQ4LFxuXHRcdC0wLjk3NDcyODU1NTk3MTMwOTQ5ODE5ODM5MTk5MzAwODE2OTA2MTc0MTEsXG5cdFx0MC45NzQ3Mjg1NTU5NzEzMDk0OTgxOTgzOTE5OTMwMDgxNjkwNjE3NDExLFxuXHRcdC0wLjk5NTE4NzIxOTk5NzAyMTM2MDE3OTk5NzQwOTcwMDczNjgxMTg3NDUsXG5cdFx0MC45OTUxODcyMTk5OTcwMjEzNjAxNzk5OTc0MDk3MDA3MzY4MTE4NzQ1LFxuXHRdLFxuXG5cdC8vIExlZ2VuZHJlLUdhdXNzIHdlaWdodHMgd2l0aCBuPTI0ICh3X2kgdmFsdWVzLCBkZWZpbmVkIGJ5IGEgZnVuY3Rpb24gbGlua2VkIHRvIGluIHRoZSBCZXppZXIgcHJpbWVyIGFydGljbGUpXG5cdEN2YWx1ZXM6IFtcblx0XHQwLjEyNzkzODE5NTM0Njc1MjE1Njk3NDA1NjE2NTIyNDY5NTM3MTg1MTcsXG5cdFx0MC4xMjc5MzgxOTUzNDY3NTIxNTY5NzQwNTYxNjUyMjQ2OTUzNzE4NTE3LFxuXHRcdDAuMTI1ODM3NDU2MzQ2ODI4Mjk2MTIxMzc1MzgyNTExMTgzNjg4NzI2NCxcblx0XHQwLjEyNTgzNzQ1NjM0NjgyODI5NjEyMTM3NTM4MjUxMTE4MzY4ODcyNjQsXG5cdFx0MC4xMjE2NzA0NzI5Mjc4MDMzOTEyMDQ0NjMxNTM0NzYyNjI0MjU2MDcsXG5cdFx0MC4xMjE2NzA0NzI5Mjc4MDMzOTEyMDQ0NjMxNTM0NzYyNjI0MjU2MDcsXG5cdFx0MC4xMTU1MDU2NjgwNTM3MjU2MDEzNTMzNDQ0ODM5MDY3ODM1NTk4NjIyLFxuXHRcdDAuMTE1NTA1NjY4MDUzNzI1NjAxMzUzMzQ0NDgzOTA2NzgzNTU5ODYyMixcblx0XHQwLjEwNzQ0NDI3MDExNTk2NTYzNDc4MjU3NzM0MjQ0NjYwNjIyMjc5NDYsXG5cdFx0MC4xMDc0NDQyNzAxMTU5NjU2MzQ3ODI1NzczNDI0NDY2MDYyMjI3OTQ2LFxuXHRcdDAuMDk3NjE4NjUyMTA0MTEzODg4MjY5ODgwNjY0NDY0MjQ3MTU0NDI3OSxcblx0XHQwLjA5NzYxODY1MjEwNDExMzg4ODI2OTg4MDY2NDQ2NDI0NzE1NDQyNzksXG5cdFx0MC4wODYxOTAxNjE1MzE5NTMyNzU5MTcxODUyMDI5ODM3NDI2NjcxODUsXG5cdFx0MC4wODYxOTAxNjE1MzE5NTMyNzU5MTcxODUyMDI5ODM3NDI2NjcxODUsXG5cdFx0MC4wNzMzNDY0ODE0MTEwODAzMDU3MzQwMzM2MTUyNTMxMTY1MTgxMTkzLFxuXHRcdDAuMDczMzQ2NDgxNDExMDgwMzA1NzM0MDMzNjE1MjUzMTE2NTE4MTE5Myxcblx0XHQwLjA1OTI5ODU4NDkxNTQzNjc4MDc0NjM2Nzc1ODUwMDEwODU4NDU0MTIsXG5cdFx0MC4wNTkyOTg1ODQ5MTU0MzY3ODA3NDYzNjc3NTg1MDAxMDg1ODQ1NDEyLFxuXHRcdDAuMDQ0Mjc3NDM4ODE3NDE5ODA2MTY4NjAyNzQ4MjExMzM4MjI4ODU5Myxcblx0XHQwLjA0NDI3NzQzODgxNzQxOTgwNjE2ODYwMjc0ODIxMTMzODIyODg1OTMsXG5cdFx0MC4wMjg1MzEzODg2Mjg5MzM2NjMxODEzMDc4MTU5NTE4NzgyODY0NDkxLFxuXHRcdDAuMDI4NTMxMzg4NjI4OTMzNjYzMTgxMzA3ODE1OTUxODc4Mjg2NDQ5MSxcblx0XHQwLjAxMjM0MTIyOTc5OTk4NzE5OTU0NjgwNTY2NzA3MDAzNzI5MTU3NTksXG5cdFx0MC4wMTIzNDEyMjk3OTk5ODcxOTk1NDY4MDU2NjcwNzAwMzcyOTE1NzU5LFxuXHRdLFxuXG5cdGFyY2ZuOiBmdW5jdGlvbiAodCwgZGVyaXZhdGl2ZUZuKSB7XG5cdFx0Y29uc3QgZCA9IGRlcml2YXRpdmVGbih0KTtcblx0XHRsZXQgbCA9IGQueCAqIGQueCArIGQueSAqIGQueTtcblx0XHRpZiAodHlwZW9mIGQueiAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0bCArPSBkLnogKiBkLno7XG5cdFx0fVxuXHRcdHJldHVybiBzcXJ0KGwpO1xuXHR9LFxuXG5cdGNvbXB1dGU6IGZ1bmN0aW9uICh0LCBwb2ludHMsIF8zZCkge1xuXHRcdC8vIHNob3J0Y3V0c1xuXHRcdGlmICh0ID09PSAwKSB7XG5cdFx0XHRwb2ludHNbMF0udCA9IDA7XG5cdFx0XHRyZXR1cm4gcG9pbnRzWzBdO1xuXHRcdH1cblxuXHRcdGNvbnN0IG9yZGVyID0gcG9pbnRzLmxlbmd0aCAtIDE7XG5cblx0XHRpZiAodCA9PT0gMSkge1xuXHRcdFx0cG9pbnRzW29yZGVyXS50ID0gMTtcblx0XHRcdHJldHVybiBwb2ludHNbb3JkZXJdO1xuXHRcdH1cblxuXHRcdGNvbnN0IG10ID0gMSAtIHQ7XG5cdFx0bGV0IHAgPSBwb2ludHM7XG5cblx0XHQvLyBjb25zdGFudD9cblx0XHRpZiAob3JkZXIgPT09IDApIHtcblx0XHRcdHBvaW50c1swXS50ID0gdDtcblx0XHRcdHJldHVybiBwb2ludHNbMF07XG5cdFx0fVxuXG5cdFx0Ly8gbGluZWFyP1xuXHRcdGlmIChvcmRlciA9PT0gMSkge1xuXHRcdFx0Y29uc3QgcmV0ID0ge1xuXHRcdFx0XHR4OiBtdCAqIHBbMF0ueCArIHQgKiBwWzFdLngsXG5cdFx0XHRcdHk6IG10ICogcFswXS55ICsgdCAqIHBbMV0ueSxcblx0XHRcdFx0dDogdCxcblx0XHRcdH07XG5cdFx0XHRpZiAoXzNkKSB7XG5cdFx0XHRcdHJldC56ID0gbXQgKiBwWzBdLnogKyB0ICogcFsxXS56O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHJldDtcblx0XHR9XG5cblx0XHQvLyBxdWFkcmF0aWMvY3ViaWMgY3VydmU/XG5cdFx0aWYgKG9yZGVyIDwgNCkge1xuXHRcdFx0bGV0IG10MiA9IG10ICogbXQsXG5cdFx0XHRcdHQyID0gdCAqIHQsXG5cdFx0XHRcdGEsXG5cdFx0XHRcdGIsXG5cdFx0XHRcdGMsXG5cdFx0XHRcdGQgPSAwO1xuXHRcdFx0aWYgKG9yZGVyID09PSAyKSB7XG5cdFx0XHRcdHAgPSBbcFswXSwgcFsxXSwgcFsyXSwgWkVST107XG5cdFx0XHRcdGEgPSBtdDI7XG5cdFx0XHRcdGIgPSBtdCAqIHQgKiAyO1xuXHRcdFx0XHRjID0gdDI7XG5cdFx0XHR9IGVsc2UgaWYgKG9yZGVyID09PSAzKSB7XG5cdFx0XHRcdGEgPSBtdDIgKiBtdDtcblx0XHRcdFx0YiA9IG10MiAqIHQgKiAzO1xuXHRcdFx0XHRjID0gbXQgKiB0MiAqIDM7XG5cdFx0XHRcdGQgPSB0ICogdDI7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCByZXQgPSB7XG5cdFx0XHRcdHg6IGEgKiBwWzBdLnggKyBiICogcFsxXS54ICsgYyAqIHBbMl0ueCArIGQgKiBwWzNdLngsXG5cdFx0XHRcdHk6IGEgKiBwWzBdLnkgKyBiICogcFsxXS55ICsgYyAqIHBbMl0ueSArIGQgKiBwWzNdLnksXG5cdFx0XHRcdHQ6IHQsXG5cdFx0XHR9O1xuXHRcdFx0aWYgKF8zZCkge1xuXHRcdFx0XHRyZXQueiA9IGEgKiBwWzBdLnogKyBiICogcFsxXS56ICsgYyAqIHBbMl0ueiArIGQgKiBwWzNdLno7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcmV0O1xuXHRcdH1cblxuXHRcdC8vIGhpZ2hlciBvcmRlciBjdXJ2ZXM6IHVzZSBkZSBDYXN0ZWxqYXUncyBjb21wdXRhdGlvblxuXHRcdGNvbnN0IGRDcHRzID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwb2ludHMpKTtcblx0XHR3aGlsZSAoZENwdHMubGVuZ3RoID4gMSkge1xuXHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBkQ3B0cy5sZW5ndGggLSAxOyBpKyspIHtcblx0XHRcdFx0ZENwdHNbaV0gPSB7XG5cdFx0XHRcdFx0eDogZENwdHNbaV0ueCArIChkQ3B0c1tpICsgMV0ueCAtIGRDcHRzW2ldLngpICogdCxcblx0XHRcdFx0XHR5OiBkQ3B0c1tpXS55ICsgKGRDcHRzW2kgKyAxXS55IC0gZENwdHNbaV0ueSkgKiB0LFxuXHRcdFx0XHR9O1xuXHRcdFx0XHRpZiAodHlwZW9mIGRDcHRzW2ldLnogIT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdFx0XHRkQ3B0c1tpXSA9IGRDcHRzW2ldLnogKyAoZENwdHNbaSArIDFdLnogLSBkQ3B0c1tpXS56KSAqIHQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGRDcHRzLnNwbGljZShkQ3B0cy5sZW5ndGggLSAxLCAxKTtcblx0XHR9XG5cdFx0ZENwdHNbMF0udCA9IHQ7XG5cdFx0cmV0dXJuIGRDcHRzWzBdO1xuXHR9LFxuXG5cdGNvbXB1dGVXaXRoUmF0aW9zOiBmdW5jdGlvbiAodCwgcG9pbnRzLCByYXRpb3MsIF8zZCkge1xuXHRcdGNvbnN0IG10ID0gMSAtIHQsXG5cdFx0XHRyID0gcmF0aW9zLFxuXHRcdFx0cCA9IHBvaW50cztcblxuXHRcdGxldCBmMSA9IHJbMF0sXG5cdFx0XHRmMiA9IHJbMV0sXG5cdFx0XHRmMyA9IHJbMl0sXG5cdFx0XHRmNCA9IHJbM10sXG5cdFx0XHRkO1xuXG5cdFx0Ly8gc3BlYyBmb3IgbGluZWFyXG5cdFx0ZjEgKj0gbXQ7XG5cdFx0ZjIgKj0gdDtcblxuXHRcdGlmIChwLmxlbmd0aCA9PT0gMikge1xuXHRcdFx0ZCA9IGYxICsgZjI7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR4OiAoZjEgKiBwWzBdLnggKyBmMiAqIHBbMV0ueCkgLyBkLFxuXHRcdFx0XHR5OiAoZjEgKiBwWzBdLnkgKyBmMiAqIHBbMV0ueSkgLyBkLFxuXHRcdFx0XHR6OiAhXzNkID8gZmFsc2UgOiAoZjEgKiBwWzBdLnogKyBmMiAqIHBbMV0ueikgLyBkLFxuXHRcdFx0XHR0OiB0LFxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvLyB1cGdyYWRlIHRvIHF1YWRyYXRpY1xuXHRcdGYxICo9IG10O1xuXHRcdGYyICo9IDIgKiBtdDtcblx0XHRmMyAqPSB0ICogdDtcblxuXHRcdGlmIChwLmxlbmd0aCA9PT0gMykge1xuXHRcdFx0ZCA9IGYxICsgZjIgKyBmMztcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdHg6IChmMSAqIHBbMF0ueCArIGYyICogcFsxXS54ICsgZjMgKiBwWzJdLngpIC8gZCxcblx0XHRcdFx0eTogKGYxICogcFswXS55ICsgZjIgKiBwWzFdLnkgKyBmMyAqIHBbMl0ueSkgLyBkLFxuXHRcdFx0XHR6OiAhXzNkID8gZmFsc2UgOiAoZjEgKiBwWzBdLnogKyBmMiAqIHBbMV0ueiArIGYzICogcFsyXS56KSAvIGQsXG5cdFx0XHRcdHQ6IHQsXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8vIHVwZ3JhZGUgdG8gY3ViaWNcblx0XHRmMSAqPSBtdDtcblx0XHRmMiAqPSAxLjUgKiBtdDtcblx0XHRmMyAqPSAzICogbXQ7XG5cdFx0ZjQgKj0gdCAqIHQgKiB0O1xuXG5cdFx0aWYgKHAubGVuZ3RoID09PSA0KSB7XG5cdFx0XHRkID0gZjEgKyBmMiArIGYzICsgZjQ7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR4OiAoZjEgKiBwWzBdLnggKyBmMiAqIHBbMV0ueCArIGYzICogcFsyXS54ICsgZjQgKiBwWzNdLngpIC8gZCxcblx0XHRcdFx0eTogKGYxICogcFswXS55ICsgZjIgKiBwWzFdLnkgKyBmMyAqIHBbMl0ueSArIGY0ICogcFszXS55KSAvIGQsXG5cdFx0XHRcdHo6ICFfM2Rcblx0XHRcdFx0XHQ/IGZhbHNlXG5cdFx0XHRcdFx0OiAoZjEgKiBwWzBdLnogKyBmMiAqIHBbMV0ueiArIGYzICogcFsyXS56ICsgZjQgKiBwWzNdLnopIC8gZCxcblx0XHRcdFx0dDogdCxcblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXG5cdGRlcml2ZTogZnVuY3Rpb24gKHBvaW50cywgXzNkKSB7XG5cdFx0Y29uc3QgZHBvaW50cyA9IFtdO1xuXHRcdGZvciAobGV0IHAgPSBwb2ludHMsIGQgPSBwLmxlbmd0aCwgYyA9IGQgLSAxOyBkID4gMTsgZC0tLCBjLS0pIHtcblx0XHRcdGNvbnN0IGxpc3QgPSBbXTtcblx0XHRcdGZvciAobGV0IGogPSAwLCBkcHQ7IGogPCBjOyBqKyspIHtcblx0XHRcdFx0ZHB0ID0ge1xuXHRcdFx0XHRcdHg6IGMgKiAocFtqICsgMV0ueCAtIHBbal0ueCksXG5cdFx0XHRcdFx0eTogYyAqIChwW2ogKyAxXS55IC0gcFtqXS55KSxcblx0XHRcdFx0fTtcblx0XHRcdFx0aWYgKF8zZCkge1xuXHRcdFx0XHRcdGRwdC56ID0gYyAqIChwW2ogKyAxXS56IC0gcFtqXS56KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRsaXN0LnB1c2goZHB0KTtcblx0XHRcdH1cblx0XHRcdGRwb2ludHMucHVzaChsaXN0KTtcblx0XHRcdHAgPSBsaXN0O1xuXHRcdH1cblx0XHRyZXR1cm4gZHBvaW50cztcblx0fSxcblxuXHRiZXR3ZWVuOiBmdW5jdGlvbiAodiwgbSwgTSkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQobSA8PSB2ICYmIHYgPD0gTSkgfHxcblx0XHRcdHV0aWxzLmFwcHJveGltYXRlbHkodiwgbSkgfHxcblx0XHRcdHV0aWxzLmFwcHJveGltYXRlbHkodiwgTSlcblx0XHQpO1xuXHR9LFxuXG5cdGFwcHJveGltYXRlbHk6IGZ1bmN0aW9uIChhLCBiLCBwcmVjaXNpb24pIHtcblx0XHRyZXR1cm4gYWJzKGEgLSBiKSA8PSAocHJlY2lzaW9uIHx8IGVwc2lsb24pO1xuXHR9LFxuXG5cdGxlbmd0aDogZnVuY3Rpb24gKGRlcml2YXRpdmVGbikge1xuXHRcdGNvbnN0IHogPSAwLjUsXG5cdFx0XHRsZW4gPSB1dGlscy5UdmFsdWVzLmxlbmd0aDtcblxuXHRcdGxldCBzdW0gPSAwO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDAsIHQ7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0dCA9IHogKiB1dGlscy5UdmFsdWVzW2ldICsgejtcblx0XHRcdHN1bSArPSB1dGlscy5DdmFsdWVzW2ldICogdXRpbHMuYXJjZm4odCwgZGVyaXZhdGl2ZUZuKTtcblx0XHR9XG5cdFx0cmV0dXJuIHogKiBzdW07XG5cdH0sXG5cblx0bWFwOiBmdW5jdGlvbiAodiwgZHMsIGRlLCB0cywgdGUpIHtcblx0XHRjb25zdCBkMSA9IGRlIC0gZHMsXG5cdFx0XHRkMiA9IHRlIC0gdHMsXG5cdFx0XHR2MiA9IHYgLSBkcyxcblx0XHRcdHIgPSB2MiAvIGQxO1xuXHRcdHJldHVybiB0cyArIGQyICogcjtcblx0fSxcblxuXHRsZXJwOiBmdW5jdGlvbiAociwgdjEsIHYyKSB7XG5cdFx0Y29uc3QgcmV0ID0ge1xuXHRcdFx0eDogdjEueCArIHIgKiAodjIueCAtIHYxLngpLFxuXHRcdFx0eTogdjEueSArIHIgKiAodjIueSAtIHYxLnkpLFxuXHRcdH07XG5cdFx0aWYgKCEhdjEueiAmJiAhIXYyLnopIHtcblx0XHRcdHJldC56ID0gdjEueiArIHIgKiAodjIueiAtIHYxLnopO1xuXHRcdH1cblx0XHRyZXR1cm4gcmV0O1xuXHR9LFxuXG5cdHBvaW50VG9TdHJpbmc6IGZ1bmN0aW9uIChwKSB7XG5cdFx0bGV0IHMgPSBwLnggKyBcIi9cIiArIHAueTtcblx0XHRpZiAodHlwZW9mIHAueiAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0cyArPSBcIi9cIiArIHAuejtcblx0XHR9XG5cdFx0cmV0dXJuIHM7XG5cdH0sXG5cblx0cG9pbnRzVG9TdHJpbmc6IGZ1bmN0aW9uIChwb2ludHMpIHtcblx0XHRyZXR1cm4gXCJbXCIgKyBwb2ludHMubWFwKHV0aWxzLnBvaW50VG9TdHJpbmcpLmpvaW4oXCIsIFwiKSArIFwiXVwiO1xuXHR9LFxuXG5cdGNvcHk6IGZ1bmN0aW9uIChvYmopIHtcblx0XHRyZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmopKTtcblx0fSxcblxuXHRhbmdsZTogZnVuY3Rpb24gKG8sIHYxLCB2Mikge1xuXHRcdGNvbnN0IGR4MSA9IHYxLnggLSBvLngsXG5cdFx0XHRkeTEgPSB2MS55IC0gby55LFxuXHRcdFx0ZHgyID0gdjIueCAtIG8ueCxcblx0XHRcdGR5MiA9IHYyLnkgLSBvLnksXG5cdFx0XHRjcm9zcyA9IGR4MSAqIGR5MiAtIGR5MSAqIGR4Mixcblx0XHRcdGRvdCA9IGR4MSAqIGR4MiArIGR5MSAqIGR5Mjtcblx0XHRyZXR1cm4gYXRhbjIoY3Jvc3MsIGRvdCk7XG5cdH0sXG5cblx0Ly8gcm91bmQgYXMgc3RyaW5nLCB0byBhdm9pZCByb3VuZGluZyBlcnJvcnNcblx0cm91bmQ6IGZ1bmN0aW9uICh2LCBkKSB7XG5cdFx0Y29uc3QgcyA9IFwiXCIgKyB2O1xuXHRcdGNvbnN0IHBvcyA9IHMuaW5kZXhPZihcIi5cIik7XG5cdFx0cmV0dXJuIHBhcnNlRmxvYXQocy5zdWJzdHJpbmcoMCwgcG9zICsgMSArIGQpKTtcblx0fSxcblxuXHRkaXN0OiBmdW5jdGlvbiAocDEsIHAyKSB7XG5cdFx0Y29uc3QgZHggPSBwMS54IC0gcDIueCxcblx0XHRcdGR5ID0gcDEueSAtIHAyLnk7XG5cdFx0cmV0dXJuIHNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXHR9LFxuXG5cdGNsb3Nlc3Q6IGZ1bmN0aW9uIChMVVQsIHBvaW50KSB7XG5cdFx0bGV0IG1kaXN0ID0gcG93KDIsIDYzKSxcblx0XHRcdG1wb3MsXG5cdFx0XHRkO1xuXHRcdExVVC5mb3JFYWNoKGZ1bmN0aW9uIChwLCBpZHgpIHtcblx0XHRcdGQgPSB1dGlscy5kaXN0KHBvaW50LCBwKTtcblx0XHRcdGlmIChkIDwgbWRpc3QpIHtcblx0XHRcdFx0bWRpc3QgPSBkO1xuXHRcdFx0XHRtcG9zID0gaWR4O1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiB7IG1kaXN0OiBtZGlzdCwgbXBvczogbXBvcyB9O1xuXHR9LFxuXG5cdGFiY3JhdGlvOiBmdW5jdGlvbiAodCwgbikge1xuXHRcdC8vIHNlZSByYXRpbyh0KSBub3RlIG9uIGh0dHA6Ly9wb21heC5naXRodWIuaW8vYmV6aWVyaW5mby8jYWJjXG5cdFx0aWYgKG4gIT09IDIgJiYgbiAhPT0gMykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIHQgPT09IFwidW5kZWZpbmVkXCIpIHtcblx0XHRcdHQgPSAwLjU7XG5cdFx0fSBlbHNlIGlmICh0ID09PSAwIHx8IHQgPT09IDEpIHtcblx0XHRcdHJldHVybiB0O1xuXHRcdH1cblx0XHRjb25zdCBib3R0b20gPSBwb3codCwgbikgKyBwb3coMSAtIHQsIG4pLFxuXHRcdFx0dG9wID0gYm90dG9tIC0gMTtcblx0XHRyZXR1cm4gYWJzKHRvcCAvIGJvdHRvbSk7XG5cdH0sXG5cblx0cHJvamVjdGlvbnJhdGlvOiBmdW5jdGlvbiAodCwgbikge1xuXHRcdC8vIHNlZSB1KHQpIG5vdGUgb24gaHR0cDovL3BvbWF4LmdpdGh1Yi5pby9iZXppZXJpbmZvLyNhYmNcblx0XHRpZiAobiAhPT0gMiAmJiBuICE9PSAzKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdGlmICh0eXBlb2YgdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0dCA9IDAuNTtcblx0XHR9IGVsc2UgaWYgKHQgPT09IDAgfHwgdCA9PT0gMSkge1xuXHRcdFx0cmV0dXJuIHQ7XG5cdFx0fVxuXHRcdGNvbnN0IHRvcCA9IHBvdygxIC0gdCwgbiksXG5cdFx0XHRib3R0b20gPSBwb3codCwgbikgKyB0b3A7XG5cdFx0cmV0dXJuIHRvcCAvIGJvdHRvbTtcblx0fSxcblxuXHRsbGk4OiBmdW5jdGlvbiAoeDEsIHkxLCB4MiwgeTIsIHgzLCB5MywgeDQsIHk0KSB7XG5cdFx0Y29uc3QgbnggPVxuXHRcdFx0KHgxICogeTIgLSB5MSAqIHgyKSAqICh4MyAtIHg0KSAtICh4MSAtIHgyKSAqICh4MyAqIHk0IC0geTMgKiB4NCksXG5cdFx0XHRueSA9ICh4MSAqIHkyIC0geTEgKiB4MikgKiAoeTMgLSB5NCkgLSAoeTEgLSB5MikgKiAoeDMgKiB5NCAtIHkzICogeDQpLFxuXHRcdFx0ZCA9ICh4MSAtIHgyKSAqICh5MyAtIHk0KSAtICh5MSAtIHkyKSAqICh4MyAtIHg0KTtcblx0XHRpZiAoZCA9PSAwKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiB7IHg6IG54IC8gZCwgeTogbnkgLyBkIH07XG5cdH0sXG5cblx0bGxpNDogZnVuY3Rpb24gKHAxLCBwMiwgcDMsIHA0KSB7XG5cdFx0Y29uc3QgeDEgPSBwMS54LFxuXHRcdFx0eTEgPSBwMS55LFxuXHRcdFx0eDIgPSBwMi54LFxuXHRcdFx0eTIgPSBwMi55LFxuXHRcdFx0eDMgPSBwMy54LFxuXHRcdFx0eTMgPSBwMy55LFxuXHRcdFx0eDQgPSBwNC54LFxuXHRcdFx0eTQgPSBwNC55O1xuXHRcdHJldHVybiB1dGlscy5sbGk4KHgxLCB5MSwgeDIsIHkyLCB4MywgeTMsIHg0LCB5NCk7XG5cdH0sXG5cblx0bGxpOiBmdW5jdGlvbiAodjEsIHYyKSB7XG5cdFx0cmV0dXJuIHV0aWxzLmxsaTQodjEsIHYxLmMsIHYyLCB2Mi5jKTtcblx0fSxcblxuXHRtYWtlbGluZTogZnVuY3Rpb24gKHAxLCBwMikge1xuXHRcdGNvbnN0IHgxID0gcDEueCxcblx0XHRcdHkxID0gcDEueSxcblx0XHRcdHgyID0gcDIueCxcblx0XHRcdHkyID0gcDIueSxcblx0XHRcdGR4ID0gKHgyIC0geDEpIC8gMyxcblx0XHRcdGR5ID0gKHkyIC0geTEpIC8gMztcblx0XHRyZXR1cm4gbmV3IEJlemllcihcblx0XHRcdHgxLFxuXHRcdFx0eTEsXG5cdFx0XHR4MSArIGR4LFxuXHRcdFx0eTEgKyBkeSxcblx0XHRcdHgxICsgMiAqIGR4LFxuXHRcdFx0eTEgKyAyICogZHksXG5cdFx0XHR4Mixcblx0XHRcdHkyXG5cdFx0KTtcblx0fSxcblxuXHRmaW5kYmJveDogZnVuY3Rpb24gKHNlY3Rpb25zKSB7XG5cdFx0bGV0IG14ID0gbk1heCxcblx0XHRcdG15ID0gbk1heCxcblx0XHRcdE1YID0gbk1pbixcblx0XHRcdE1ZID0gbk1pbjtcblx0XHRzZWN0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7XG5cdFx0XHRjb25zdCBiYm94ID0gcy5iYm94KCk7XG5cdFx0XHRpZiAobXggPiBiYm94LngubWluKSBteCA9IGJib3gueC5taW47XG5cdFx0XHRpZiAobXkgPiBiYm94LnkubWluKSBteSA9IGJib3gueS5taW47XG5cdFx0XHRpZiAoTVggPCBiYm94LngubWF4KSBNWCA9IGJib3gueC5tYXg7XG5cdFx0XHRpZiAoTVkgPCBiYm94LnkubWF4KSBNWSA9IGJib3gueS5tYXg7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHg6IHsgbWluOiBteCwgbWlkOiAobXggKyBNWCkgLyAyLCBtYXg6IE1YLCBzaXplOiBNWCAtIG14IH0sXG5cdFx0XHR5OiB7IG1pbjogbXksIG1pZDogKG15ICsgTVkpIC8gMiwgbWF4OiBNWSwgc2l6ZTogTVkgLSBteSB9LFxuXHRcdH07XG5cdH0sXG5cblx0c2hhcGVpbnRlcnNlY3Rpb25zOiBmdW5jdGlvbiAoXG5cdFx0czEsXG5cdFx0YmJveDEsXG5cdFx0czIsXG5cdFx0YmJveDIsXG5cdFx0Y3VydmVJbnRlcnNlY3Rpb25UaHJlc2hvbGRcblx0KSB7XG5cdFx0aWYgKCF1dGlscy5iYm94b3ZlcmxhcChiYm94MSwgYmJveDIpKSByZXR1cm4gW107XG5cdFx0Y29uc3QgaW50ZXJzZWN0aW9ucyA9IFtdO1xuXHRcdGNvbnN0IGExID0gW3MxLnN0YXJ0Y2FwLCBzMS5mb3J3YXJkLCBzMS5iYWNrLCBzMS5lbmRjYXBdO1xuXHRcdGNvbnN0IGEyID0gW3MyLnN0YXJ0Y2FwLCBzMi5mb3J3YXJkLCBzMi5iYWNrLCBzMi5lbmRjYXBdO1xuXHRcdGExLmZvckVhY2goZnVuY3Rpb24gKGwxKSB7XG5cdFx0XHRpZiAobDEudmlydHVhbCkgcmV0dXJuO1xuXHRcdFx0YTIuZm9yRWFjaChmdW5jdGlvbiAobDIpIHtcblx0XHRcdFx0aWYgKGwyLnZpcnR1YWwpIHJldHVybjtcblx0XHRcdFx0Y29uc3QgaXNzID0gbDEuaW50ZXJzZWN0cyhsMiwgY3VydmVJbnRlcnNlY3Rpb25UaHJlc2hvbGQpO1xuXHRcdFx0XHRpZiAoaXNzLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0XHRpc3MuYzEgPSBsMTtcblx0XHRcdFx0XHRpc3MuYzIgPSBsMjtcblx0XHRcdFx0XHRpc3MuczEgPSBzMTtcblx0XHRcdFx0XHRpc3MuczIgPSBzMjtcblx0XHRcdFx0XHRpbnRlcnNlY3Rpb25zLnB1c2goaXNzKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGludGVyc2VjdGlvbnM7XG5cdH0sXG5cblx0bWFrZXNoYXBlOiBmdW5jdGlvbiAoZm9yd2FyZCwgYmFjaywgY3VydmVJbnRlcnNlY3Rpb25UaHJlc2hvbGQpIHtcblx0XHRjb25zdCBicGwgPSBiYWNrLnBvaW50cy5sZW5ndGg7XG5cdFx0Y29uc3QgZnBsID0gZm9yd2FyZC5wb2ludHMubGVuZ3RoO1xuXHRcdGNvbnN0IHN0YXJ0ID0gdXRpbHMubWFrZWxpbmUoYmFjay5wb2ludHNbYnBsIC0gMV0sIGZvcndhcmQucG9pbnRzWzBdKTtcblx0XHRjb25zdCBlbmQgPSB1dGlscy5tYWtlbGluZShmb3J3YXJkLnBvaW50c1tmcGwgLSAxXSwgYmFjay5wb2ludHNbMF0pO1xuXHRcdGNvbnN0IHNoYXBlID0ge1xuXHRcdFx0c3RhcnRjYXA6IHN0YXJ0LFxuXHRcdFx0Zm9yd2FyZDogZm9yd2FyZCxcblx0XHRcdGJhY2s6IGJhY2ssXG5cdFx0XHRlbmRjYXA6IGVuZCxcblx0XHRcdGJib3g6IHV0aWxzLmZpbmRiYm94KFtzdGFydCwgZm9yd2FyZCwgYmFjaywgZW5kXSksXG5cdFx0fTtcblx0XHRzaGFwZS5pbnRlcnNlY3Rpb25zID0gZnVuY3Rpb24gKHMyKSB7XG5cdFx0XHRyZXR1cm4gdXRpbHMuc2hhcGVpbnRlcnNlY3Rpb25zKFxuXHRcdFx0XHRzaGFwZSxcblx0XHRcdFx0c2hhcGUuYmJveCxcblx0XHRcdFx0czIsXG5cdFx0XHRcdHMyLmJib3gsXG5cdFx0XHRcdGN1cnZlSW50ZXJzZWN0aW9uVGhyZXNob2xkXG5cdFx0XHQpO1xuXHRcdH07XG5cdFx0cmV0dXJuIHNoYXBlO1xuXHR9LFxuXG5cdGdldG1pbm1heDogZnVuY3Rpb24gKGN1cnZlLCBkLCBsaXN0KSB7XG5cdFx0aWYgKCFsaXN0KSByZXR1cm4geyBtaW46IDAsIG1heDogMCB9O1xuXHRcdGxldCBtaW4gPSBuTWF4LFxuXHRcdFx0bWF4ID0gbk1pbixcblx0XHRcdHQsXG5cdFx0XHRjO1xuXHRcdGlmIChsaXN0LmluZGV4T2YoMCkgPT09IC0xKSB7XG5cdFx0XHRsaXN0ID0gWzBdLmNvbmNhdChsaXN0KTtcblx0XHR9XG5cdFx0aWYgKGxpc3QuaW5kZXhPZigxKSA9PT0gLTEpIHtcblx0XHRcdGxpc3QucHVzaCgxKTtcblx0XHR9XG5cdFx0Zm9yIChsZXQgaSA9IDAsIGxlbiA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdHQgPSBsaXN0W2ldO1xuXHRcdFx0YyA9IGN1cnZlLmdldCh0KTtcblx0XHRcdGlmIChjW2RdIDwgbWluKSB7XG5cdFx0XHRcdG1pbiA9IGNbZF07XG5cdFx0XHR9XG5cdFx0XHRpZiAoY1tkXSA+IG1heCkge1xuXHRcdFx0XHRtYXggPSBjW2RdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4geyBtaW46IG1pbiwgbWlkOiAobWluICsgbWF4KSAvIDIsIG1heDogbWF4LCBzaXplOiBtYXggLSBtaW4gfTtcblx0fSxcblxuXHRhbGlnbjogZnVuY3Rpb24gKHBvaW50cywgbGluZSkge1xuXHRcdGNvbnN0IHR4ID0gbGluZS5wMS54LFxuXHRcdFx0dHkgPSBsaW5lLnAxLnksXG5cdFx0XHRhID0gLWF0YW4yKGxpbmUucDIueSAtIHR5LCBsaW5lLnAyLnggLSB0eCksXG5cdFx0XHRkID0gZnVuY3Rpb24gKHYpIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHR4OiAodi54IC0gdHgpICogY29zKGEpIC0gKHYueSAtIHR5KSAqIHNpbihhKSxcblx0XHRcdFx0XHR5OiAodi54IC0gdHgpICogc2luKGEpICsgKHYueSAtIHR5KSAqIGNvcyhhKSxcblx0XHRcdFx0fTtcblx0XHRcdH07XG5cdFx0cmV0dXJuIHBvaW50cy5tYXAoZCk7XG5cdH0sXG5cblx0cm9vdHM6IGZ1bmN0aW9uIChwb2ludHMsIGxpbmUpIHtcblx0XHRsaW5lID0gbGluZSB8fCB7IHAxOiB7IHg6IDAsIHk6IDAgfSwgcDI6IHsgeDogMSwgeTogMCB9IH07XG5cblx0XHRjb25zdCBvcmRlciA9IHBvaW50cy5sZW5ndGggLSAxO1xuXHRcdGNvbnN0IGFsaWduZWQgPSB1dGlscy5hbGlnbihwb2ludHMsIGxpbmUpO1xuXHRcdGNvbnN0IHJlZHVjZSA9IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRyZXR1cm4gMCA8PSB0ICYmIHQgPD0gMTtcblx0XHR9O1xuXG5cdFx0aWYgKG9yZGVyID09PSAyKSB7XG5cdFx0XHRjb25zdCBhID0gYWxpZ25lZFswXS55LFxuXHRcdFx0XHRiID0gYWxpZ25lZFsxXS55LFxuXHRcdFx0XHRjID0gYWxpZ25lZFsyXS55LFxuXHRcdFx0XHRkID0gYSAtIDIgKiBiICsgYztcblx0XHRcdGlmIChkICE9PSAwKSB7XG5cdFx0XHRcdGNvbnN0IG0xID0gLXNxcnQoYiAqIGIgLSBhICogYyksXG5cdFx0XHRcdFx0bTIgPSAtYSArIGIsXG5cdFx0XHRcdFx0djEgPSAtKG0xICsgbTIpIC8gZCxcblx0XHRcdFx0XHR2MiA9IC0oLW0xICsgbTIpIC8gZDtcblx0XHRcdFx0cmV0dXJuIFt2MSwgdjJdLmZpbHRlcihyZWR1Y2UpO1xuXHRcdFx0fSBlbHNlIGlmIChiICE9PSBjICYmIGQgPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIFsoMiAqIGIgLSBjKSAvICgyICogYiAtIDIgKiBjKV0uZmlsdGVyKHJlZHVjZSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fVxuXG5cdFx0Ly8gc2VlIGh0dHA6Ly93d3cudHJhbnM0bWluZC5jb20vcGVyc29uYWxfZGV2ZWxvcG1lbnQvbWF0aGVtYXRpY3MvcG9seW5vbWlhbHMvY3ViaWNBbGdlYnJhLmh0bVxuXHRcdGNvbnN0IHBhID0gYWxpZ25lZFswXS55LFxuXHRcdFx0cGIgPSBhbGlnbmVkWzFdLnksXG5cdFx0XHRwYyA9IGFsaWduZWRbMl0ueSxcblx0XHRcdHBkID0gYWxpZ25lZFszXS55O1xuXG5cdFx0bGV0IGQgPSAtcGEgKyAzICogcGIgLSAzICogcGMgKyBwZCxcblx0XHRcdGEgPSAzICogcGEgLSA2ICogcGIgKyAzICogcGMsXG5cdFx0XHRiID0gLTMgKiBwYSArIDMgKiBwYixcblx0XHRcdGMgPSBwYTtcblxuXHRcdGlmICh1dGlscy5hcHByb3hpbWF0ZWx5KGQsIDApKSB7XG5cdFx0XHQvLyB0aGlzIGlzIG5vdCBhIGN1YmljIGN1cnZlLlxuXHRcdFx0aWYgKHV0aWxzLmFwcHJveGltYXRlbHkoYSwgMCkpIHtcblx0XHRcdFx0Ly8gaW4gZmFjdCwgdGhpcyBpcyBub3QgYSBxdWFkcmF0aWMgY3VydmUgZWl0aGVyLlxuXHRcdFx0XHRpZiAodXRpbHMuYXBwcm94aW1hdGVseShiLCAwKSkge1xuXHRcdFx0XHRcdC8vIGluIGZhY3QgaW4gZmFjdCwgdGhlcmUgYXJlIG5vIHNvbHV0aW9ucy5cblx0XHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly8gbGluZWFyIHNvbHV0aW9uOlxuXHRcdFx0XHRyZXR1cm4gWy1jIC8gYl0uZmlsdGVyKHJlZHVjZSk7XG5cdFx0XHR9XG5cdFx0XHQvLyBxdWFkcmF0aWMgc29sdXRpb246XG5cdFx0XHRjb25zdCBxID0gc3FydChiICogYiAtIDQgKiBhICogYyksXG5cdFx0XHRcdGEyID0gMiAqIGE7XG5cdFx0XHRyZXR1cm4gWyhxIC0gYikgLyBhMiwgKC1iIC0gcSkgLyBhMl0uZmlsdGVyKHJlZHVjZSk7XG5cdFx0fVxuXG5cdFx0Ly8gYXQgdGhpcyBwb2ludCwgd2Uga25vdyB3ZSBuZWVkIGEgY3ViaWMgc29sdXRpb246XG5cblx0XHRhIC89IGQ7XG5cdFx0YiAvPSBkO1xuXHRcdGMgLz0gZDtcblxuXHRcdGNvbnN0IHAgPSAoMyAqIGIgLSBhICogYSkgLyAzLFxuXHRcdFx0cDMgPSBwIC8gMyxcblx0XHRcdHEgPSAoMiAqIGEgKiBhICogYSAtIDkgKiBhICogYiArIDI3ICogYykgLyAyNyxcblx0XHRcdHEyID0gcSAvIDIsXG5cdFx0XHRkaXNjcmltaW5hbnQgPSBxMiAqIHEyICsgcDMgKiBwMyAqIHAzO1xuXG5cdFx0bGV0IHUxLCB2MSwgeDEsIHgyLCB4Mztcblx0XHRpZiAoZGlzY3JpbWluYW50IDwgMCkge1xuXHRcdFx0Y29uc3QgbXAzID0gLXAgLyAzLFxuXHRcdFx0XHRtcDMzID0gbXAzICogbXAzICogbXAzLFxuXHRcdFx0XHRyID0gc3FydChtcDMzKSxcblx0XHRcdFx0dCA9IC1xIC8gKDIgKiByKSxcblx0XHRcdFx0Y29zcGhpID0gdCA8IC0xID8gLTEgOiB0ID4gMSA/IDEgOiB0LFxuXHRcdFx0XHRwaGkgPSBhY29zKGNvc3BoaSksXG5cdFx0XHRcdGNydHIgPSBjcnQociksXG5cdFx0XHRcdHQxID0gMiAqIGNydHI7XG5cdFx0XHR4MSA9IHQxICogY29zKHBoaSAvIDMpIC0gYSAvIDM7XG5cdFx0XHR4MiA9IHQxICogY29zKChwaGkgKyB0YXUpIC8gMykgLSBhIC8gMztcblx0XHRcdHgzID0gdDEgKiBjb3MoKHBoaSArIDIgKiB0YXUpIC8gMykgLSBhIC8gMztcblx0XHRcdHJldHVybiBbeDEsIHgyLCB4M10uZmlsdGVyKHJlZHVjZSk7XG5cdFx0fSBlbHNlIGlmIChkaXNjcmltaW5hbnQgPT09IDApIHtcblx0XHRcdHUxID0gcTIgPCAwID8gY3J0KC1xMikgOiAtY3J0KHEyKTtcblx0XHRcdHgxID0gMiAqIHUxIC0gYSAvIDM7XG5cdFx0XHR4MiA9IC11MSAtIGEgLyAzO1xuXHRcdFx0cmV0dXJuIFt4MSwgeDJdLmZpbHRlcihyZWR1Y2UpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjb25zdCBzZCA9IHNxcnQoZGlzY3JpbWluYW50KTtcblx0XHRcdHUxID0gY3J0KC1xMiArIHNkKTtcblx0XHRcdHYxID0gY3J0KHEyICsgc2QpO1xuXHRcdFx0cmV0dXJuIFt1MSAtIHYxIC0gYSAvIDNdLmZpbHRlcihyZWR1Y2UpO1xuXHRcdH1cblx0fSxcblxuXHRkcm9vdHM6IGZ1bmN0aW9uIChwKSB7XG5cdFx0Ly8gcXVhZHJhdGljIHJvb3RzIGFyZSBlYXN5XG5cdFx0aWYgKHAubGVuZ3RoID09PSAzKSB7XG5cdFx0XHRjb25zdCBhID0gcFswXSxcblx0XHRcdFx0YiA9IHBbMV0sXG5cdFx0XHRcdGMgPSBwWzJdLFxuXHRcdFx0XHRkID0gYSAtIDIgKiBiICsgYztcblx0XHRcdGlmIChkICE9PSAwKSB7XG5cdFx0XHRcdGNvbnN0IG0xID0gLXNxcnQoYiAqIGIgLSBhICogYyksXG5cdFx0XHRcdFx0bTIgPSAtYSArIGIsXG5cdFx0XHRcdFx0djEgPSAtKG0xICsgbTIpIC8gZCxcblx0XHRcdFx0XHR2MiA9IC0oLW0xICsgbTIpIC8gZDtcblx0XHRcdFx0cmV0dXJuIFt2MSwgdjJdO1xuXHRcdFx0fSBlbHNlIGlmIChiICE9PSBjICYmIGQgPT09IDApIHtcblx0XHRcdFx0cmV0dXJuIFsoMiAqIGIgLSBjKSAvICgyICogKGIgLSBjKSldO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblxuXHRcdC8vIGxpbmVhciByb290cyBhcmUgZXZlbiBlYXNpZXJcblx0XHRpZiAocC5sZW5ndGggPT09IDIpIHtcblx0XHRcdGNvbnN0IGEgPSBwWzBdLFxuXHRcdFx0XHRiID0gcFsxXTtcblx0XHRcdGlmIChhICE9PSBiKSB7XG5cdFx0XHRcdHJldHVybiBbYSAvIChhIC0gYildO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIFtdO1xuXHRcdH1cblxuXHRcdHJldHVybiBbXTtcblx0fSxcblxuXHRjdXJ2YXR1cmU6IGZ1bmN0aW9uICh0LCBkMSwgZDIsIF8zZCwga09ubHkpIHtcblx0XHRsZXQgbnVtLFxuXHRcdFx0ZG5tLFxuXHRcdFx0YWRrLFxuXHRcdFx0ZGssXG5cdFx0XHRrID0gMCxcblx0XHRcdHIgPSAwO1xuXG5cdFx0Ly9cblx0XHQvLyBXZSdyZSB1c2luZyB0aGUgZm9sbG93aW5nIGZvcm11bGEgZm9yIGN1cnZhdHVyZTpcblx0XHQvL1xuXHRcdC8vICAgICAgICAgICAgICB4J3lcIiAtIHkneFwiXG5cdFx0Ly8gICBrKHQpID0gLS0tLS0tLS0tLS0tLS0tLS0tXG5cdFx0Ly8gICAgICAgICAgICh4J8KyICsgeSfCsileKDMvMilcblx0XHQvL1xuXHRcdC8vIGZyb20gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUmFkaXVzX29mX2N1cnZhdHVyZSNEZWZpbml0aW9uXG5cdFx0Ly9cblx0XHQvLyBXaXRoIGl0IGNvcnJlc3BvbmRpbmcgM0QgY291bnRlcnBhcnQ6XG5cdFx0Ly9cblx0XHQvLyAgICAgICAgICBzcXJ0KCAoeSd6XCIgLSB5XCJ6JynCsiArICh6J3hcIiAtIHpcIngnKcKyICsgKHgneVwiIC0geFwieScpwrIpXG5cdFx0Ly8gICBrKHQpID0gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcdC8vICAgICAgICAgICAgICAgICAgICAgKHgnwrIgKyB5J8KyICsgeifCsileKDMvMilcblx0XHQvL1xuXG5cdFx0Y29uc3QgZCA9IHV0aWxzLmNvbXB1dGUodCwgZDEpO1xuXHRcdGNvbnN0IGRkID0gdXRpbHMuY29tcHV0ZSh0LCBkMik7XG5cdFx0Y29uc3QgcWRzdW0gPSBkLnggKiBkLnggKyBkLnkgKiBkLnk7XG5cblx0XHRpZiAoXzNkKSB7XG5cdFx0XHRudW0gPSBzcXJ0KFxuXHRcdFx0XHRwb3coZC55ICogZGQueiAtIGRkLnkgKiBkLnosIDIpICtcblx0XHRcdFx0cG93KGQueiAqIGRkLnggLSBkZC56ICogZC54LCAyKSArXG5cdFx0XHRcdHBvdyhkLnggKiBkZC55IC0gZGQueCAqIGQueSwgMilcblx0XHRcdCk7XG5cdFx0XHRkbm0gPSBwb3cocWRzdW0gKyBkLnogKiBkLnosIDMgLyAyKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bnVtID0gZC54ICogZGQueSAtIGQueSAqIGRkLng7XG5cdFx0XHRkbm0gPSBwb3cocWRzdW0sIDMgLyAyKTtcblx0XHR9XG5cblx0XHRpZiAobnVtID09PSAwIHx8IGRubSA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIHsgazogMCwgcjogMCB9O1xuXHRcdH1cblxuXHRcdGsgPSBudW0gLyBkbm07XG5cdFx0ciA9IGRubSAvIG51bTtcblxuXHRcdC8vIFdlJ3JlIGFsc28gY29tcHV0aW5nIHRoZSBkZXJpdmF0aXZlIG9mIGthcHBhLCBiZWNhdXNlXG5cdFx0Ly8gdGhlcmUgaXMgdmFsdWUgaW4ga25vd2luZyB0aGUgcmF0ZSBvZiBjaGFuZ2UgZm9yIHRoZVxuXHRcdC8vIGN1cnZhdHVyZSBhbG9uZyB0aGUgY3VydmUuIEFuZCB3ZSdyZSBqdXN0IGdvaW5nIHRvXG5cdFx0Ly8gYmFsbHBhcmsgaXQgYmFzZWQgb24gYW4gZXBzaWxvbi5cblx0XHRpZiAoIWtPbmx5KSB7XG5cdFx0XHQvLyBjb21wdXRlIGsnKHQpIGJhc2VkIG9uIHRoZSBpbnRlcnZhbCBiZWZvcmUsIGFuZCBhZnRlciBpdCxcblx0XHRcdC8vIHRvIGF0IGxlYXN0IHRyeSB0byBub3QgaW50cm9kdWNlIGZvcndhcmQvYmFja3dhcmQgcGFzcyBiaWFzLlxuXHRcdFx0Y29uc3QgcGsgPSB1dGlscy5jdXJ2YXR1cmUodCAtIDAuMDAxLCBkMSwgZDIsIF8zZCwgdHJ1ZSkuaztcblx0XHRcdGNvbnN0IG5rID0gdXRpbHMuY3VydmF0dXJlKHQgKyAwLjAwMSwgZDEsIGQyLCBfM2QsIHRydWUpLms7XG5cdFx0XHRkayA9IChuayAtIGsgKyAoayAtIHBrKSkgLyAyO1xuXHRcdFx0YWRrID0gKGFicyhuayAtIGspICsgYWJzKGsgLSBwaykpIC8gMjtcblx0XHR9XG5cblx0XHRyZXR1cm4geyBrOiBrLCByOiByLCBkazogZGssIGFkazogYWRrIH07XG5cdH0sXG5cblx0aW5mbGVjdGlvbnM6IGZ1bmN0aW9uIChwb2ludHMpIHtcblx0XHRpZiAocG9pbnRzLmxlbmd0aCA8IDQpIHJldHVybiBbXTtcblxuXHRcdC8vIEZJWE1FOiBUT0RPOiBhZGQgaW4gaW5mbGVjdGlvbiBhYnN0cmFjdGlvbiBmb3IgcXVhcnRpYysgY3VydmVzP1xuXG5cdFx0Y29uc3QgcCA9IHV0aWxzLmFsaWduKHBvaW50cywgeyBwMTogcG9pbnRzWzBdLCBwMjogcG9pbnRzLnNsaWNlKC0xKVswXSB9KSxcblx0XHRcdGEgPSBwWzJdLnggKiBwWzFdLnksXG5cdFx0XHRiID0gcFszXS54ICogcFsxXS55LFxuXHRcdFx0YyA9IHBbMV0ueCAqIHBbMl0ueSxcblx0XHRcdGQgPSBwWzNdLnggKiBwWzJdLnksXG5cdFx0XHR2MSA9IDE4ICogKC0zICogYSArIDIgKiBiICsgMyAqIGMgLSBkKSxcblx0XHRcdHYyID0gMTggKiAoMyAqIGEgLSBiIC0gMyAqIGMpLFxuXHRcdFx0djMgPSAxOCAqIChjIC0gYSk7XG5cblx0XHRpZiAodXRpbHMuYXBwcm94aW1hdGVseSh2MSwgMCkpIHtcblx0XHRcdGlmICghdXRpbHMuYXBwcm94aW1hdGVseSh2MiwgMCkpIHtcblx0XHRcdFx0bGV0IHQgPSAtdjMgLyB2Mjtcblx0XHRcdFx0aWYgKDAgPD0gdCAmJiB0IDw9IDEpIHJldHVybiBbdF07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gW107XG5cdFx0fVxuXG5cdFx0Y29uc3QgdHJtID0gdjIgKiB2MiAtIDQgKiB2MSAqIHYzLFxuXHRcdFx0c3EgPSBNYXRoLnNxcnQodHJtKSxcblx0XHRcdGQyID0gMiAqIHYxO1xuXG5cdFx0aWYgKHV0aWxzLmFwcHJveGltYXRlbHkoZDIsIDApKSByZXR1cm4gW107XG5cblx0XHRyZXR1cm4gWyhzcSAtIHYyKSAvIGQyLCAtKHYyICsgc3EpIC8gZDJdLmZpbHRlcihmdW5jdGlvbiAocikge1xuXHRcdFx0cmV0dXJuIDAgPD0gciAmJiByIDw9IDE7XG5cdFx0fSk7XG5cdH0sXG5cblx0YmJveG92ZXJsYXA6IGZ1bmN0aW9uIChiMSwgYjIpIHtcblx0XHRjb25zdCBkaW1zID0gW1wieFwiLCBcInlcIl0sXG5cdFx0XHRsZW4gPSBkaW1zLmxlbmd0aDtcblxuXHRcdGZvciAobGV0IGkgPSAwLCBkaW0sIGwsIHQsIGQ7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0ZGltID0gZGltc1tpXTtcblx0XHRcdGwgPSBiMVtkaW1dLm1pZDtcblx0XHRcdHQgPSBiMltkaW1dLm1pZDtcblx0XHRcdGQgPSAoYjFbZGltXS5zaXplICsgYjJbZGltXS5zaXplKSAvIDI7XG5cdFx0XHRpZiAoYWJzKGwgLSB0KSA+PSBkKSByZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXG5cdGV4cGFuZGJveDogZnVuY3Rpb24gKGJib3gsIF9iYm94KSB7XG5cdFx0aWYgKF9iYm94LngubWluIDwgYmJveC54Lm1pbikge1xuXHRcdFx0YmJveC54Lm1pbiA9IF9iYm94LngubWluO1xuXHRcdH1cblx0XHRpZiAoX2Jib3gueS5taW4gPCBiYm94LnkubWluKSB7XG5cdFx0XHRiYm94LnkubWluID0gX2Jib3gueS5taW47XG5cdFx0fVxuXHRcdGlmIChfYmJveC56ICYmIF9iYm94LnoubWluIDwgYmJveC56Lm1pbikge1xuXHRcdFx0YmJveC56Lm1pbiA9IF9iYm94LnoubWluO1xuXHRcdH1cblx0XHRpZiAoX2Jib3gueC5tYXggPiBiYm94LngubWF4KSB7XG5cdFx0XHRiYm94LngubWF4ID0gX2Jib3gueC5tYXg7XG5cdFx0fVxuXHRcdGlmIChfYmJveC55Lm1heCA+IGJib3gueS5tYXgpIHtcblx0XHRcdGJib3gueS5tYXggPSBfYmJveC55Lm1heDtcblx0XHR9XG5cdFx0aWYgKF9iYm94LnogJiYgX2Jib3guei5tYXggPiBiYm94LnoubWF4KSB7XG5cdFx0XHRiYm94LnoubWF4ID0gX2Jib3guei5tYXg7XG5cdFx0fVxuXHRcdGJib3gueC5taWQgPSAoYmJveC54Lm1pbiArIGJib3gueC5tYXgpIC8gMjtcblx0XHRiYm94LnkubWlkID0gKGJib3gueS5taW4gKyBiYm94LnkubWF4KSAvIDI7XG5cdFx0aWYgKGJib3gueikge1xuXHRcdFx0YmJveC56Lm1pZCA9IChiYm94LnoubWluICsgYmJveC56Lm1heCkgLyAyO1xuXHRcdH1cblx0XHRiYm94Lnguc2l6ZSA9IGJib3gueC5tYXggLSBiYm94LngubWluO1xuXHRcdGJib3gueS5zaXplID0gYmJveC55Lm1heCAtIGJib3gueS5taW47XG5cdFx0aWYgKGJib3gueikge1xuXHRcdFx0YmJveC56LnNpemUgPSBiYm94LnoubWF4IC0gYmJveC56Lm1pbjtcblx0XHR9XG5cdH0sXG5cblx0cGFpcml0ZXJhdGlvbjogZnVuY3Rpb24gKGMxLCBjMiwgY3VydmVJbnRlcnNlY3Rpb25UaHJlc2hvbGQpIHtcblx0XHRjb25zdCBjMWIgPSBjMS5iYm94KCksXG5cdFx0XHRjMmIgPSBjMi5iYm94KCksXG5cdFx0XHRyID0gMTAwMDAwLFxuXHRcdFx0dGhyZXNob2xkID0gY3VydmVJbnRlcnNlY3Rpb25UaHJlc2hvbGQgfHwgMC41O1xuXG5cdFx0aWYgKFxuXHRcdFx0YzFiLnguc2l6ZSArIGMxYi55LnNpemUgPCB0aHJlc2hvbGQgJiZcblx0XHRcdGMyYi54LnNpemUgKyBjMmIueS5zaXplIDwgdGhyZXNob2xkXG5cdFx0KSB7XG5cdFx0XHRyZXR1cm4gW1xuXHRcdFx0XHQoKChyICogKGMxLl90MSArIGMxLl90MikpIC8gMikgfCAwKSAvIHIgK1xuXHRcdFx0XHRcIi9cIiArXG5cdFx0XHRcdCgoKHIgKiAoYzIuX3QxICsgYzIuX3QyKSkgLyAyKSB8IDApIC8gcixcblx0XHRcdF07XG5cdFx0fVxuXG5cdFx0bGV0IGNjMSA9IGMxLnNwbGl0KDAuNSksXG5cdFx0XHRjYzIgPSBjMi5zcGxpdCgwLjUpLFxuXHRcdFx0cGFpcnMgPSBbXG5cdFx0XHRcdHsgbGVmdDogY2MxLmxlZnQsIHJpZ2h0OiBjYzIubGVmdCB9LFxuXHRcdFx0XHR7IGxlZnQ6IGNjMS5sZWZ0LCByaWdodDogY2MyLnJpZ2h0IH0sXG5cdFx0XHRcdHsgbGVmdDogY2MxLnJpZ2h0LCByaWdodDogY2MyLnJpZ2h0IH0sXG5cdFx0XHRcdHsgbGVmdDogY2MxLnJpZ2h0LCByaWdodDogY2MyLmxlZnQgfSxcblx0XHRcdF07XG5cblx0XHRwYWlycyA9IHBhaXJzLmZpbHRlcihmdW5jdGlvbiAocGFpcikge1xuXHRcdFx0cmV0dXJuIHV0aWxzLmJib3hvdmVybGFwKHBhaXIubGVmdC5iYm94KCksIHBhaXIucmlnaHQuYmJveCgpKTtcblx0XHR9KTtcblxuXHRcdGxldCByZXN1bHRzID0gW107XG5cblx0XHRpZiAocGFpcnMubGVuZ3RoID09PSAwKSByZXR1cm4gcmVzdWx0cztcblxuXHRcdHBhaXJzLmZvckVhY2goZnVuY3Rpb24gKHBhaXIpIHtcblx0XHRcdHJlc3VsdHMgPSByZXN1bHRzLmNvbmNhdChcblx0XHRcdFx0dXRpbHMucGFpcml0ZXJhdGlvbihwYWlyLmxlZnQsIHBhaXIucmlnaHQsIHRocmVzaG9sZClcblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHRyZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIoZnVuY3Rpb24gKHYsIGkpIHtcblx0XHRcdHJldHVybiByZXN1bHRzLmluZGV4T2YodikgPT09IGk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gcmVzdWx0cztcblx0fSxcblxuXHRnZXRjY2VudGVyOiBmdW5jdGlvbiAocDEsIHAyLCBwMykge1xuXHRcdGNvbnN0IGR4MSA9IHAyLnggLSBwMS54LFxuXHRcdFx0ZHkxID0gcDIueSAtIHAxLnksXG5cdFx0XHRkeDIgPSBwMy54IC0gcDIueCxcblx0XHRcdGR5MiA9IHAzLnkgLSBwMi55LFxuXHRcdFx0ZHgxcCA9IGR4MSAqIGNvcyhxdWFydCkgLSBkeTEgKiBzaW4ocXVhcnQpLFxuXHRcdFx0ZHkxcCA9IGR4MSAqIHNpbihxdWFydCkgKyBkeTEgKiBjb3MocXVhcnQpLFxuXHRcdFx0ZHgycCA9IGR4MiAqIGNvcyhxdWFydCkgLSBkeTIgKiBzaW4ocXVhcnQpLFxuXHRcdFx0ZHkycCA9IGR4MiAqIHNpbihxdWFydCkgKyBkeTIgKiBjb3MocXVhcnQpLFxuXHRcdFx0Ly8gY2hvcmQgbWlkcG9pbnRzXG5cdFx0XHRteDEgPSAocDEueCArIHAyLngpIC8gMixcblx0XHRcdG15MSA9IChwMS55ICsgcDIueSkgLyAyLFxuXHRcdFx0bXgyID0gKHAyLnggKyBwMy54KSAvIDIsXG5cdFx0XHRteTIgPSAocDIueSArIHAzLnkpIC8gMixcblx0XHRcdC8vIG1pZHBvaW50IG9mZnNldHNcblx0XHRcdG14MW4gPSBteDEgKyBkeDFwLFxuXHRcdFx0bXkxbiA9IG15MSArIGR5MXAsXG5cdFx0XHRteDJuID0gbXgyICsgZHgycCxcblx0XHRcdG15Mm4gPSBteTIgKyBkeTJwLFxuXHRcdFx0Ly8gaW50ZXJzZWN0aW9uIG9mIHRoZXNlIGxpbmVzOlxuXHRcdFx0YXJjID0gdXRpbHMubGxpOChteDEsIG15MSwgbXgxbiwgbXkxbiwgbXgyLCBteTIsIG14Mm4sIG15Mm4pLFxuXHRcdFx0ciA9IHV0aWxzLmRpc3QoYXJjLCBwMSk7XG5cblx0XHQvLyBhcmMgc3RhcnQvZW5kIHZhbHVlcywgb3ZlciBtaWQgcG9pbnQ6XG5cdFx0bGV0IHMgPSBhdGFuMihwMS55IC0gYXJjLnksIHAxLnggLSBhcmMueCksXG5cdFx0XHRtID0gYXRhbjIocDIueSAtIGFyYy55LCBwMi54IC0gYXJjLngpLFxuXHRcdFx0ZSA9IGF0YW4yKHAzLnkgLSBhcmMueSwgcDMueCAtIGFyYy54KSxcblx0XHRcdF87XG5cblx0XHQvLyBkZXRlcm1pbmUgYXJjIGRpcmVjdGlvbiAoY3cvY2N3IGNvcnJlY3Rpb24pXG5cdFx0aWYgKHMgPCBlKSB7XG5cdFx0XHQvLyBpZiBzPG08ZSwgYXJjKHMsIGUpXG5cdFx0XHQvLyBpZiBtPHM8ZSwgYXJjKGUsIHMgKyB0YXUpXG5cdFx0XHQvLyBpZiBzPGU8bSwgYXJjKGUsIHMgKyB0YXUpXG5cdFx0XHRpZiAocyA+IG0gfHwgbSA+IGUpIHtcblx0XHRcdFx0cyArPSB0YXU7XG5cdFx0XHR9XG5cdFx0XHRpZiAocyA+IGUpIHtcblx0XHRcdFx0XyA9IGU7XG5cdFx0XHRcdGUgPSBzO1xuXHRcdFx0XHRzID0gXztcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gaWYgZTxtPHMsIGFyYyhlLCBzKVxuXHRcdFx0Ly8gaWYgbTxlPHMsIGFyYyhzLCBlICsgdGF1KVxuXHRcdFx0Ly8gaWYgZTxzPG0sIGFyYyhzLCBlICsgdGF1KVxuXHRcdFx0aWYgKGUgPCBtICYmIG0gPCBzKSB7XG5cdFx0XHRcdF8gPSBlO1xuXHRcdFx0XHRlID0gcztcblx0XHRcdFx0cyA9IF87XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRlICs9IHRhdTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Ly8gYXNzaWduIGFuZCBkb25lLlxuXHRcdGFyYy5zID0gcztcblx0XHRhcmMuZSA9IGU7XG5cdFx0YXJjLnIgPSByO1xuXHRcdHJldHVybiBhcmM7XG5cdH0sXG5cblx0bnVtYmVyU29ydDogZnVuY3Rpb24gKGEsIGIpIHtcblx0XHRyZXR1cm4gYSAtIGI7XG5cdH0sXG59O1xuXG4vKipcbiAqIFBvbHkgQmV6aWVyXG4gKiBAcGFyYW0ge1t0eXBlXX0gY3VydmVzIFtkZXNjcmlwdGlvbl1cbiAqL1xuY2xhc3MgUG9seUJlemllciB7XG5cdGNvbnN0cnVjdG9yKGN1cnZlcykge1xuXHRcdHRoaXMuY3VydmVzID0gW107XG5cdFx0dGhpcy5fM2QgPSBmYWxzZTtcblx0XHRpZiAoISFjdXJ2ZXMpIHtcblx0XHRcdHRoaXMuY3VydmVzID0gY3VydmVzO1xuXHRcdFx0dGhpcy5fM2QgPSB0aGlzLmN1cnZlc1swXS5fM2Q7XG5cdFx0fVxuXHR9XG5cblx0dmFsdWVPZigpIHtcblx0XHRyZXR1cm4gdGhpcy50b1N0cmluZygpO1xuXHR9XG5cblx0dG9TdHJpbmcoKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdFwiW1wiICtcblx0XHRcdHRoaXMuY3VydmVzXG5cdFx0XHRcdC5tYXAoZnVuY3Rpb24gKGN1cnZlKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHV0aWxzLnBvaW50c1RvU3RyaW5nKGN1cnZlLnBvaW50cyk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5qb2luKFwiLCBcIikgK1xuXHRcdFx0XCJdXCJcblx0XHQpO1xuXHR9XG5cblx0YWRkQ3VydmUoY3VydmUpIHtcblx0XHR0aGlzLmN1cnZlcy5wdXNoKGN1cnZlKTtcblx0XHR0aGlzLl8zZCA9IHRoaXMuXzNkIHx8IGN1cnZlLl8zZDtcblx0fVxuXG5cdGxlbmd0aCgpIHtcblx0XHRyZXR1cm4gdGhpcy5jdXJ2ZXNcblx0XHRcdC5tYXAoZnVuY3Rpb24gKHYpIHtcblx0XHRcdFx0cmV0dXJuIHYubGVuZ3RoKCk7XG5cdFx0XHR9KVxuXHRcdFx0LnJlZHVjZShmdW5jdGlvbiAoYSwgYikge1xuXHRcdFx0XHRyZXR1cm4gYSArIGI7XG5cdFx0XHR9KTtcblx0fVxuXG5cdGN1cnZlKGlkeCkge1xuXHRcdHJldHVybiB0aGlzLmN1cnZlc1tpZHhdO1xuXHR9XG5cblx0YmJveCgpIHtcblx0XHRjb25zdCBjID0gdGhpcy5jdXJ2ZXM7XG5cdFx0dmFyIGJib3ggPSBjWzBdLmJib3goKTtcblx0XHRmb3IgKHZhciBpID0gMTsgaSA8IGMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHV0aWxzLmV4cGFuZGJveChiYm94LCBjW2ldLmJib3goKSk7XG5cdFx0fVxuXHRcdHJldHVybiBiYm94O1xuXHR9XG5cblx0b2Zmc2V0KGQpIHtcblx0XHRjb25zdCBvZmZzZXQgPSBbXTtcblx0XHR0aGlzLmN1cnZlcy5mb3JFYWNoKGZ1bmN0aW9uICh2KSB7XG5cdFx0XHRvZmZzZXQucHVzaCguLi52Lm9mZnNldChkKSk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIG5ldyBQb2x5QmV6aWVyKG9mZnNldCk7XG5cdH1cbn1cblxuLyoqXG4gIEEgamF2YXNjcmlwdCBCZXppZXIgY3VydmUgbGlicmFyeSBieSBQb21heC5cblxuICBCYXNlZCBvbiBodHRwOi8vcG9tYXguZ2l0aHViLmlvL2JlemllcmluZm9cblxuICBUaGlzIGNvZGUgaXMgTUlUIGxpY2Vuc2VkLlxuKiovXG5cbi8vIG1hdGgtaW5saW5pbmcuXG5jb25zdCB7IGFiczogYWJzJDEsIG1pbiwgbWF4LCBjb3M6IGNvcyQxLCBzaW46IHNpbiQxLCBhY29zOiBhY29zJDEsIHNxcnQ6IHNxcnQkMSB9ID0gTWF0aDtcbmNvbnN0IHBpJDEgPSBNYXRoLlBJO1xuXG4vKipcbiAqIEJlemllciBjdXJ2ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiAuLi5kb2NzIHBlbmRpbmcuLi5cbiAqL1xuY2xhc3MgQmV6aWVyIHtcblx0Y29uc3RydWN0b3IoY29vcmRzKSB7XG5cdFx0bGV0IGFyZ3MgPVxuXHRcdFx0Y29vcmRzICYmIGNvb3Jkcy5mb3JFYWNoID8gY29vcmRzIDogQXJyYXkuZnJvbShhcmd1bWVudHMpLnNsaWNlKCk7XG5cdFx0bGV0IGNvb3JkbGVuID0gZmFsc2U7XG5cblx0XHRpZiAodHlwZW9mIGFyZ3NbMF0gPT09IFwib2JqZWN0XCIpIHtcblx0XHRcdGNvb3JkbGVuID0gYXJncy5sZW5ndGg7XG5cdFx0XHRjb25zdCBuZXdhcmdzID0gW107XG5cdFx0XHRhcmdzLmZvckVhY2goZnVuY3Rpb24gKHBvaW50KSB7XG5cdFx0XHRcdFtcInhcIiwgXCJ5XCIsIFwielwiXS5mb3JFYWNoKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdFx0aWYgKHR5cGVvZiBwb2ludFtkXSAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0XHRcdFx0bmV3YXJncy5wdXNoKHBvaW50W2RdKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0XHRhcmdzID0gbmV3YXJncztcblx0XHR9XG5cblx0XHRsZXQgaGlnaGVyID0gZmFsc2U7XG5cdFx0Y29uc3QgbGVuID0gYXJncy5sZW5ndGg7XG5cblx0XHRpZiAoY29vcmRsZW4pIHtcblx0XHRcdGlmIChjb29yZGxlbiA+IDQpIHtcblx0XHRcdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggIT09IDEpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHRcdFx0XHRcIk9ubHkgbmV3IEJlemllcihwb2ludFtdKSBpcyBhY2NlcHRlZCBmb3IgNHRoIGFuZCBoaWdoZXIgb3JkZXIgY3VydmVzXCJcblx0XHRcdFx0XHQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGhpZ2hlciA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmIChsZW4gIT09IDYgJiYgbGVuICE9PSA4ICYmIGxlbiAhPT0gOSAmJiBsZW4gIT09IDEyKSB7XG5cdFx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoICE9PSAxKSB7XG5cdFx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHRcdFx0XCJPbmx5IG5ldyBCZXppZXIocG9pbnRbXSkgaXMgYWNjZXB0ZWQgZm9yIDR0aCBhbmQgaGlnaGVyIG9yZGVyIGN1cnZlc1wiXG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGNvbnN0IF8zZCA9ICh0aGlzLl8zZCA9XG5cdFx0XHQoIWhpZ2hlciAmJiAobGVuID09PSA5IHx8IGxlbiA9PT0gMTIpKSB8fFxuXHRcdFx0KGNvb3JkcyAmJiBjb29yZHNbMF0gJiYgdHlwZW9mIGNvb3Jkc1swXS56ICE9PSBcInVuZGVmaW5lZFwiKSk7XG5cblx0XHRjb25zdCBwb2ludHMgPSAodGhpcy5wb2ludHMgPSBbXSk7XG5cdFx0Zm9yIChsZXQgaWR4ID0gMCwgc3RlcCA9IF8zZCA/IDMgOiAyOyBpZHggPCBsZW47IGlkeCArPSBzdGVwKSB7XG5cdFx0XHR2YXIgcG9pbnQgPSB7XG5cdFx0XHRcdHg6IGFyZ3NbaWR4XSxcblx0XHRcdFx0eTogYXJnc1tpZHggKyAxXSxcblx0XHRcdH07XG5cdFx0XHRpZiAoXzNkKSB7XG5cdFx0XHRcdHBvaW50LnogPSBhcmdzW2lkeCArIDJdO1xuXHRcdFx0fVxuXHRcdFx0cG9pbnRzLnB1c2gocG9pbnQpO1xuXHRcdH1cblx0XHRjb25zdCBvcmRlciA9ICh0aGlzLm9yZGVyID0gcG9pbnRzLmxlbmd0aCAtIDEpO1xuXG5cdFx0Y29uc3QgZGltcyA9ICh0aGlzLmRpbXMgPSBbXCJ4XCIsIFwieVwiXSk7XG5cdFx0aWYgKF8zZCkgZGltcy5wdXNoKFwielwiKTtcblx0XHR0aGlzLmRpbWxlbiA9IGRpbXMubGVuZ3RoO1xuXG5cdFx0Y29uc3QgYWxpZ25lZCA9IHV0aWxzLmFsaWduKHBvaW50cywgeyBwMTogcG9pbnRzWzBdLCBwMjogcG9pbnRzW29yZGVyXSB9KTtcblx0XHR0aGlzLl9saW5lYXIgPSAhYWxpZ25lZC5zb21lKChwKSA9PiBhYnMkMShwLnkpID4gMC4wMDAxKTtcblxuXHRcdHRoaXMuX2x1dCA9IFtdO1xuXG5cdFx0dGhpcy5fdDEgPSAwO1xuXHRcdHRoaXMuX3QyID0gMTtcblx0XHR0aGlzLnVwZGF0ZSgpO1xuXHR9XG5cblx0c3RhdGljIHF1YWRyYXRpY0Zyb21Qb2ludHMocDEsIHAyLCBwMywgdCkge1xuXHRcdGlmICh0eXBlb2YgdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0dCA9IDAuNTtcblx0XHR9XG5cdFx0Ly8gc2hvcnRjdXRzLCBhbHRob3VnaCB0aGV5J3JlIHJlYWxseSBkdW1iXG5cdFx0aWYgKHQgPT09IDApIHtcblx0XHRcdHJldHVybiBuZXcgQmV6aWVyKHAyLCBwMiwgcDMpO1xuXHRcdH1cblx0XHRpZiAodCA9PT0gMSkge1xuXHRcdFx0cmV0dXJuIG5ldyBCZXppZXIocDEsIHAyLCBwMik7XG5cdFx0fVxuXHRcdC8vIHJlYWwgZml0dGluZy5cblx0XHRjb25zdCBhYmMgPSBCZXppZXIuZ2V0QUJDKDIsIHAxLCBwMiwgcDMsIHQpO1xuXHRcdHJldHVybiBuZXcgQmV6aWVyKHAxLCBhYmMuQSwgcDMpO1xuXHR9XG5cblx0c3RhdGljIGN1YmljRnJvbVBvaW50cyhTLCBCLCBFLCB0LCBkMSkge1xuXHRcdGlmICh0eXBlb2YgdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0dCA9IDAuNTtcblx0XHR9XG5cdFx0Y29uc3QgYWJjID0gQmV6aWVyLmdldEFCQygzLCBTLCBCLCBFLCB0KTtcblx0XHRpZiAodHlwZW9mIGQxID09PSBcInVuZGVmaW5lZFwiKSB7XG5cdFx0XHRkMSA9IHV0aWxzLmRpc3QoQiwgYWJjLkMpO1xuXHRcdH1cblx0XHRjb25zdCBkMiA9IChkMSAqICgxIC0gdCkpIC8gdDtcblxuXHRcdGNvbnN0IHNlbGVuID0gdXRpbHMuZGlzdChTLCBFKSxcblx0XHRcdGx4ID0gKEUueCAtIFMueCkgLyBzZWxlbixcblx0XHRcdGx5ID0gKEUueSAtIFMueSkgLyBzZWxlbixcblx0XHRcdGJ4MSA9IGQxICogbHgsXG5cdFx0XHRieTEgPSBkMSAqIGx5LFxuXHRcdFx0YngyID0gZDIgKiBseCxcblx0XHRcdGJ5MiA9IGQyICogbHk7XG5cdFx0Ly8gZGVyaXZhdGlvbiBvZiBuZXcgaHVsbCBjb29yZGluYXRlc1xuXHRcdGNvbnN0IGUxID0geyB4OiBCLnggLSBieDEsIHk6IEIueSAtIGJ5MSB9LFxuXHRcdFx0ZTIgPSB7IHg6IEIueCArIGJ4MiwgeTogQi55ICsgYnkyIH0sXG5cdFx0XHRBID0gYWJjLkEsXG5cdFx0XHR2MSA9IHsgeDogQS54ICsgKGUxLnggLSBBLngpIC8gKDEgLSB0KSwgeTogQS55ICsgKGUxLnkgLSBBLnkpIC8gKDEgLSB0KSB9LFxuXHRcdFx0djIgPSB7IHg6IEEueCArIChlMi54IC0gQS54KSAvIHQsIHk6IEEueSArIChlMi55IC0gQS55KSAvIHQgfSxcblx0XHRcdG5jMSA9IHsgeDogUy54ICsgKHYxLnggLSBTLngpIC8gdCwgeTogUy55ICsgKHYxLnkgLSBTLnkpIC8gdCB9LFxuXHRcdFx0bmMyID0ge1xuXHRcdFx0XHR4OiBFLnggKyAodjIueCAtIEUueCkgLyAoMSAtIHQpLFxuXHRcdFx0XHR5OiBFLnkgKyAodjIueSAtIEUueSkgLyAoMSAtIHQpLFxuXHRcdFx0fTtcblx0XHQvLyAuLi5kb25lXG5cdFx0cmV0dXJuIG5ldyBCZXppZXIoUywgbmMxLCBuYzIsIEUpO1xuXHR9XG5cblx0c3RhdGljIGdldFV0aWxzKCkge1xuXHRcdHJldHVybiB1dGlscztcblx0fVxuXG5cdGdldFV0aWxzKCkge1xuXHRcdHJldHVybiBCZXppZXIuZ2V0VXRpbHMoKTtcblx0fVxuXG5cdHN0YXRpYyBnZXQgUG9seUJlemllcigpIHtcblx0XHRyZXR1cm4gUG9seUJlemllcjtcblx0fVxuXG5cdHZhbHVlT2YoKSB7XG5cdFx0cmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcblx0fVxuXG5cdHRvU3RyaW5nKCkge1xuXHRcdHJldHVybiB1dGlscy5wb2ludHNUb1N0cmluZyh0aGlzLnBvaW50cyk7XG5cdH1cblxuXHR0b1NWRygpIHtcblx0XHRpZiAodGhpcy5fM2QpIHJldHVybiBmYWxzZTtcblx0XHRjb25zdCBwID0gdGhpcy5wb2ludHMsXG5cdFx0XHR4ID0gcFswXS54LFxuXHRcdFx0eSA9IHBbMF0ueSxcblx0XHRcdHMgPSBbXCJNXCIsIHgsIHksIHRoaXMub3JkZXIgPT09IDIgPyBcIlFcIiA6IFwiQ1wiXTtcblx0XHRmb3IgKGxldCBpID0gMSwgbGFzdCA9IHAubGVuZ3RoOyBpIDwgbGFzdDsgaSsrKSB7XG5cdFx0XHRzLnB1c2gocFtpXS54KTtcblx0XHRcdHMucHVzaChwW2ldLnkpO1xuXHRcdH1cblx0XHRyZXR1cm4gcy5qb2luKFwiIFwiKTtcblx0fVxuXG5cdHNldFJhdGlvcyhyYXRpb3MpIHtcblx0XHRpZiAocmF0aW9zLmxlbmd0aCAhPT0gdGhpcy5wb2ludHMubGVuZ3RoKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJpbmNvcnJlY3QgbnVtYmVyIG9mIHJhdGlvIHZhbHVlc1wiKTtcblx0XHR9XG5cdFx0dGhpcy5yYXRpb3MgPSByYXRpb3M7XG5cdFx0dGhpcy5fbHV0ID0gW107IC8vICBpbnZhbGlkYXRlIGFueSBwcmVjb21wdXRlZCBMVVRcblx0fVxuXG5cdHZlcmlmeSgpIHtcblx0XHRjb25zdCBwcmludCA9IHRoaXMuY29vcmREaWdlc3QoKTtcblx0XHRpZiAocHJpbnQgIT09IHRoaXMuX3ByaW50KSB7XG5cdFx0XHR0aGlzLl9wcmludCA9IHByaW50O1xuXHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHR9XG5cdH1cblxuXHRjb29yZERpZ2VzdCgpIHtcblx0XHRyZXR1cm4gdGhpcy5wb2ludHNcblx0XHRcdC5tYXAoZnVuY3Rpb24gKGMsIHBvcykge1xuXHRcdFx0XHRyZXR1cm4gXCJcIiArIHBvcyArIGMueCArIGMueSArIChjLnogPyBjLnogOiAwKTtcblx0XHRcdH0pXG5cdFx0XHQuam9pbihcIlwiKTtcblx0fVxuXG5cdHVwZGF0ZSgpIHtcblx0XHQvLyBpbnZhbGlkYXRlIGFueSBwcmVjb21wdXRlZCBMVVRcblx0XHR0aGlzLl9sdXQgPSBbXTtcblx0XHR0aGlzLmRwb2ludHMgPSB1dGlscy5kZXJpdmUodGhpcy5wb2ludHMsIHRoaXMuXzNkKTtcblx0XHR0aGlzLmNvbXB1dGVkaXJlY3Rpb24oKTtcblx0fVxuXG5cdGNvbXB1dGVkaXJlY3Rpb24oKSB7XG5cdFx0Y29uc3QgcG9pbnRzID0gdGhpcy5wb2ludHM7XG5cdFx0Y29uc3QgYW5nbGUgPSB1dGlscy5hbmdsZShwb2ludHNbMF0sIHBvaW50c1t0aGlzLm9yZGVyXSwgcG9pbnRzWzFdKTtcblx0XHR0aGlzLmNsb2Nrd2lzZSA9IGFuZ2xlID4gMDtcblx0fVxuXG5cdGxlbmd0aCgpIHtcblx0XHRyZXR1cm4gdXRpbHMubGVuZ3RoKHRoaXMuZGVyaXZhdGl2ZS5iaW5kKHRoaXMpKTtcblx0fVxuXG5cdHN0YXRpYyBnZXRBQkMob3JkZXIgPSAyLCBTLCBCLCBFLCB0ID0gMC41KSB7XG5cdFx0Y29uc3QgdSA9IHV0aWxzLnByb2plY3Rpb25yYXRpbyh0LCBvcmRlciksXG5cdFx0XHR1bSA9IDEgLSB1LFxuXHRcdFx0QyA9IHtcblx0XHRcdFx0eDogdSAqIFMueCArIHVtICogRS54LFxuXHRcdFx0XHR5OiB1ICogUy55ICsgdW0gKiBFLnksXG5cdFx0XHR9LFxuXHRcdFx0cyA9IHV0aWxzLmFiY3JhdGlvKHQsIG9yZGVyKSxcblx0XHRcdEEgPSB7XG5cdFx0XHRcdHg6IEIueCArIChCLnggLSBDLngpIC8gcyxcblx0XHRcdFx0eTogQi55ICsgKEIueSAtIEMueSkgLyBzLFxuXHRcdFx0fTtcblx0XHRyZXR1cm4geyBBLCBCLCBDLCBTLCBFIH07XG5cdH1cblxuXHRnZXRBQkModCwgQikge1xuXHRcdEIgPSBCIHx8IHRoaXMuZ2V0KHQpO1xuXHRcdGxldCBTID0gdGhpcy5wb2ludHNbMF07XG5cdFx0bGV0IEUgPSB0aGlzLnBvaW50c1t0aGlzLm9yZGVyXTtcblx0XHRyZXR1cm4gQmV6aWVyLmdldEFCQyh0aGlzLm9yZGVyLCBTLCBCLCBFLCB0KTtcblx0fVxuXG5cdGdldExVVChzdGVwcykge1xuXHRcdHRoaXMudmVyaWZ5KCk7XG5cdFx0c3RlcHMgPSBzdGVwcyB8fCAxMDA7XG5cdFx0aWYgKHRoaXMuX2x1dC5sZW5ndGggPT09IHN0ZXBzKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fbHV0O1xuXHRcdH1cblx0XHR0aGlzLl9sdXQgPSBbXTtcblx0XHQvLyBXZSB3YW50IGEgcmFuZ2UgZnJvbSAwIHRvIDEgaW5jbHVzaXZlLCBzb1xuXHRcdC8vIHdlIGRlY3JlbWVudCBhbmQgdGhlbiB1c2UgPD0gcmF0aGVyIHRoYW4gPDpcblx0XHRzdGVwcy0tO1xuXHRcdGZvciAobGV0IGkgPSAwLCBwLCB0OyBpIDwgc3RlcHM7IGkrKykge1xuXHRcdFx0dCA9IGkgLyAoc3RlcHMgLSAxKTtcblx0XHRcdHAgPSB0aGlzLmNvbXB1dGUodCk7XG5cdFx0XHRwLnQgPSB0O1xuXHRcdFx0dGhpcy5fbHV0LnB1c2gocCk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLl9sdXQ7XG5cdH1cblxuXHRvbihwb2ludCwgZXJyb3IpIHtcblx0XHRlcnJvciA9IGVycm9yIHx8IDU7XG5cdFx0Y29uc3QgbHV0ID0gdGhpcy5nZXRMVVQoKSxcblx0XHRcdGhpdHMgPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMCwgYywgdCA9IDA7IGkgPCBsdXQubGVuZ3RoOyBpKyspIHtcblx0XHRcdGMgPSBsdXRbaV07XG5cdFx0XHRpZiAodXRpbHMuZGlzdChjLCBwb2ludCkgPCBlcnJvcikge1xuXHRcdFx0XHRoaXRzLnB1c2goYyk7XG5cdFx0XHRcdHQgKz0gaSAvIGx1dC5sZW5ndGg7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICghaGl0cy5sZW5ndGgpIHJldHVybiBmYWxzZTtcblx0XHRyZXR1cm4gKHQgLz0gaGl0cy5sZW5ndGgpO1xuXHR9XG5cblx0cHJvamVjdChwb2ludCkge1xuXHRcdC8vIHN0ZXAgMTogY29hcnNlIGNoZWNrXG5cdFx0Y29uc3QgTFVUID0gdGhpcy5nZXRMVVQoKSxcblx0XHRcdGwgPSBMVVQubGVuZ3RoIC0gMSxcblx0XHRcdGNsb3Nlc3QgPSB1dGlscy5jbG9zZXN0KExVVCwgcG9pbnQpLFxuXHRcdFx0bXBvcyA9IGNsb3Nlc3QubXBvcyxcblx0XHRcdHQxID0gKG1wb3MgLSAxKSAvIGwsXG5cdFx0XHR0MiA9IChtcG9zICsgMSkgLyBsLFxuXHRcdFx0c3RlcCA9IDAuMSAvIGw7XG5cblx0XHQvLyBzdGVwIDI6IGZpbmUgY2hlY2tcblx0XHRsZXQgbWRpc3QgPSBjbG9zZXN0Lm1kaXN0LFxuXHRcdFx0dCA9IHQxLFxuXHRcdFx0ZnQgPSB0LFxuXHRcdFx0cDtcblx0XHRtZGlzdCArPSAxO1xuXHRcdGZvciAobGV0IGQ7IHQgPCB0MiArIHN0ZXA7IHQgKz0gc3RlcCkge1xuXHRcdFx0cCA9IHRoaXMuY29tcHV0ZSh0KTtcblx0XHRcdGQgPSB1dGlscy5kaXN0KHBvaW50LCBwKTtcblx0XHRcdGlmIChkIDwgbWRpc3QpIHtcblx0XHRcdFx0bWRpc3QgPSBkO1xuXHRcdFx0XHRmdCA9IHQ7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGZ0ID0gZnQgPCAwID8gMCA6IGZ0ID4gMSA/IDEgOiBmdDtcblx0XHRwID0gdGhpcy5jb21wdXRlKGZ0KTtcblx0XHRwLnQgPSBmdDtcblx0XHRwLmQgPSBtZGlzdDtcblx0XHRyZXR1cm4gcDtcblx0fVxuXG5cdGdldCh0KSB7XG5cdFx0cmV0dXJuIHRoaXMuY29tcHV0ZSh0KTtcblx0fVxuXG5cdHBvaW50KGlkeCkge1xuXHRcdHJldHVybiB0aGlzLnBvaW50c1tpZHhdO1xuXHR9XG5cblx0Y29tcHV0ZSh0KSB7XG5cdFx0aWYgKHRoaXMucmF0aW9zKSB7XG5cdFx0XHRyZXR1cm4gdXRpbHMuY29tcHV0ZVdpdGhSYXRpb3ModCwgdGhpcy5wb2ludHMsIHRoaXMucmF0aW9zLCB0aGlzLl8zZCk7XG5cdFx0fVxuXHRcdHJldHVybiB1dGlscy5jb21wdXRlKHQsIHRoaXMucG9pbnRzLCB0aGlzLl8zZCwgdGhpcy5yYXRpb3MpO1xuXHR9XG5cblx0cmFpc2UoKSB7XG5cdFx0Y29uc3QgcCA9IHRoaXMucG9pbnRzLFxuXHRcdFx0bnAgPSBbcFswXV0sXG5cdFx0XHRrID0gcC5sZW5ndGg7XG5cdFx0Zm9yIChsZXQgaSA9IDEsIHBpLCBwaW07IGkgPCBrOyBpKyspIHtcblx0XHRcdHBpID0gcFtpXTtcblx0XHRcdHBpbSA9IHBbaSAtIDFdO1xuXHRcdFx0bnBbaV0gPSB7XG5cdFx0XHRcdHg6ICgoayAtIGkpIC8gaykgKiBwaS54ICsgKGkgLyBrKSAqIHBpbS54LFxuXHRcdFx0XHR5OiAoKGsgLSBpKSAvIGspICogcGkueSArIChpIC8gaykgKiBwaW0ueSxcblx0XHRcdH07XG5cdFx0fVxuXHRcdG5wW2tdID0gcFtrIC0gMV07XG5cdFx0cmV0dXJuIG5ldyBCZXppZXIobnApO1xuXHR9XG5cblx0ZGVyaXZhdGl2ZSh0KSB7XG5cdFx0cmV0dXJuIHV0aWxzLmNvbXB1dGUodCwgdGhpcy5kcG9pbnRzWzBdKTtcblx0fVxuXG5cdGRkZXJpdmF0aXZlKHQpIHtcblx0XHRyZXR1cm4gdXRpbHMuY29tcHV0ZSh0LCB0aGlzLmRwb2ludHNbMV0pO1xuXHR9XG5cblx0YWxpZ24oKSB7XG5cdFx0bGV0IHAgPSB0aGlzLnBvaW50cztcblx0XHRyZXR1cm4gbmV3IEJlemllcih1dGlscy5hbGlnbihwLCB7IHAxOiBwWzBdLCBwMjogcFtwLmxlbmd0aCAtIDFdIH0pKTtcblx0fVxuXG5cdGN1cnZhdHVyZSh0KSB7XG5cdFx0cmV0dXJuIHV0aWxzLmN1cnZhdHVyZSh0LCB0aGlzLmRwb2ludHNbMF0sIHRoaXMuZHBvaW50c1sxXSwgdGhpcy5fM2QpO1xuXHR9XG5cblx0aW5mbGVjdGlvbnMoKSB7XG5cdFx0cmV0dXJuIHV0aWxzLmluZmxlY3Rpb25zKHRoaXMucG9pbnRzKTtcblx0fVxuXG5cdG5vcm1hbCh0KSB7XG5cdFx0cmV0dXJuIHRoaXMuXzNkID8gdGhpcy5fX25vcm1hbDModCkgOiB0aGlzLl9fbm9ybWFsMih0KTtcblx0fVxuXG5cdF9fbm9ybWFsMih0KSB7XG5cdFx0Y29uc3QgZCA9IHRoaXMuZGVyaXZhdGl2ZSh0KTtcblx0XHRjb25zdCBxID0gc3FydCQxKGQueCAqIGQueCArIGQueSAqIGQueSk7XG5cdFx0cmV0dXJuIHsgeDogLWQueSAvIHEsIHk6IGQueCAvIHEgfTtcblx0fVxuXG5cdF9fbm9ybWFsMyh0KSB7XG5cdFx0Ly8gc2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjU0NTMxNTlcblx0XHRjb25zdCByMSA9IHRoaXMuZGVyaXZhdGl2ZSh0KSxcblx0XHRcdHIyID0gdGhpcy5kZXJpdmF0aXZlKHQgKyAwLjAxKSxcblx0XHRcdHExID0gc3FydCQxKHIxLnggKiByMS54ICsgcjEueSAqIHIxLnkgKyByMS56ICogcjEueiksXG5cdFx0XHRxMiA9IHNxcnQkMShyMi54ICogcjIueCArIHIyLnkgKiByMi55ICsgcjIueiAqIHIyLnopO1xuXHRcdHIxLnggLz0gcTE7XG5cdFx0cjEueSAvPSBxMTtcblx0XHRyMS56IC89IHExO1xuXHRcdHIyLnggLz0gcTI7XG5cdFx0cjIueSAvPSBxMjtcblx0XHRyMi56IC89IHEyO1xuXHRcdC8vIGNyb3NzIHByb2R1Y3Rcblx0XHRjb25zdCBjID0ge1xuXHRcdFx0eDogcjIueSAqIHIxLnogLSByMi56ICogcjEueSxcblx0XHRcdHk6IHIyLnogKiByMS54IC0gcjIueCAqIHIxLnosXG5cdFx0XHR6OiByMi54ICogcjEueSAtIHIyLnkgKiByMS54LFxuXHRcdH07XG5cdFx0Y29uc3QgbSA9IHNxcnQkMShjLnggKiBjLnggKyBjLnkgKiBjLnkgKyBjLnogKiBjLnopO1xuXHRcdGMueCAvPSBtO1xuXHRcdGMueSAvPSBtO1xuXHRcdGMueiAvPSBtO1xuXHRcdC8vIHJvdGF0aW9uIG1hdHJpeFxuXHRcdGNvbnN0IFIgPSBbXG5cdFx0XHRjLnggKiBjLngsXG5cdFx0XHRjLnggKiBjLnkgLSBjLnosXG5cdFx0XHRjLnggKiBjLnogKyBjLnksXG5cdFx0XHRjLnggKiBjLnkgKyBjLnosXG5cdFx0XHRjLnkgKiBjLnksXG5cdFx0XHRjLnkgKiBjLnogLSBjLngsXG5cdFx0XHRjLnggKiBjLnogLSBjLnksXG5cdFx0XHRjLnkgKiBjLnogKyBjLngsXG5cdFx0XHRjLnogKiBjLnosXG5cdFx0XTtcblx0XHQvLyBub3JtYWwgdmVjdG9yOlxuXHRcdGNvbnN0IG4gPSB7XG5cdFx0XHR4OiBSWzBdICogcjEueCArIFJbMV0gKiByMS55ICsgUlsyXSAqIHIxLnosXG5cdFx0XHR5OiBSWzNdICogcjEueCArIFJbNF0gKiByMS55ICsgUls1XSAqIHIxLnosXG5cdFx0XHR6OiBSWzZdICogcjEueCArIFJbN10gKiByMS55ICsgUls4XSAqIHIxLnosXG5cdFx0fTtcblx0XHRyZXR1cm4gbjtcblx0fVxuXG5cdGh1bGwodCkge1xuXHRcdGxldCBwID0gdGhpcy5wb2ludHMsXG5cdFx0XHRfcCA9IFtdLFxuXHRcdFx0cSA9IFtdLFxuXHRcdFx0aWR4ID0gMDtcblx0XHRxW2lkeCsrXSA9IHBbMF07XG5cdFx0cVtpZHgrK10gPSBwWzFdO1xuXHRcdHFbaWR4KytdID0gcFsyXTtcblx0XHRpZiAodGhpcy5vcmRlciA9PT0gMykge1xuXHRcdFx0cVtpZHgrK10gPSBwWzNdO1xuXHRcdH1cblx0XHQvLyB3ZSBsZXJwIGJldHdlZW4gYWxsIHBvaW50cyBhdCBlYWNoIGl0ZXJhdGlvbiwgdW50aWwgd2UgaGF2ZSAxIHBvaW50IGxlZnQuXG5cdFx0d2hpbGUgKHAubGVuZ3RoID4gMSkge1xuXHRcdFx0X3AgPSBbXTtcblx0XHRcdGZvciAobGV0IGkgPSAwLCBwdCwgbCA9IHAubGVuZ3RoIC0gMTsgaSA8IGw7IGkrKykge1xuXHRcdFx0XHRwdCA9IHV0aWxzLmxlcnAodCwgcFtpXSwgcFtpICsgMV0pO1xuXHRcdFx0XHRxW2lkeCsrXSA9IHB0O1xuXHRcdFx0XHRfcC5wdXNoKHB0KTtcblx0XHRcdH1cblx0XHRcdHAgPSBfcDtcblx0XHR9XG5cdFx0cmV0dXJuIHE7XG5cdH1cblxuXHRzcGxpdCh0MSwgdDIpIHtcblx0XHQvLyBzaG9ydGN1dHNcblx0XHRpZiAodDEgPT09IDAgJiYgISF0Mikge1xuXHRcdFx0cmV0dXJuIHRoaXMuc3BsaXQodDIpLmxlZnQ7XG5cdFx0fVxuXHRcdGlmICh0MiA9PT0gMSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuc3BsaXQodDEpLnJpZ2h0O1xuXHRcdH1cblxuXHRcdC8vIG5vIHNob3J0Y3V0OiB1c2UgXCJkZSBDYXN0ZWxqYXVcIiBpdGVyYXRpb24uXG5cdFx0Y29uc3QgcSA9IHRoaXMuaHVsbCh0MSk7XG5cdFx0Y29uc3QgcmVzdWx0ID0ge1xuXHRcdFx0bGVmdDpcblx0XHRcdFx0dGhpcy5vcmRlciA9PT0gMlxuXHRcdFx0XHRcdD8gbmV3IEJlemllcihbcVswXSwgcVszXSwgcVs1XV0pXG5cdFx0XHRcdFx0OiBuZXcgQmV6aWVyKFtxWzBdLCBxWzRdLCBxWzddLCBxWzldXSksXG5cdFx0XHRyaWdodDpcblx0XHRcdFx0dGhpcy5vcmRlciA9PT0gMlxuXHRcdFx0XHRcdD8gbmV3IEJlemllcihbcVs1XSwgcVs0XSwgcVsyXV0pXG5cdFx0XHRcdFx0OiBuZXcgQmV6aWVyKFtxWzldLCBxWzhdLCBxWzZdLCBxWzNdXSksXG5cdFx0XHRzcGFuOiBxLFxuXHRcdH07XG5cblx0XHQvLyBtYWtlIHN1cmUgd2UgYmluZCBfdDEvX3QyIGluZm9ybWF0aW9uIVxuXHRcdHJlc3VsdC5sZWZ0Ll90MSA9IHV0aWxzLm1hcCgwLCAwLCAxLCB0aGlzLl90MSwgdGhpcy5fdDIpO1xuXHRcdHJlc3VsdC5sZWZ0Ll90MiA9IHV0aWxzLm1hcCh0MSwgMCwgMSwgdGhpcy5fdDEsIHRoaXMuX3QyKTtcblx0XHRyZXN1bHQucmlnaHQuX3QxID0gdXRpbHMubWFwKHQxLCAwLCAxLCB0aGlzLl90MSwgdGhpcy5fdDIpO1xuXHRcdHJlc3VsdC5yaWdodC5fdDIgPSB1dGlscy5tYXAoMSwgMCwgMSwgdGhpcy5fdDEsIHRoaXMuX3QyKTtcblxuXHRcdC8vIGlmIHdlIGhhdmUgbm8gdDIsIHdlJ3JlIGRvbmVcblx0XHRpZiAoIXQyKSB7XG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xuXHRcdH1cblxuXHRcdC8vIGlmIHdlIGhhdmUgYSB0Miwgc3BsaXQgYWdhaW46XG5cdFx0dDIgPSB1dGlscy5tYXAodDIsIHQxLCAxLCAwLCAxKTtcblx0XHRyZXR1cm4gcmVzdWx0LnJpZ2h0LnNwbGl0KHQyKS5sZWZ0O1xuXHR9XG5cblx0ZXh0cmVtYSgpIHtcblx0XHRjb25zdCByZXN1bHQgPSB7fTtcblx0XHRsZXQgcm9vdHMgPSBbXTtcblxuXHRcdHRoaXMuZGltcy5mb3JFYWNoKFxuXHRcdFx0ZnVuY3Rpb24gKGRpbSkge1xuXHRcdFx0XHRsZXQgbWZuID0gZnVuY3Rpb24gKHYpIHtcblx0XHRcdFx0XHRyZXR1cm4gdltkaW1dO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRsZXQgcCA9IHRoaXMuZHBvaW50c1swXS5tYXAobWZuKTtcblx0XHRcdFx0cmVzdWx0W2RpbV0gPSB1dGlscy5kcm9vdHMocCk7XG5cdFx0XHRcdGlmICh0aGlzLm9yZGVyID09PSAzKSB7XG5cdFx0XHRcdFx0cCA9IHRoaXMuZHBvaW50c1sxXS5tYXAobWZuKTtcblx0XHRcdFx0XHRyZXN1bHRbZGltXSA9IHJlc3VsdFtkaW1dLmNvbmNhdCh1dGlscy5kcm9vdHMocCkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJlc3VsdFtkaW1dID0gcmVzdWx0W2RpbV0uZmlsdGVyKGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdFx0cmV0dXJuIHQgPj0gMCAmJiB0IDw9IDE7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRyb290cyA9IHJvb3RzLmNvbmNhdChyZXN1bHRbZGltXS5zb3J0KHV0aWxzLm51bWJlclNvcnQpKTtcblx0XHRcdH0uYmluZCh0aGlzKVxuXHRcdCk7XG5cblx0XHRyZXN1bHQudmFsdWVzID0gcm9vdHMuc29ydCh1dGlscy5udW1iZXJTb3J0KS5maWx0ZXIoZnVuY3Rpb24gKHYsIGlkeCkge1xuXHRcdFx0cmV0dXJuIHJvb3RzLmluZGV4T2YodikgPT09IGlkeDtcblx0XHR9KTtcblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRiYm94KCkge1xuXHRcdGNvbnN0IGV4dHJlbWEgPSB0aGlzLmV4dHJlbWEoKSxcblx0XHRcdHJlc3VsdCA9IHt9O1xuXHRcdHRoaXMuZGltcy5mb3JFYWNoKFxuXHRcdFx0ZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0cmVzdWx0W2RdID0gdXRpbHMuZ2V0bWlubWF4KHRoaXMsIGQsIGV4dHJlbWFbZF0pO1xuXHRcdFx0fS5iaW5kKHRoaXMpXG5cdFx0KTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0b3ZlcmxhcHMoY3VydmUpIHtcblx0XHRjb25zdCBsYmJveCA9IHRoaXMuYmJveCgpLFxuXHRcdFx0dGJib3ggPSBjdXJ2ZS5iYm94KCk7XG5cdFx0cmV0dXJuIHV0aWxzLmJib3hvdmVybGFwKGxiYm94LCB0YmJveCk7XG5cdH1cblxuXHRvZmZzZXQodCwgZCkge1xuXHRcdGlmICh0eXBlb2YgZCAhPT0gXCJ1bmRlZmluZWRcIikge1xuXHRcdFx0Y29uc3QgYyA9IHRoaXMuZ2V0KHQpLFxuXHRcdFx0XHRuID0gdGhpcy5ub3JtYWwodCk7XG5cdFx0XHRjb25zdCByZXQgPSB7XG5cdFx0XHRcdGM6IGMsXG5cdFx0XHRcdG46IG4sXG5cdFx0XHRcdHg6IGMueCArIG4ueCAqIGQsXG5cdFx0XHRcdHk6IGMueSArIG4ueSAqIGQsXG5cdFx0XHR9O1xuXHRcdFx0aWYgKHRoaXMuXzNkKSB7XG5cdFx0XHRcdHJldC56ID0gYy56ICsgbi56ICogZDtcblx0XHRcdH1cblx0XHRcdHJldHVybiByZXQ7XG5cdFx0fVxuXHRcdGlmICh0aGlzLl9saW5lYXIpIHtcblx0XHRcdGNvbnN0IG52ID0gdGhpcy5ub3JtYWwoMCksXG5cdFx0XHRcdGNvb3JkcyA9IHRoaXMucG9pbnRzLm1hcChmdW5jdGlvbiAocCkge1xuXHRcdFx0XHRcdGNvbnN0IHJldCA9IHtcblx0XHRcdFx0XHRcdHg6IHAueCArIHQgKiBudi54LFxuXHRcdFx0XHRcdFx0eTogcC55ICsgdCAqIG52LnksXG5cdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRpZiAocC56ICYmIG52LnopIHtcblx0XHRcdFx0XHRcdHJldC56ID0gcC56ICsgdCAqIG52Lno7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIFtuZXcgQmV6aWVyKGNvb3JkcyldO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5yZWR1Y2UoKS5tYXAoZnVuY3Rpb24gKHMpIHtcblx0XHRcdGlmIChzLl9saW5lYXIpIHtcblx0XHRcdFx0cmV0dXJuIHMub2Zmc2V0KHQpWzBdO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHMuc2NhbGUodCk7XG5cdFx0fSk7XG5cdH1cblxuXHRzaW1wbGUoKSB7XG5cdFx0aWYgKHRoaXMub3JkZXIgPT09IDMpIHtcblx0XHRcdGNvbnN0IGExID0gdXRpbHMuYW5nbGUodGhpcy5wb2ludHNbMF0sIHRoaXMucG9pbnRzWzNdLCB0aGlzLnBvaW50c1sxXSk7XG5cdFx0XHRjb25zdCBhMiA9IHV0aWxzLmFuZ2xlKHRoaXMucG9pbnRzWzBdLCB0aGlzLnBvaW50c1szXSwgdGhpcy5wb2ludHNbMl0pO1xuXHRcdFx0aWYgKChhMSA+IDAgJiYgYTIgPCAwKSB8fCAoYTEgPCAwICYmIGEyID4gMCkpIHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0Y29uc3QgbjEgPSB0aGlzLm5vcm1hbCgwKTtcblx0XHRjb25zdCBuMiA9IHRoaXMubm9ybWFsKDEpO1xuXHRcdGxldCBzID0gbjEueCAqIG4yLnggKyBuMS55ICogbjIueTtcblx0XHRpZiAodGhpcy5fM2QpIHtcblx0XHRcdHMgKz0gbjEueiAqIG4yLno7XG5cdFx0fVxuXHRcdHJldHVybiBhYnMkMShhY29zJDEocykpIDwgcGkkMSAvIDM7XG5cdH1cblxuXHRyZWR1Y2UoKSB7XG5cdFx0Ly8gVE9ETzogZXhhbWluZSB0aGVzZSB2YXIgdHlwZXMgaW4gbW9yZSBkZXRhaWwuLi5cblx0XHRsZXQgaSxcblx0XHRcdHQxID0gMCxcblx0XHRcdHQyID0gMCxcblx0XHRcdHN0ZXAgPSAwLjAxLFxuXHRcdFx0c2VnbWVudCxcblx0XHRcdHBhc3MxID0gW10sXG5cdFx0XHRwYXNzMiA9IFtdO1xuXHRcdC8vIGZpcnN0IHBhc3M6IHNwbGl0IG9uIGV4dHJlbWFcblx0XHRsZXQgZXh0cmVtYSA9IHRoaXMuZXh0cmVtYSgpLnZhbHVlcztcblx0XHRpZiAoZXh0cmVtYS5pbmRleE9mKDApID09PSAtMSkge1xuXHRcdFx0ZXh0cmVtYSA9IFswXS5jb25jYXQoZXh0cmVtYSk7XG5cdFx0fVxuXHRcdGlmIChleHRyZW1hLmluZGV4T2YoMSkgPT09IC0xKSB7XG5cdFx0XHRleHRyZW1hLnB1c2goMSk7XG5cdFx0fVxuXG5cdFx0Zm9yICh0MSA9IGV4dHJlbWFbMF0sIGkgPSAxOyBpIDwgZXh0cmVtYS5sZW5ndGg7IGkrKykge1xuXHRcdFx0dDIgPSBleHRyZW1hW2ldO1xuXHRcdFx0c2VnbWVudCA9IHRoaXMuc3BsaXQodDEsIHQyKTtcblx0XHRcdHNlZ21lbnQuX3QxID0gdDE7XG5cdFx0XHRzZWdtZW50Ll90MiA9IHQyO1xuXHRcdFx0cGFzczEucHVzaChzZWdtZW50KTtcblx0XHRcdHQxID0gdDI7XG5cdFx0fVxuXG5cdFx0Ly8gc2Vjb25kIHBhc3M6IGZ1cnRoZXIgcmVkdWNlIHRoZXNlIHNlZ21lbnRzIHRvIHNpbXBsZSBzZWdtZW50c1xuXHRcdHBhc3MxLmZvckVhY2goZnVuY3Rpb24gKHAxKSB7XG5cdFx0XHR0MSA9IDA7XG5cdFx0XHR0MiA9IDA7XG5cdFx0XHR3aGlsZSAodDIgPD0gMSkge1xuXHRcdFx0XHRmb3IgKHQyID0gdDEgKyBzdGVwOyB0MiA8PSAxICsgc3RlcDsgdDIgKz0gc3RlcCkge1xuXHRcdFx0XHRcdHNlZ21lbnQgPSBwMS5zcGxpdCh0MSwgdDIpO1xuXHRcdFx0XHRcdGlmICghc2VnbWVudC5zaW1wbGUoKSkge1xuXHRcdFx0XHRcdFx0dDIgLT0gc3RlcDtcblx0XHRcdFx0XHRcdGlmIChhYnMkMSh0MSAtIHQyKSA8IHN0ZXApIHtcblx0XHRcdFx0XHRcdFx0Ly8gd2UgY2FuIG5ldmVyIGZvcm0gYSByZWR1Y3Rpb25cblx0XHRcdFx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0c2VnbWVudCA9IHAxLnNwbGl0KHQxLCB0Mik7XG5cdFx0XHRcdFx0XHRzZWdtZW50Ll90MSA9IHV0aWxzLm1hcCh0MSwgMCwgMSwgcDEuX3QxLCBwMS5fdDIpO1xuXHRcdFx0XHRcdFx0c2VnbWVudC5fdDIgPSB1dGlscy5tYXAodDIsIDAsIDEsIHAxLl90MSwgcDEuX3QyKTtcblx0XHRcdFx0XHRcdHBhc3MyLnB1c2goc2VnbWVudCk7XG5cdFx0XHRcdFx0XHR0MSA9IHQyO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAodDEgPCAxKSB7XG5cdFx0XHRcdHNlZ21lbnQgPSBwMS5zcGxpdCh0MSwgMSk7XG5cdFx0XHRcdHNlZ21lbnQuX3QxID0gdXRpbHMubWFwKHQxLCAwLCAxLCBwMS5fdDEsIHAxLl90Mik7XG5cdFx0XHRcdHNlZ21lbnQuX3QyID0gcDEuX3QyO1xuXHRcdFx0XHRwYXNzMi5wdXNoKHNlZ21lbnQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiBwYXNzMjtcblx0fVxuXG5cdHNjYWxlKGQpIHtcblx0XHRjb25zdCBvcmRlciA9IHRoaXMub3JkZXI7XG5cdFx0bGV0IGRpc3RhbmNlRm4gPSBmYWxzZTtcblx0XHRpZiAodHlwZW9mIGQgPT09IFwiZnVuY3Rpb25cIikge1xuXHRcdFx0ZGlzdGFuY2VGbiA9IGQ7XG5cdFx0fVxuXHRcdGlmIChkaXN0YW5jZUZuICYmIG9yZGVyID09PSAyKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5yYWlzZSgpLnNjYWxlKGRpc3RhbmNlRm4pO1xuXHRcdH1cblxuXHRcdC8vIFRPRE86IGFkZCBzcGVjaWFsIGhhbmRsaW5nIGZvciBkZWdlbmVyYXRlICg9bGluZWFyKSBjdXJ2ZXMuXG5cdFx0Y29uc3QgY2xvY2t3aXNlID0gdGhpcy5jbG9ja3dpc2U7XG5cdFx0Y29uc3QgcjEgPSBkaXN0YW5jZUZuID8gZGlzdGFuY2VGbigwKSA6IGQ7XG5cdFx0Y29uc3QgcjIgPSBkaXN0YW5jZUZuID8gZGlzdGFuY2VGbigxKSA6IGQ7XG5cdFx0Y29uc3QgdiA9IFt0aGlzLm9mZnNldCgwLCAxMCksIHRoaXMub2Zmc2V0KDEsIDEwKV07XG5cdFx0Y29uc3QgcG9pbnRzID0gdGhpcy5wb2ludHM7XG5cdFx0Y29uc3QgbnAgPSBbXTtcblx0XHRjb25zdCBvID0gdXRpbHMubGxpNCh2WzBdLCB2WzBdLmMsIHZbMV0sIHZbMV0uYyk7XG5cblx0XHRpZiAoIW8pIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihcImNhbm5vdCBzY2FsZSB0aGlzIGN1cnZlLiBUcnkgcmVkdWNpbmcgaXQgZmlyc3QuXCIpO1xuXHRcdH1cblx0XHQvLyBtb3ZlIGFsbCBwb2ludHMgYnkgZGlzdGFuY2UgJ2QnIHdydCB0aGUgb3JpZ2luICdvJ1xuXG5cdFx0Ly8gbW92ZSBlbmQgcG9pbnRzIGJ5IGZpeGVkIGRpc3RhbmNlIGFsb25nIG5vcm1hbC5cblx0XHRbMCwgMV0uZm9yRWFjaChmdW5jdGlvbiAodCkge1xuXHRcdFx0Y29uc3QgcCA9IChucFt0ICogb3JkZXJdID0gdXRpbHMuY29weShwb2ludHNbdCAqIG9yZGVyXSkpO1xuXHRcdFx0cC54ICs9ICh0ID8gcjIgOiByMSkgKiB2W3RdLm4ueDtcblx0XHRcdHAueSArPSAodCA/IHIyIDogcjEpICogdlt0XS5uLnk7XG5cdFx0fSk7XG5cblx0XHRpZiAoIWRpc3RhbmNlRm4pIHtcblx0XHRcdC8vIG1vdmUgY29udHJvbCBwb2ludHMgdG8gbGllIG9uIHRoZSBpbnRlcnNlY3Rpb24gb2YgdGhlIG9mZnNldFxuXHRcdFx0Ly8gZGVyaXZhdGl2ZSB2ZWN0b3IsIGFuZCB0aGUgb3JpZ2luLXRocm91Z2gtY29udHJvbCB2ZWN0b3Jcblx0XHRcdFswLCAxXS5mb3JFYWNoKCh0KSA9PiB7XG5cdFx0XHRcdGlmIChvcmRlciA9PT0gMiAmJiAhIXQpIHJldHVybjtcblx0XHRcdFx0Y29uc3QgcCA9IG5wW3QgKiBvcmRlcl07XG5cdFx0XHRcdGNvbnN0IGQgPSB0aGlzLmRlcml2YXRpdmUodCk7XG5cdFx0XHRcdGNvbnN0IHAyID0geyB4OiBwLnggKyBkLngsIHk6IHAueSArIGQueSB9O1xuXHRcdFx0XHRucFt0ICsgMV0gPSB1dGlscy5sbGk0KHAsIHAyLCBvLCBwb2ludHNbdCArIDFdKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIG5ldyBCZXppZXIobnApO1xuXHRcdH1cblxuXHRcdC8vIG1vdmUgY29udHJvbCBwb2ludHMgYnkgXCJob3dldmVyIG11Y2ggbmVjZXNzYXJ5IHRvXG5cdFx0Ly8gZW5zdXJlIHRoZSBjb3JyZWN0IHRhbmdlbnQgdG8gZW5kcG9pbnRcIi5cblx0XHRbMCwgMV0uZm9yRWFjaChmdW5jdGlvbiAodCkge1xuXHRcdFx0aWYgKG9yZGVyID09PSAyICYmICEhdCkgcmV0dXJuO1xuXHRcdFx0dmFyIHAgPSBwb2ludHNbdCArIDFdO1xuXHRcdFx0dmFyIG92ID0ge1xuXHRcdFx0XHR4OiBwLnggLSBvLngsXG5cdFx0XHRcdHk6IHAueSAtIG8ueSxcblx0XHRcdH07XG5cdFx0XHR2YXIgcmMgPSBkaXN0YW5jZUZuID8gZGlzdGFuY2VGbigodCArIDEpIC8gb3JkZXIpIDogZDtcblx0XHRcdGlmIChkaXN0YW5jZUZuICYmICFjbG9ja3dpc2UpIHJjID0gLXJjO1xuXHRcdFx0dmFyIG0gPSBzcXJ0JDEob3YueCAqIG92LnggKyBvdi55ICogb3YueSk7XG5cdFx0XHRvdi54IC89IG07XG5cdFx0XHRvdi55IC89IG07XG5cdFx0XHRucFt0ICsgMV0gPSB7XG5cdFx0XHRcdHg6IHAueCArIHJjICogb3YueCxcblx0XHRcdFx0eTogcC55ICsgcmMgKiBvdi55LFxuXHRcdFx0fTtcblx0XHR9KTtcblx0XHRyZXR1cm4gbmV3IEJlemllcihucCk7XG5cdH1cblxuXHRvdXRsaW5lKGQxLCBkMiwgZDMsIGQ0KSB7XG5cdFx0ZDIgPSB0eXBlb2YgZDIgPT09IFwidW5kZWZpbmVkXCIgPyBkMSA6IGQyO1xuXHRcdGNvbnN0IHJlZHVjZWQgPSB0aGlzLnJlZHVjZSgpLFxuXHRcdFx0bGVuID0gcmVkdWNlZC5sZW5ndGgsXG5cdFx0XHRmY3VydmVzID0gW107XG5cblx0XHRsZXQgYmN1cnZlcyA9IFtdLFxuXHRcdFx0cCxcblx0XHRcdGFsZW4gPSAwLFxuXHRcdFx0dGxlbiA9IHRoaXMubGVuZ3RoKCk7XG5cblx0XHRjb25zdCBncmFkdWF0ZWQgPSB0eXBlb2YgZDMgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGQ0ICE9PSBcInVuZGVmaW5lZFwiO1xuXG5cdFx0ZnVuY3Rpb24gbGluZWFyRGlzdGFuY2VGdW5jdGlvbihzLCBlLCB0bGVuLCBhbGVuLCBzbGVuKSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gKHYpIHtcblx0XHRcdFx0Y29uc3QgZjEgPSBhbGVuIC8gdGxlbixcblx0XHRcdFx0XHRmMiA9IChhbGVuICsgc2xlbikgLyB0bGVuLFxuXHRcdFx0XHRcdGQgPSBlIC0gcztcblx0XHRcdFx0cmV0dXJuIHV0aWxzLm1hcCh2LCAwLCAxLCBzICsgZjEgKiBkLCBzICsgZjIgKiBkKTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly8gZm9ybSBjdXJ2ZSBvdWxpbmVzXG5cdFx0cmVkdWNlZC5mb3JFYWNoKGZ1bmN0aW9uIChzZWdtZW50KSB7XG5cdFx0XHRjb25zdCBzbGVuID0gc2VnbWVudC5sZW5ndGgoKTtcblx0XHRcdGlmIChncmFkdWF0ZWQpIHtcblx0XHRcdFx0ZmN1cnZlcy5wdXNoKFxuXHRcdFx0XHRcdHNlZ21lbnQuc2NhbGUobGluZWFyRGlzdGFuY2VGdW5jdGlvbihkMSwgZDMsIHRsZW4sIGFsZW4sIHNsZW4pKVxuXHRcdFx0XHQpO1xuXHRcdFx0XHRiY3VydmVzLnB1c2goXG5cdFx0XHRcdFx0c2VnbWVudC5zY2FsZShsaW5lYXJEaXN0YW5jZUZ1bmN0aW9uKC1kMiwgLWQ0LCB0bGVuLCBhbGVuLCBzbGVuKSlcblx0XHRcdFx0KTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGZjdXJ2ZXMucHVzaChzZWdtZW50LnNjYWxlKGQxKSk7XG5cdFx0XHRcdGJjdXJ2ZXMucHVzaChzZWdtZW50LnNjYWxlKC1kMikpO1xuXHRcdFx0fVxuXHRcdFx0YWxlbiArPSBzbGVuO1xuXHRcdH0pO1xuXG5cdFx0Ly8gcmV2ZXJzZSB0aGUgXCJyZXR1cm5cIiBvdXRsaW5lXG5cdFx0YmN1cnZlcyA9IGJjdXJ2ZXNcblx0XHRcdC5tYXAoZnVuY3Rpb24gKHMpIHtcblx0XHRcdFx0cCA9IHMucG9pbnRzO1xuXHRcdFx0XHRpZiAocFszXSkge1xuXHRcdFx0XHRcdHMucG9pbnRzID0gW3BbM10sIHBbMl0sIHBbMV0sIHBbMF1dO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHMucG9pbnRzID0gW3BbMl0sIHBbMV0sIHBbMF1dO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiBzO1xuXHRcdFx0fSlcblx0XHRcdC5yZXZlcnNlKCk7XG5cblx0XHQvLyBmb3JtIHRoZSBlbmRjYXBzIGFzIGxpbmVzXG5cdFx0Y29uc3QgZnMgPSBmY3VydmVzWzBdLnBvaW50c1swXSxcblx0XHRcdGZlID0gZmN1cnZlc1tsZW4gLSAxXS5wb2ludHNbZmN1cnZlc1tsZW4gLSAxXS5wb2ludHMubGVuZ3RoIC0gMV0sXG5cdFx0XHRicyA9IGJjdXJ2ZXNbbGVuIC0gMV0ucG9pbnRzW2JjdXJ2ZXNbbGVuIC0gMV0ucG9pbnRzLmxlbmd0aCAtIDFdLFxuXHRcdFx0YmUgPSBiY3VydmVzWzBdLnBvaW50c1swXSxcblx0XHRcdGxzID0gdXRpbHMubWFrZWxpbmUoYnMsIGZzKSxcblx0XHRcdGxlID0gdXRpbHMubWFrZWxpbmUoZmUsIGJlKSxcblx0XHRcdHNlZ21lbnRzID0gW2xzXS5jb25jYXQoZmN1cnZlcykuY29uY2F0KFtsZV0pLmNvbmNhdChiY3VydmVzKTtcblxuXHRcdHJldHVybiBuZXcgUG9seUJlemllcihzZWdtZW50cyk7XG5cdH1cblxuXHRvdXRsaW5lc2hhcGVzKGQxLCBkMiwgY3VydmVJbnRlcnNlY3Rpb25UaHJlc2hvbGQpIHtcblx0XHRkMiA9IGQyIHx8IGQxO1xuXHRcdGNvbnN0IG91dGxpbmUgPSB0aGlzLm91dGxpbmUoZDEsIGQyKS5jdXJ2ZXM7XG5cdFx0Y29uc3Qgc2hhcGVzID0gW107XG5cdFx0Zm9yIChsZXQgaSA9IDEsIGxlbiA9IG91dGxpbmUubGVuZ3RoOyBpIDwgbGVuIC8gMjsgaSsrKSB7XG5cdFx0XHRjb25zdCBzaGFwZSA9IHV0aWxzLm1ha2VzaGFwZShcblx0XHRcdFx0b3V0bGluZVtpXSxcblx0XHRcdFx0b3V0bGluZVtsZW4gLSBpXSxcblx0XHRcdFx0Y3VydmVJbnRlcnNlY3Rpb25UaHJlc2hvbGRcblx0XHRcdCk7XG5cdFx0XHRzaGFwZS5zdGFydGNhcC52aXJ0dWFsID0gaSA+IDE7XG5cdFx0XHRzaGFwZS5lbmRjYXAudmlydHVhbCA9IGkgPCBsZW4gLyAyIC0gMTtcblx0XHRcdHNoYXBlcy5wdXNoKHNoYXBlKTtcblx0XHR9XG5cdFx0cmV0dXJuIHNoYXBlcztcblx0fVxuXG5cdGludGVyc2VjdHMoY3VydmUsIGN1cnZlSW50ZXJzZWN0aW9uVGhyZXNob2xkKSB7XG5cdFx0aWYgKCFjdXJ2ZSkgcmV0dXJuIHRoaXMuc2VsZmludGVyc2VjdHMoY3VydmVJbnRlcnNlY3Rpb25UaHJlc2hvbGQpO1xuXHRcdGlmIChjdXJ2ZS5wMSAmJiBjdXJ2ZS5wMikge1xuXHRcdFx0cmV0dXJuIHRoaXMubGluZUludGVyc2VjdHMoY3VydmUpO1xuXHRcdH1cblx0XHRpZiAoY3VydmUgaW5zdGFuY2VvZiBCZXppZXIpIHtcblx0XHRcdGN1cnZlID0gY3VydmUucmVkdWNlKCk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLmN1cnZlaW50ZXJzZWN0cyhcblx0XHRcdHRoaXMucmVkdWNlKCksXG5cdFx0XHRjdXJ2ZSxcblx0XHRcdGN1cnZlSW50ZXJzZWN0aW9uVGhyZXNob2xkXG5cdFx0KTtcblx0fVxuXG5cdGxpbmVJbnRlcnNlY3RzKGxpbmUpIHtcblx0XHRjb25zdCBteCA9IG1pbihsaW5lLnAxLngsIGxpbmUucDIueCksXG5cdFx0XHRteSA9IG1pbihsaW5lLnAxLnksIGxpbmUucDIueSksXG5cdFx0XHRNWCA9IG1heChsaW5lLnAxLngsIGxpbmUucDIueCksXG5cdFx0XHRNWSA9IG1heChsaW5lLnAxLnksIGxpbmUucDIueSk7XG5cdFx0cmV0dXJuIHV0aWxzLnJvb3RzKHRoaXMucG9pbnRzLCBsaW5lKS5maWx0ZXIoKHQpID0+IHtcblx0XHRcdHZhciBwID0gdGhpcy5nZXQodCk7XG5cdFx0XHRyZXR1cm4gdXRpbHMuYmV0d2VlbihwLngsIG14LCBNWCkgJiYgdXRpbHMuYmV0d2VlbihwLnksIG15LCBNWSk7XG5cdFx0fSk7XG5cdH1cblxuXHRzZWxmaW50ZXJzZWN0cyhjdXJ2ZUludGVyc2VjdGlvblRocmVzaG9sZCkge1xuXHRcdC8vIFwic2ltcGxlXCIgY3VydmVzIGNhbm5vdCBpbnRlcnNlY3Qgd2l0aCB0aGVpciBkaXJlY3Rcblx0XHQvLyBuZWlnaGJvdXIsIHNvIGZvciBlYWNoIHNlZ21lbnQgWCB3ZSBjaGVjayB3aGV0aGVyXG5cdFx0Ly8gaXQgaW50ZXJzZWN0cyBbMDp4LTJdW3grMjpsYXN0XS5cblxuXHRcdGNvbnN0IHJlZHVjZWQgPSB0aGlzLnJlZHVjZSgpLFxuXHRcdFx0bGVuID0gcmVkdWNlZC5sZW5ndGggLSAyLFxuXHRcdFx0cmVzdWx0cyA9IFtdO1xuXG5cdFx0Zm9yIChsZXQgaSA9IDAsIHJlc3VsdCwgbGVmdCwgcmlnaHQ7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0bGVmdCA9IHJlZHVjZWQuc2xpY2UoaSwgaSArIDEpO1xuXHRcdFx0cmlnaHQgPSByZWR1Y2VkLnNsaWNlKGkgKyAyKTtcblx0XHRcdHJlc3VsdCA9IHRoaXMuY3VydmVpbnRlcnNlY3RzKGxlZnQsIHJpZ2h0LCBjdXJ2ZUludGVyc2VjdGlvblRocmVzaG9sZCk7XG5cdFx0XHRyZXN1bHRzLnB1c2goLi4ucmVzdWx0KTtcblx0XHR9XG5cdFx0cmV0dXJuIHJlc3VsdHM7XG5cdH1cblxuXHRjdXJ2ZWludGVyc2VjdHMoYzEsIGMyLCBjdXJ2ZUludGVyc2VjdGlvblRocmVzaG9sZCkge1xuXHRcdGNvbnN0IHBhaXJzID0gW107XG5cdFx0Ly8gc3RlcCAxOiBwYWlyIG9mZiBhbnkgb3ZlcmxhcHBpbmcgc2VnbWVudHNcblx0XHRjMS5mb3JFYWNoKGZ1bmN0aW9uIChsKSB7XG5cdFx0XHRjMi5mb3JFYWNoKGZ1bmN0aW9uIChyKSB7XG5cdFx0XHRcdGlmIChsLm92ZXJsYXBzKHIpKSB7XG5cdFx0XHRcdFx0cGFpcnMucHVzaCh7IGxlZnQ6IGwsIHJpZ2h0OiByIH0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHQvLyBzdGVwIDI6IGZvciBlYWNoIHBhaXJpbmcsIHJ1biB0aHJvdWdoIHRoZSBjb252ZXJnZW5jZSBhbGdvcml0aG0uXG5cdFx0bGV0IGludGVyc2VjdGlvbnMgPSBbXTtcblx0XHRwYWlycy5mb3JFYWNoKGZ1bmN0aW9uIChwYWlyKSB7XG5cdFx0XHRjb25zdCByZXN1bHQgPSB1dGlscy5wYWlyaXRlcmF0aW9uKFxuXHRcdFx0XHRwYWlyLmxlZnQsXG5cdFx0XHRcdHBhaXIucmlnaHQsXG5cdFx0XHRcdGN1cnZlSW50ZXJzZWN0aW9uVGhyZXNob2xkXG5cdFx0XHQpO1xuXHRcdFx0aWYgKHJlc3VsdC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdGludGVyc2VjdGlvbnMgPSBpbnRlcnNlY3Rpb25zLmNvbmNhdChyZXN1bHQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiBpbnRlcnNlY3Rpb25zO1xuXHR9XG5cblx0YXJjcyhlcnJvclRocmVzaG9sZCkge1xuXHRcdGVycm9yVGhyZXNob2xkID0gZXJyb3JUaHJlc2hvbGQgfHwgMC41O1xuXHRcdHJldHVybiB0aGlzLl9pdGVyYXRlKGVycm9yVGhyZXNob2xkLCBbXSk7XG5cdH1cblxuXHRfZXJyb3IocGMsIG5wMSwgcywgZSkge1xuXHRcdGNvbnN0IHEgPSAoZSAtIHMpIC8gNCxcblx0XHRcdGMxID0gdGhpcy5nZXQocyArIHEpLFxuXHRcdFx0YzIgPSB0aGlzLmdldChlIC0gcSksXG5cdFx0XHRyZWYgPSB1dGlscy5kaXN0KHBjLCBucDEpLFxuXHRcdFx0ZDEgPSB1dGlscy5kaXN0KHBjLCBjMSksXG5cdFx0XHRkMiA9IHV0aWxzLmRpc3QocGMsIGMyKTtcblx0XHRyZXR1cm4gYWJzJDEoZDEgLSByZWYpICsgYWJzJDEoZDIgLSByZWYpO1xuXHR9XG5cblx0X2l0ZXJhdGUoZXJyb3JUaHJlc2hvbGQsIGNpcmNsZXMpIHtcblx0XHRsZXQgdF9zID0gMCxcblx0XHRcdHRfZSA9IDEsXG5cdFx0XHRzYWZldHk7XG5cdFx0Ly8gd2UgZG8gYSBiaW5hcnkgc2VhcmNoIHRvIGZpbmQgdGhlIFwiZ29vZCBgdGAgY2xvc2VzdCB0byBuby1sb25nZXItZ29vZFwiXG5cdFx0ZG8ge1xuXHRcdFx0c2FmZXR5ID0gMDtcblxuXHRcdFx0Ly8gc3RlcCAxOiBzdGFydCB3aXRoIHRoZSBtYXhpbXVtIHBvc3NpYmxlIGFyY1xuXHRcdFx0dF9lID0gMTtcblxuXHRcdFx0Ly8gcG9pbnRzOlxuXHRcdFx0bGV0IG5wMSA9IHRoaXMuZ2V0KHRfcyksXG5cdFx0XHRcdG5wMixcblx0XHRcdFx0bnAzLFxuXHRcdFx0XHRhcmMsXG5cdFx0XHRcdHByZXZfYXJjO1xuXG5cdFx0XHQvLyBib29sZWFuczpcblx0XHRcdGxldCBjdXJyX2dvb2QgPSBmYWxzZSxcblx0XHRcdFx0cHJldl9nb29kID0gZmFsc2UsXG5cdFx0XHRcdGRvbmU7XG5cblx0XHRcdC8vIG51bWJlcnM6XG5cdFx0XHRsZXQgdF9tID0gdF9lLFxuXHRcdFx0XHRwcmV2X2UgPSAxO1xuXG5cdFx0XHQvLyBzdGVwIDI6IGZpbmQgdGhlIGJlc3QgcG9zc2libGUgYXJjXG5cdFx0XHRkbyB7XG5cdFx0XHRcdHByZXZfZ29vZCA9IGN1cnJfZ29vZDtcblx0XHRcdFx0cHJldl9hcmMgPSBhcmM7XG5cdFx0XHRcdHRfbSA9ICh0X3MgKyB0X2UpIC8gMjtcblxuXHRcdFx0XHRucDIgPSB0aGlzLmdldCh0X20pO1xuXHRcdFx0XHRucDMgPSB0aGlzLmdldCh0X2UpO1xuXG5cdFx0XHRcdGFyYyA9IHV0aWxzLmdldGNjZW50ZXIobnAxLCBucDIsIG5wMyk7XG5cblx0XHRcdFx0Ly9hbHNvIHNhdmUgdGhlIHQgdmFsdWVzXG5cdFx0XHRcdGFyYy5pbnRlcnZhbCA9IHtcblx0XHRcdFx0XHRzdGFydDogdF9zLFxuXHRcdFx0XHRcdGVuZDogdF9lLFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGxldCBlcnJvciA9IHRoaXMuX2Vycm9yKGFyYywgbnAxLCB0X3MsIHRfZSk7XG5cdFx0XHRcdGN1cnJfZ29vZCA9IGVycm9yIDw9IGVycm9yVGhyZXNob2xkO1xuXG5cdFx0XHRcdGRvbmUgPSBwcmV2X2dvb2QgJiYgIWN1cnJfZ29vZDtcblx0XHRcdFx0aWYgKCFkb25lKSBwcmV2X2UgPSB0X2U7XG5cblx0XHRcdFx0Ly8gdGhpcyBhcmMgaXMgZmluZTogd2UgY2FuIG1vdmUgJ2UnIHVwIHRvIHNlZSBpZiB3ZSBjYW4gZmluZCBhIHdpZGVyIGFyY1xuXHRcdFx0XHRpZiAoY3Vycl9nb29kKSB7XG5cdFx0XHRcdFx0Ly8gaWYgZSBpcyBhbHJlYWR5IGF0IG1heCwgdGhlbiB3ZSdyZSBkb25lIGZvciB0aGlzIGFyYy5cblx0XHRcdFx0XHRpZiAodF9lID49IDEpIHtcblx0XHRcdFx0XHRcdC8vIG1ha2Ugc3VyZSB3ZSBjYXAgYXQgdD0xXG5cdFx0XHRcdFx0XHRhcmMuaW50ZXJ2YWwuZW5kID0gcHJldl9lID0gMTtcblx0XHRcdFx0XHRcdHByZXZfYXJjID0gYXJjO1xuXHRcdFx0XHRcdFx0Ly8gaWYgd2UgY2FwcGVkIHRoZSBhcmMgc2VnbWVudCB0byB0PTEgd2UgYWxzbyBuZWVkIHRvIG1ha2Ugc3VyZSB0aGF0XG5cdFx0XHRcdFx0XHQvLyB0aGUgYXJjJ3MgZW5kIGFuZ2xlIGlzIGNvcnJlY3Qgd2l0aCByZXNwZWN0IHRvIHRoZSBiZXppZXIgZW5kIHBvaW50LlxuXHRcdFx0XHRcdFx0aWYgKHRfZSA+IDEpIHtcblx0XHRcdFx0XHRcdFx0bGV0IGQgPSB7XG5cdFx0XHRcdFx0XHRcdFx0eDogYXJjLnggKyBhcmMuciAqIGNvcyQxKGFyYy5lKSxcblx0XHRcdFx0XHRcdFx0XHR5OiBhcmMueSArIGFyYy5yICogc2luJDEoYXJjLmUpLFxuXHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0XHRhcmMuZSArPSB1dGlscy5hbmdsZSh7IHg6IGFyYy54LCB5OiBhcmMueSB9LCBkLCB0aGlzLmdldCgxKSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gaWYgbm90LCBtb3ZlIGl0IHVwIGJ5IGhhbGYgdGhlIGl0ZXJhdGlvbiBkaXN0YW5jZVxuXHRcdFx0XHRcdHRfZSA9IHRfZSArICh0X2UgLSB0X3MpIC8gMjtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyB0aGlzIGlzIGEgYmFkIGFyYzogd2UgbmVlZCB0byBtb3ZlICdlJyBkb3duIHRvIGZpbmQgYSBnb29kIGFyY1xuXHRcdFx0XHRcdHRfZSA9IHRfbTtcblx0XHRcdFx0fVxuXHRcdFx0fSB3aGlsZSAoIWRvbmUgJiYgc2FmZXR5KysgPCAxMDApO1xuXG5cdFx0XHRpZiAoc2FmZXR5ID49IDEwMCkge1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0Ly8gY29uc29sZS5sb2coXCJMODM1OiBbRl0gYXJjIGZvdW5kXCIsIHRfcywgcHJldl9lLCBwcmV2X2FyYy54LCBwcmV2X2FyYy55LCBwcmV2X2FyYy5zLCBwcmV2X2FyYy5lKTtcblxuXHRcdFx0cHJldl9hcmMgPSBwcmV2X2FyYyA/IHByZXZfYXJjIDogYXJjO1xuXHRcdFx0Y2lyY2xlcy5wdXNoKHByZXZfYXJjKTtcblx0XHRcdHRfcyA9IHByZXZfZTtcblx0XHR9IHdoaWxlICh0X2UgPCAxKTtcblx0XHRyZXR1cm4gY2lyY2xlcztcblx0fVxufVxuXG5leHBvcnQgeyBCZXppZXIgfTsiXX0=
