import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

/** Hard feature edges (deg). Lower = denser creases (port/mouth rims). */
const WIRE_EDGE_THRESHOLD = 10;
/**
 * Rest pose — SolidWorks-style three-quarter (scroll scrub adds on top).
 * GLB arrives inverted vs gravity-up; upright flip is baked in prepareModel.
 * Yaw biased so the middle-collar port ("mouth") faces the viewer at mid-scroll.
 */
const MODEL_UPRIGHT = Math.PI;
const REST_YAW = (55 * Math.PI) / 180;
const REST_PITCH = (-3 * Math.PI) / 180;
/** Camera: slightly above looking down; yaw mostly comes from REST_YAW. */
const CAM_ELEV_DEG = 16;
const CAM_AZIM_DEG = 2;
/**
 * Margin vs tight projected fit (1 = mesh verts touch FOV edges).
 * Prefer a little extra empty space over cropping tips on spin.
 */
const FRAME_MARGIN = 1.55;
/** Yaw samples for union bounds across the full scrub spin. */
const FRAME_YAW_SAMPLES = 10;
/**
 * Half-span of scrub yaw (deg). 180 → full 360° turn from enter→leave
 * via (progress - 0.5) * 2 * SCRUB_YAW.
 */
const SCRUB_YAW_DEG = 180;
const PANEL_CLEAR = 0xffffff;
const LINE_COLOR = 0x000000;
const EDGE_DEPTH_BIAS = 0.006;
/** Keep a contour edge when one face is nearly tangent to the camera. */
const SILHOUETTE_TANGENT_EPS = 0.040;
/** Keep leader tips a few px outside the bubble border. */
const CALLOUT_LINE_GAP_PX = 5;
/** Scroll progress thresholds for feature highlights: Green (Ring) stays longer, Blue (Mouth) starts earlier. */
const RING_OUT_THRESHOLD = 0.49;
const MOUTH_IN_THRESHOLD = 0.55;

(function initProjectArtifacts() {
	const sections = document.querySelectorAll(".project-artifact");
	if (!sections.length) return;

	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (location.protocol === "file:") {
		sections.forEach(function (section) {
			const status = section.querySelector(".project-artifact__status");
			if (status) {
				status.textContent =
					"3D viewer needs a local server (http://localhost…), not a file:// page. From the site folder run: python -m http.server 8765";
			}
		});
		return;
	}

	sections.forEach(function (section) {
		try {
			setupArtifact(section, reduceMotion);
		} catch (err) {
			console.error(err);
			const status = section.querySelector(".project-artifact__status");
			if (status) status.textContent = "3D viewer failed to start. Try a hard refresh (Ctrl+Shift+R).";
		}
	});
})();

function setupArtifact(section, reduceMotion) {
	const status = section.querySelector(".project-artifact__status");
	const panels = collectPanels(section);
	if (!panels.length) return;

	function setStatus(message) {
		if (status) status.textContent = message || "";
	}

	const slots = [];
	for (let i = 0; i < panels.length; i++) {
		try {
			slots.push({
				panel: panels[i],
				modelUrl: panels[i].getAttribute("data-model"),
				view: createView(panels[i]),
				model: null,
				callouts: collectCallouts(panels[i]),
				ready: false,
			});
		} catch (err) {
			console.error("WebGL view failed", err);
			const msg = err && err.message ? err.message : String(err);
			setStatus(
				"Couldn’t create 3D viewer (" + msg + "). Try hard-refreshing (Ctrl+Shift+R)."
			);
			return;
		}
	}

	let frameId = 0;
	let disposed = false;
	let loadsPending = slots.length;
	let loadFailed = false;

	const loadWatchdog = window.setTimeout(function () {
		if (!section.classList.contains("is-ready") && !loadFailed) {
			setStatus(
				"Still loading the CAD model… Check that the .glb files are reachable, then hard-refresh."
			);
		}
	}, 10000);

	/**
	 * Scroll progress while the (normal-height) section crosses the viewport.
	 * 0 as the section enters from below, 1 as it leaves above.
	 */
	function scrollProgress() {
		const rect = section.getBoundingClientRect();
		const vh = window.innerHeight || 1;
		const total = vh + Math.max(rect.height, 1);
		const scrolled = vh - rect.top;
		return Math.min(1, Math.max(0, scrolled / total));
	}

	function resize() {
		for (let i = 0; i < slots.length; i++) slots[i].view.resize();
	}

	function updateCallouts(slot, progress) {
		const callouts = slot.callouts;
		if (!callouts.length || !slot.model) return;

		const panelRect = slot.panel.getBoundingClientRect();
		const pw = Math.max(panelRect.width, 1);
		const ph = Math.max(panelRect.height, 1);
		const world = new THREE.Vector3();
		const ndc = new THREE.Vector3();

		for (let i = 0; i < callouts.length; i++) {
			const item = callouts[i];
			const feat = item.el.getAttribute("data-feature");
			let active = false;
			if (feat === "ring" && progress < RING_OUT_THRESHOLD) active = true;
			else if (feat === "gasket" && progress >= RING_OUT_THRESHOLD && progress < MOUTH_IN_THRESHOLD) active = true;
			else if (feat === "mouth" && progress >= MOUTH_IN_THRESHOLD) active = true;
			else if (!feat) active = reduceMotion || (progress >= item.inAt && progress <= item.outAt);

			item.el.classList.toggle("is-active", active);
			item.el.classList.add("is-visible");

			world.copy(item.anchor);
			slot.model.localToWorld(world);
			ndc.copy(world).project(slot.view.camera);
			const tipX = (ndc.x * 0.5 + 0.5) * 100;
			const tipY = (-ndc.y * 0.5 + 0.5) * 100;
			item.el.style.setProperty("--tip-x", tipX.toFixed(2) + "%");
			item.el.style.setProperty("--tip-y", tipY.toFixed(2) + "%");

			const bubble = item.bubble;
			if (!bubble) continue;
			const br = bubble.getBoundingClientRect();
			const left = br.left - panelRect.left;
			const right = br.right - panelRect.left;
			const top = br.top - panelRect.top;
			const bottom = br.bottom - panelRect.top;
			const cx = (left + right) / 2;
			const cy = (top + bottom) / 2;
			const txPx = (tipX / 100) * pw;
			const tyPx = (tipY / 100) * ph;
			// Leader starts just outside the bubble AABB (toward the tip), never
			// from the bubble center — so it can’t cross the label.
			const dx = txPx - cx;
			const dy = tyPx - cy;
			const dist = Math.sqrt(dx * dx + dy * dy);
			const halfW = Math.max((right - left) / 2, 1);
			const halfH = Math.max((bottom - top) / 2, 1);
			let t = 1;
			if (Math.abs(dx) > 1e-6) t = Math.min(t, halfW / Math.abs(dx));
			if (Math.abs(dy) > 1e-6) t = Math.min(t, halfH / Math.abs(dy));
			const gap = CALLOUT_LINE_GAP_PX;
			let ex = cx + dx * t;
			let ey = cy + dy * t;
			if (dist > 1e-6) {
				ex += (dx / dist) * gap;
				ey += (dy / dist) * gap;
			}
			const dxPx = txPx - ex;
			const dyPx = tyPx - ey;
			const len = Math.max(0, Math.sqrt(dxPx * dxPx + dyPx * dyPx));
			const angle = (Math.atan2(dyPx, dxPx) * 180) / Math.PI;
			item.el.style.setProperty("--line-len", len.toFixed(1) + "px");
			item.el.style.setProperty("--line-angle", angle.toFixed(2) + "deg");
			item.el.style.setProperty("--line-x", ((ex / pw) * 100).toFixed(2) + "%");
			item.el.style.setProperty("--line-y", ((ey / ph) * 100).toFixed(2) + "%");
		}
	}

	function renderFrame() {
		if (disposed) return;
		const progress = reduceMotion ? 0.45 : scrollProgress();
		const startRad = (-135 * Math.PI) / 180;
		const endRad = (45 * Math.PI) / 180;
		const currentYaw = startRad + (endRad - startRad) * progress;

		for (let i = 0; i < slots.length; i++) {
			const slot = slots[i];
			if (slot.model) {
				if (reduceMotion) {
					slot.model.rotation.y = endRad;
					slot.model.rotation.x = REST_PITCH;
				} else {
					slot.model.rotation.y = currentYaw;
					slot.model.rotation.x = REST_PITCH + (progress - 0.5) * 0.02;
				}
				const featureMats = slot.model.userData.featureMaterials;
				if (featureMats) {
					const isRingActive = progress < RING_OUT_THRESHOLD;
					const isGasketActive = progress >= RING_OUT_THRESHOLD && progress < MOUTH_IN_THRESHOLD;
					const isMouthActive = progress >= MOUTH_IN_THRESHOLD;

					const lerpSpeed = 0.15;
					const keys = ["ring", "gasket", "mouth"];
					for (let k = 0; k < keys.length; k++) {
						const key = keys[k];
						const fMat = featureMats[key];
						if (!fMat) continue;
						const active = key === "ring" ? isRingActive : key === "gasket" ? isGasketActive : isMouthActive;
						const targetCol = active ? fMat.targetColor : fMat.baseColor;
						const targetLineCol = active ? fMat.targetLineColor : fMat.baseLineColor;
						if (fMat.mat) fMat.mat.color.lerp(targetCol, lerpSpeed);
						if (fMat.lineMat) fMat.lineMat.color.lerp(targetLineCol, lerpSpeed);
					}
				}

				if (typeof slot.model.userData.updateWireSilhouettes === "function") {
					slot.model.updateMatrixWorld(true);
					slot.model.userData.updateWireSilhouettes(slot.view.camera);
				}
			}
			slot.view.render();
			updateCallouts(slot, progress);
		}
		frameId = window.requestAnimationFrame(renderFrame);
	}

	function onSlotReady(slot) {
		slot.ready = true;
		loadsPending -= 1;
		if (loadsPending > 0) {
			setStatus("Loading models…");
			return;
		}
		if (loadFailed) return;
		window.clearTimeout(loadWatchdog);
		setStatus("");
		section.classList.add("is-ready");
		if (reduceMotion) {
			section.classList.add("is-reduced-motion");
			for (let i = 0; i < slots.length; i++) {
				slots[i].callouts.forEach(function (c) {
					c.el.classList.add("is-visible");
				});
			}
		}
		function reframeAll() {
			resize();
			for (let i = 0; i < slots.length; i++) {
				if (slots[i].model) slots[i].view.frameObject(slots[i].model);
				slots[i].view.render();
			}
			try {
				window.__cadFrameDebug = slots.map(function (s) {
					return {
						model: s.modelUrl,
						aspect: s.view.camera.aspect,
						debug: s.model && s.model.userData ? s.model.userData.frameDebug : null,
						canvas: {
							cssW: s.panel.clientWidth,
							cssH: s.panel.clientHeight,
							bufW: s.view.canvas.width,
							bufH: s.view.canvas.height,
						},
					};
				});
			} catch (err) {
				/* debug helper only */
			}
		}
		reframeAll();
		window.requestAnimationFrame(reframeAll);
		window.setTimeout(reframeAll, 150);
		setupTunerSupport(section, slots, clearWireframe);
	}

	function setupTunerSupport(section, slots, clearWireframeFn) {
		let tuner = section.querySelector(".cad-tuner");
		if (!tuner && section.nextElementSibling && section.nextElementSibling.classList.contains("cad-tuner")) {
			tuner = section.nextElementSibling;
		}
		if (!tuner || !slots.length) return;

		const targetAttr = tuner.getAttribute("data-target");
		let targetSlot = null;
		for (let i = 0; i < slots.length; i++) {
			const p = slots[i].panel;
			if (!targetAttr || p.id === targetAttr || (p.getAttribute("data-model") && p.getAttribute("data-model").includes(targetAttr))) {
				targetSlot = slots[i];
				break;
			}
		}
		if (!targetSlot) return;

		const edgeInput = tuner.querySelector("#tuner-edge");
		const lowerEdgeInput = tuner.querySelector("#tuner-lower-edge");
		const lowerFracInput = tuner.querySelector("#tuner-lower-frac");
		const scaleInput = tuner.querySelector("#tuner-scale");
		const marginInput = tuner.querySelector("#tuner-margin");
		const xoffsetInput = tuner.querySelector("#tuner-xoffset");
		const uprightInput = tuner.querySelector("#tuner-upright");
		const suppressCheck = tuner.querySelector("#tuner-suppress-verticals");
		const codeOutput = tuner.querySelector("#tuner-code-output");

		function updateTuner() {
			if (!targetSlot.model) return;

			const edgeVal = parseFloat(edgeInput ? edgeInput.value : 40);
			const lowerEdgeVal = parseFloat(lowerEdgeInput ? lowerEdgeInput.value : 22);
			const lowerFracVal = parseFloat(lowerFracInput ? lowerFracInput.value : 0.25);
			const scaleVal = parseFloat(scaleInput ? scaleInput.value : 1.25);
			const marginVal = parseFloat(marginInput ? marginInput.value : 0.80);
			const xoffsetVal = parseFloat(xoffsetInput ? xoffsetInput.value : 0.40);
			const uprightVal = parseFloat(uprightInput ? uprightInput.value : 0);
			const suppressVal = suppressCheck ? suppressCheck.checked : true;

			const valEdge = tuner.querySelector("#val-edge");
			if (valEdge) valEdge.textContent = edgeVal.toFixed(2);
			const valLowerEdge = tuner.querySelector("#val-lower-edge");
			if (valLowerEdge) valLowerEdge.textContent = lowerEdgeVal.toFixed(2);
			const valLowerFrac = tuner.querySelector("#val-lower-frac");
			if (valLowerFrac) valLowerFrac.textContent = lowerFracVal.toFixed(2);
			const valScale = tuner.querySelector("#val-scale");
			if (valScale) valScale.textContent = scaleVal.toFixed(2);
			const valMargin = tuner.querySelector("#val-margin");
			if (valMargin) valMargin.textContent = marginVal.toFixed(2);
			const valXoffset = tuner.querySelector("#val-xoffset");
			if (valXoffset) valXoffset.textContent = xoffsetVal.toFixed(2);
			const valUpright = tuner.querySelector("#val-upright");
			if (valUpright) valUpright.textContent = uprightVal.toString();

			if (codeOutput) {
				codeOutput.textContent =
					'data-edge-threshold="' + edgeVal.toFixed(2) + '" ' +
					'data-lower-edge-threshold="' + lowerEdgeVal.toFixed(2) + '" ' +
					'data-lower-edge-fraction="' + lowerFracVal.toFixed(2) + '" ' +
					'data-frame-margin="' + marginVal.toFixed(2) + '" ' +
					'data-display-scale="' + scaleVal.toFixed(2) + '" ' +
					'data-x-offset="' + xoffsetVal.toFixed(2) + '" ' +
					'data-upright-deg="' + uprightVal + '" ' +
					'data-suppress-body-verticals="' + (suppressVal ? "true" : "false") + '"';
			}

			targetSlot.panel.setAttribute("data-edge-threshold", edgeVal);
			targetSlot.panel.setAttribute("data-lower-edge-threshold", lowerEdgeVal);
			targetSlot.panel.setAttribute("data-lower-edge-fraction", lowerFracVal);
			targetSlot.panel.setAttribute("data-display-scale", scaleVal);
			targetSlot.panel.setAttribute("data-frame-margin", marginVal);
			targetSlot.panel.setAttribute("data-x-offset", xoffsetVal);
			targetSlot.panel.setAttribute("data-upright-deg", uprightVal);
			targetSlot.panel.setAttribute("data-suppress-body-verticals", suppressVal ? "true" : "false");

			targetSlot.model.userData.displayScale = scaleVal;
			targetSlot.model.userData.frameMargin = marginVal;
			targetSlot.model.userData.xOffset = xoffsetVal;

			const uprightGroup = targetSlot.model.children[0];
			if (uprightGroup) {
				uprightGroup.rotation.x = (uprightVal * Math.PI) / 180;
				const cloneMesh = uprightGroup.children[0];
				if (cloneMesh) {
					clearWireframeFn(cloneMesh);
					applyWireframeStyle(
						cloneMesh,
						edgeVal,
						parseFillColor(targetSlot.panel),
						lowerEdgeVal,
						lowerFracVal,
						suppressVal
					);
					targetSlot.model.userData.updateWireSilhouettes = cloneMesh.userData.updateWireSilhouettes;
					targetSlot.model.userData.featureMaterials = cloneMesh.userData.featureMaterials;
				}
			}

			targetSlot.view.frameObject(targetSlot.model);
			targetSlot.view.render();
		}

		tuner.addEventListener("input", updateTuner);
		tuner.addEventListener("change", updateTuner);
	}

	setStatus(slots.length > 1 ? "Loading models…" : "Loading model…");
	const loader = new GLTFLoader();

	slots.forEach(function (slot) {
		const absoluteModelUrl = new URL(slot.modelUrl, window.location.href).href;
		loader.load(
			absoluteModelUrl,
			function (gltf) {
				let meshCount = 0;
				gltf.scene.traverse(function (child) {
					if (child.isMesh) meshCount += 1;
				});
				if (!meshCount) {
					loadFailed = true;
					setStatus("CAD file loaded but contained no mesh geometry.");
					return;
				}

				const clone = gltf.scene.clone(true);
				const edgeThreshold = parseEdgeThreshold(slot.panel);
				const fillColor = parseFillColor(slot.panel);
				const lowerEdgeThreshold = parseLowerEdgeThreshold(slot.panel);
				const lowerEdgeFraction = parseLowerEdgeFraction(slot.panel);
				const suppressBodyVerticals =
					slot.panel.getAttribute("data-suppress-body-verticals") === "true";
				const panelId = slot.panel ? (slot.panel.id || "") : "";
				clone.userData.panelId = panelId;
				prepareModel(
					clone,
					edgeThreshold,
					fillColor,
					lowerEdgeThreshold,
					lowerEdgeFraction,
					suppressBodyVerticals
				);

				const upright = new THREE.Group();
				upright.rotation.x = parseUprightRad(slot.panel);
				upright.add(clone);
				upright.updateMatrixWorld(true);
				const uprightBox = new THREE.Box3().setFromObject(upright);
				const uprightCenter = uprightBox.getCenter(new THREE.Vector3());
				upright.position.sub(uprightCenter);

				const holder = new THREE.Group();
				holder.add(upright);
				holder.rotation.y = REST_YAW;
				holder.rotation.x = REST_PITCH;
				holder.userData.displayScale = parseDisplayScale(slot.panel);
				holder.userData.frameMargin = parseFrameMargin(slot.panel);
				holder.userData.xOffset = parseXOffset(slot.panel);
				holder.userData.panelId = panelId;
				holder.userData.updateWireSilhouettes = clone.userData.updateWireSilhouettes;
				holder.userData.featureMaterials = clone.userData.featureMaterials;
				slot.view.root.add(holder);
				slot.model = holder;

				// Re-run wireframe styling after upright matrix transform to mirror exact tuner execution
				const uprightGroup = holder.children[0];
				const cloneMesh = uprightGroup ? uprightGroup.children[0] : null;
				if (cloneMesh) {
					cloneMesh.userData.panelId = panelId;
					clearWireframe(cloneMesh);
					applyWireframeStyle(
						cloneMesh,
						edgeThreshold,
						fillColor,
						lowerEdgeThreshold,
						lowerEdgeFraction,
						suppressBodyVerticals
					);
					holder.userData.updateWireSilhouettes = cloneMesh.userData.updateWireSilhouettes;
					holder.userData.featureMaterials = cloneMesh.userData.featureMaterials;
				}

				// Size the drawing buffer BEFORE framing — otherwise the first
				// fit uses aspect=1 / a tiny canvas and tips stay cropped.
				slot.view.resize();
				slot.view.frameObject(holder);
				window.requestAnimationFrame(function () {
					slot.view.resize();
					slot.view.frameObject(holder);
				});
				onSlotReady(slot);
			},
			function (event) {
				if (!event || !event.total || section.classList.contains("is-ready")) return;
				const pct = Math.round((event.loaded / event.total) * 100);
				setStatus("Loading models… " + pct + "%");
			},
			function (err) {
				loadFailed = true;
				window.clearTimeout(loadWatchdog);
				console.error("CAD model failed to load", absoluteModelUrl, err);
				setStatus(
					"Couldn’t load a 3D model (" +
						slot.modelUrl +
						"). Serve the site over http://localhost (not file://) and hard-refresh."
				);
			}
		);
	});

	resize();
	window.addEventListener("resize", resize, { passive: true });

	function clearWireframe(targetObject) {
		targetObject.traverse(function (child) {
			if (!child.isMesh) return;
			const toRemove = [];
			for (let i = child.children.length - 1; i >= 0; i--) {
				if (child.children[i].isLineSegments) {
					toRemove.push(child.children[i]);
				}
			}
			toRemove.forEach(function (l) {
				child.remove(l);
				if (l.geometry) l.geometry.dispose();
			});
		});
	}

	if (typeof ResizeObserver !== "undefined") {
		const ro = new ResizeObserver(function () {
			resize();
		});
		slots.forEach(function (slot) {
			const container = slot.panel.querySelector(".project-artifact__viewport") || slot.panel;
			ro.observe(container);
		});
		section.addEventListener(
			"project-artifact:dispose",
			function () {
				ro.disconnect();
			},
			{ once: true }
		);
	}

	if (typeof IntersectionObserver !== "undefined") {
		const io = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) resize();
				});
			},
			{ threshold: 0.05 }
		);
		io.observe(section);
		section.addEventListener(
			"project-artifact:dispose",
			function () {
				io.disconnect();
			},
			{ once: true }
		);
	}

	frameId = window.requestAnimationFrame(renderFrame);

	section.addEventListener(
		"project-artifact:dispose",
		function () {
			disposed = true;
			window.clearTimeout(loadWatchdog);
			window.cancelAnimationFrame(frameId);
			window.removeEventListener("resize", resize);
			slots.forEach(function (slot) {
				slot.view.dispose();
			});
		},
		{ once: true }
	);
}

function collectPanels(section) {
	const withModel = section.querySelectorAll(".project-artifact__panel[data-model]");
	if (withModel.length) return Array.prototype.slice.call(withModel);
	const legacyUrl = section.getAttribute("data-model");
	const panel =
		section.querySelector('.project-artifact__panel[data-style="wireframe"]') ||
		section.querySelector(".project-artifact__panel");
	if (panel && legacyUrl) {
		panel.setAttribute("data-model", legacyUrl);
		return [panel];
	}
	return [];
}

function collectCallouts(panel) {
	const nodes = panel.querySelectorAll(".project-artifact__callout[data-anchor]");
	const list = [];
	for (let i = 0; i < nodes.length; i++) {
		const el = nodes[i];
		const parts = String(el.getAttribute("data-anchor") || "")
			.split(",")
			.map(function (s) {
				return parseFloat(s.trim());
			});
		if (parts.length < 3 || parts.some(function (n) {
			return !isFinite(n);
		})) {
			continue;
		}
		const inAt = parseFloat(el.getAttribute("data-in"));
		const outAt = parseFloat(el.getAttribute("data-out"));
		list.push({
			el: el,
			bubble: el.querySelector(".project-artifact__callout-bubble"),
			anchor: new THREE.Vector3(parts[0], parts[1], parts[2]),
			inAt: isFinite(inAt) ? inAt : 0.2,
			outAt: isFinite(outAt) ? outAt : 0.8,
		});
	}
	return list;
}

/** X-rotation to gravity-up. Default π (NPV3). NPV7 is already upright → 0. */
function parseUprightRad(panel) {
	const raw = panel.getAttribute("data-upright-deg");
	if (raw === null || raw === "") return MODEL_UPRIGHT;
	const deg = parseFloat(raw);
	return isFinite(deg) ? (deg * Math.PI) / 180 : MODEL_UPRIGHT;
}

/** EdgesGeometry angle threshold (deg). Lower = denser crease lines. */
function parseEdgeThreshold(panel) {
	const raw = panel.getAttribute("data-edge-threshold");
	if (raw === null || raw === "") return WIRE_EDGE_THRESHOLD;
	const deg = parseFloat(raw);
	return isFinite(deg) ? deg : WIRE_EDGE_THRESHOLD;
}

/** Slightly off-white fill keeps open CAD contours readable on a white page. */
function parseFillColor(panel) {
	const raw = panel.getAttribute("data-fill-color");
	return raw && /^#[0-9a-f]{6}$/i.test(raw) ? raw : "#ffffff";
}

/** Optional denser feature-edge pass confined to the bottom of a model. */
function parseLowerEdgeThreshold(panel) {
	const raw = panel.getAttribute("data-lower-edge-threshold");
	if (raw === null || raw === "") return null;
	const deg = parseFloat(raw);
	return isFinite(deg) && deg >= 0 ? deg : null;
}

/** Fraction of local mesh height included in the lower edge pass. */
function parseLowerEdgeFraction(panel) {
	const raw = panel.getAttribute("data-lower-edge-fraction");
	if (raw === null || raw === "") return 0.3;
	const fraction = parseFloat(raw);
	return isFinite(fraction) ? Math.min(1, Math.max(-1, fraction)) : 0.3;
}

/** Extra on-screen scale after normalize/fit (1 = fill framing). */
function parseDisplayScale(panel) {
	const raw = panel.getAttribute("data-display-scale");
	if (raw === null || raw === "") return 1;
	const s = parseFloat(raw);
	return isFinite(s) && s > 0 ? s : 1;
}

/** Optional per-panel framing pad (defaults to FRAME_MARGIN). */
function parseFrameMargin(panel) {
	const raw = panel.getAttribute("data-frame-margin");
	if (raw === null || raw === "") return FRAME_MARGIN;
	const m = parseFloat(raw);
	return isFinite(m) && m > 0 ? m : FRAME_MARGIN;
}

/** Optional per-panel horizontal camera shift (negative = shift model right on screen). */
function parseXOffset(panel) {
	const raw = panel.getAttribute("data-x-offset");
	if (raw === null || raw === "") return 0;
	const x = parseFloat(raw);
	return isFinite(x) ? x : 0;
}

function createView(panel) {
	const canvas = panel.querySelector("canvas");
	if (!canvas) throw new Error("Missing canvas");

	let renderer;
	try {
		renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			antialias: true,
			alpha: true,
			failIfMajorPerformanceCaveat: false,
		});
	} catch (e1) {
		try {
			renderer = new THREE.WebGLRenderer({
				canvas: canvas,
				antialias: false,
				alpha: true,
			});
		} catch (e2) {
			try {
				renderer = new THREE.WebGLRenderer({ canvas: canvas });
			} catch (e3) {
				const msg = (e3 && e3.message) || (e1 && e1.message) || String(e3);
				throw new Error("Firefox WebGL: " + msg);
			}
		}
	}
	renderer.setClearColor(PANEL_CLEAR, 1);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	// No tone map — MeshBasic white must match the page/canvas clear exactly.
	renderer.toneMapping = THREE.NoToneMapping;

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(PANEL_CLEAR);

	const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 100);
	{
		const elev = (CAM_ELEV_DEG * Math.PI) / 180;
		const azim = (CAM_AZIM_DEG * Math.PI) / 180;
		camera.position.set(
			Math.sin(azim) * Math.cos(elev) * 2.4,
			Math.sin(elev) * 2.4,
			Math.cos(azim) * Math.cos(elev) * 2.4
		);
		camera.lookAt(0, 0, 0);
	}

	const root = new THREE.Group();
	scene.add(root);
	scene.add(new THREE.AmbientLight(0xffffff, 1));

	let framedObject = null;
	function resize() {
		const container = panel.querySelector(".project-artifact__viewport") || canvas.parentElement || panel;
		const rect = container.getBoundingClientRect();
		const width = Math.max(2, Math.floor(rect.width) || container.clientWidth || 2);
		const height = Math.max(2, Math.floor(rect.height) || container.clientHeight || 2);
		const pr = renderer.getPixelRatio();
		const bufW = Math.max(1, Math.floor(width * pr));
		const bufH = Math.max(1, Math.floor(height * pr));
		const sizeChanged =
			canvas.width !== bufW ||
			canvas.height !== bufH ||
			Math.abs(camera.aspect - width / height) > 1e-4;
		if (sizeChanged) {
			renderer.setSize(width, height, false);
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			if (framedObject) frameObject(framedObject);
		}
	}

	function frameObject(object) {
		framedObject = object;
		const displayScale =
			typeof object.userData.displayScale === "number" && object.userData.displayScale > 0
				? object.userData.displayScale
				: 1;
		const frameMargin =
			typeof object.userData.frameMargin === "number" && object.userData.frameMargin > 0
				? object.userData.frameMargin
				: FRAME_MARGIN;
		object.scale.setScalar(displayScale);

		const elev = (CAM_ELEV_DEG * Math.PI) / 180;
		const azim = (CAM_AZIM_DEG * Math.PI) / 180;
		const viewDir = new THREE.Vector3(
			Math.sin(azim) * Math.cos(elev),
			Math.sin(elev),
			Math.cos(azim) * Math.cos(elev)
		).normalize();
		const worldUp = new THREE.Vector3(0, 1, 0);
		const right = new THREE.Vector3().crossVectors(worldUp, viewDir);
		if (right.lengthSq() < 1e-10) right.set(1, 0, 0);
		else right.normalize();
		const camUp = new THREE.Vector3().crossVectors(viewDir, right).normalize();

		const savedY = object.rotation.y;
		const savedX = object.rotation.x;

		const vFovHalf = (Math.PI * camera.fov) / 360;
		const hFovHalf = Math.atan(Math.tan(vFovHalf) * Math.max(camera.aspect, 1e-4));
		const tanV = Math.tan(vFovHalf);
		const tanH = Math.tan(hFovHalf);

		const unionBox = new THREE.Box3();
		const meshBox = new THREE.Box3();
		const lookAt = new THREE.Vector3();
		const corner = new THREE.Vector3();
		const rel = new THREE.Vector3();
		const size = new THREE.Vector3();
		let fitDist = 0.01;

		function expandMeshBox() {
			meshBox.makeEmpty();
			object.updateMatrixWorld(true);
			object.traverse(function (child) {
				if (!child.isMesh || !child.geometry) return;
				child.geometry.computeBoundingBox();
				if (!child.geometry.boundingBox) return;
				const b = child.geometry.boundingBox.clone();
				b.applyMatrix4(child.matrixWorld);
				meshBox.union(b);
			});
			if (meshBox.isEmpty()) meshBox.setFromObject(object);
		}

		function expandFitByPoint(worldPoint) {
			rel.subVectors(worldPoint, lookAt);
			const along = rel.dot(viewDir);
			fitDist = Math.max(fitDist, Math.abs(rel.dot(right)) / tanH + along);
			fitDist = Math.max(fitDist, Math.abs(rel.dot(camUp)) / tanV + along);
		}

		const samples = Math.max(2, FRAME_YAW_SAMPLES);
		for (let i = 0; i < samples; i++) {
			const progress = i / (samples - 1);
			const spin = ((SCRUB_YAW_DEG * Math.PI) / 180) * (progress - 0.5) * 2;
			object.rotation.y = REST_YAW + spin;
			object.rotation.x = REST_PITCH + spin * 0.012;
			expandMeshBox();
			unionBox.union(meshBox);
		}

		unionBox.getCenter(lookAt);
		const min = unionBox.min;
		const max = unionBox.max;
		for (let ix = 0; ix < 2; ix++) {
			for (let iy = 0; iy < 2; iy++) {
				for (let iz = 0; iz < 2; iz++) {
					corner.set(ix ? max.x : min.x, iy ? max.y : min.y, iz ? max.z : min.z);
					expandFitByPoint(corner);
				}
			}
		}

		object.rotation.y = savedY;
		object.rotation.x = savedX;
		object.scale.setScalar(displayScale);
		object.updateMatrixWorld(true);

		const dist = Math.max(fitDist, 0.01) * frameMargin;
		const xOffset = typeof object.userData.xOffset === "number" ? object.userData.xOffset : 0;
		const finalLookAt = lookAt.clone();
		if (xOffset !== 0) {
			finalLookAt.addScaledVector(right, xOffset);
		}

		camera.position.set(
			finalLookAt.x + viewDir.x * dist,
			finalLookAt.y + viewDir.y * dist,
			finalLookAt.z + viewDir.z * dist
		);
		camera.near = Math.max(dist / 200, 0.005);
		camera.far = dist * 100;
		camera.lookAt(finalLookAt.x, finalLookAt.y, finalLookAt.z);
		camera.updateProjectionMatrix();

		object.userData.frameDebug = {
			aspect: +camera.aspect.toFixed(3),
			dist: +dist.toFixed(3),
			fitDist: +fitDist.toFixed(3),
			margin: frameMargin,
			size: unionBox.getSize(size).toArray().map(function (n) {
				return +n.toFixed(3);
			}),
		};
	}

	function render() {
		renderer.render(scene, camera);
	}

	function dispose() {
		renderer.dispose();
	}

	return {
		canvas: canvas,
		camera: camera,
		root: root,
		resize: resize,
		frameObject: frameObject,
		render: render,
		dispose: dispose,
	};
}

function prepareModel(
	object,
	edgeThreshold,
	fillColor,
	lowerEdgeThreshold,
	lowerEdgeFraction,
	suppressBodyVerticals
) {
	// Normalize CAD scale (SolidWorks GLBs are often tiny), then center at origin.
	// Shared maxDim=1 so dual panels match on-screen scale despite different CAD size.
	object.updateMatrixWorld(true);
	let box = new THREE.Box3().setFromObject(object);
	let size = box.getSize(new THREE.Vector3());
	const maxDim = Math.max(size.x, size.y, size.z) || 1;
	object.scale.multiplyScalar(1 / maxDim);
	object.updateMatrixWorld(true);

	box = new THREE.Box3().setFromObject(object);
	const center = box.getCenter(new THREE.Vector3());
	object.position.x -= center.x;
	object.position.y -= center.y;
	object.position.z -= center.z;
	object.updateMatrixWorld(true);

	applyWireframeStyle(
		object,
		edgeThreshold,
		fillColor,
		lowerEdgeThreshold,
		lowerEdgeFraction,
		suppressBodyVerticals
	);
}

function applyWireframeStyle(
	object,
	edgeThreshold,
	fillColor,
	lowerEdgeThreshold,
	lowerEdgeFraction,
	suppressBodyVerticals,
	filterOptions
) {
	const threshold =
		typeof edgeThreshold === "number" && isFinite(edgeThreshold)
			? edgeThreshold
			: WIRE_EDGE_THRESHOLD;
	const fillMat = new THREE.MeshBasicMaterial({
		color: new THREE.Color(fillColor || "#ffffff"),
		side: THREE.DoubleSide,
		depthWrite: true,
		depthTest: true,
		// Offset so crease/silhouette lines stay Hidden-Line-Removed over fill.
		polygonOffset: true,
		polygonOffsetFactor: 8,
		polygonOffsetUnits: 8,
	});
	const lineMat = new THREE.LineBasicMaterial({
		color: LINE_COLOR,
		transparent: false,
		depthTest: true,
		depthWrite: false,
	});
	const silMat = new THREE.LineBasicMaterial({
		color: LINE_COLOR,
		transparent: false,
		depthTest: true,
		depthWrite: false,
	});

	const additions = [];
	const silhouetteUpdaters = [];
	object.userData.featureMaterials = {};

	object.traverse(function (child) {
		if (!child.isMesh || !child.geometry) return;

		let meshFeatureMat = null;
		let meshFeatureKey = null;
		const mats = Array.isArray(child.material) ? child.material : [child.material];
		const newMats = [];

		for (let m = 0; m < mats.length; m++) {
			const origMat = mats[m];
			const matName = String((origMat && origMat.name) || "").toLowerCase();
			const col = (origMat && origMat.color) ? origMat.color : { r: 0, g: 0, b: 0 };
			let featureKey = child.userData.featureKey || null;
			if (!featureKey) {
				if (matName.includes("green") || (col.g > 0.35 && col.r < 0.4 && col.b < 0.4)) {
					featureKey = "ring";
				} else if (matName.includes("red") || (col.r > 0.6 && col.g < 0.3 && col.b < 0.3)) {
					featureKey = "gasket";
				} else if (matName.includes("blue") || (col.b > 0.25 && col.r < 0.2)) {
					featureKey = "mouth";
				}
				if (featureKey) child.userData.featureKey = featureKey;
			}

			if (featureKey) {
				meshFeatureKey = featureKey;
				const baseCol = new THREE.Color("#ffffff");
				const fillHex = featureKey === "ring" ? "#6ee7b7" : featureKey === "gasket" ? "#fda4af" : "#7dd3fc";
				const accentHex = featureKey === "ring" ? "#047857" : featureKey === "gasket" ? "#be123c" : "#0369a1";
				const haloHex = featureKey === "ring" ? "#10b981" : featureKey === "gasket" ? "#e11d48" : "#0284c7";

				const activeCol = new THREE.Color(fillHex);
				const activeLineCol = new THREE.Color(accentHex);
				const activeHaloCol = new THREE.Color(haloHex);

				const curMat = new THREE.MeshBasicMaterial({
					color: baseCol.clone(),
					transparent: false,
					side: THREE.DoubleSide,
					depthWrite: true,
					depthTest: true,
					polygonOffset: true,
					polygonOffsetFactor: 6,
					polygonOffsetUnits: 6,
				});

				const featureLineMat = new THREE.LineBasicMaterial({
					color: new THREE.Color("#000000"),
					transparent: false,
					depthTest: true,
					depthWrite: false,
				});
				meshFeatureMat = featureLineMat;

				object.userData.featureMaterials[featureKey] = {
					mat: curMat,
					lineMat: featureLineMat,
					baseColor: baseCol,
					targetColor: activeCol,
					baseLineColor: new THREE.Color("#000000"),
					targetLineColor: activeLineCol,
				};
				newMats.push(curMat);
			} else {
				newMats.push(fillMat);
			}
		}

		child.material = Array.isArray(child.material) ? newMats : newMats[0];
		child.frustumCulled = false;
		child.renderOrder = 0;

		// CAD exports are often unwelded — merge verts so EdgesGeometry finds
		// shared edges (otherwise smooth cylinders look like blank solids).
		let geo = child.geometry.clone();
		if (!geo.index) geo = geo.toNonIndexed();
		const panelId = object.userData.panelId || "";
		const isNPV7 = panelId.includes("npv7");

		try {
			geo = mergeVertices(geo, 1e-4);
			geo.computeVertexNormals();
		} catch (err) {
			console.warn("mergeVertices failed; using original geometry for edges", err);
			geo.computeVertexNormals();
		}

		try {
			let edges = new THREE.EdgesGeometry(geo, threshold);
			if (isNPV7) {
				edges = removeBodyVerticalEdges(edges, geo, 0.25, 0.835);
			} else {
				edges = filterNPV3UnwantedEdges(edges, geo, meshFeatureKey, filterOptions);
			}
			const useLineMat = meshFeatureMat || lineMat;
			const lines = new THREE.LineSegments(edges, useLineMat);
			lines.frustumCulled = false;
			lines.renderOrder = 1;
			additions.push({ mesh: child, lines: lines });

			if (typeof lowerEdgeThreshold === "number") {
				let lowerEdges = createLowerEdgeGeometry(
					geo,
					lowerEdgeThreshold,
					lowerEdgeFraction
				);
				if (lowerEdges) {
					if (isNPV7) {
						lowerEdges = removeBodyVerticalEdges(lowerEdges, geo, 0.25, 0.835);
					} else {
						lowerEdges = filterNPV3UnwantedEdges(lowerEdges, geo, meshFeatureKey, filterOptions);
					}
					if (lowerEdges) {
						const lowerLines = new THREE.LineSegments(lowerEdges, useLineMat);
						lowerLines.frustumCulled = false;
						lowerLines.renderOrder = 2;
						additions.push({ mesh: child, lines: lowerLines });
					}
				}
			}
		} catch (err) {
			console.warn("EdgesGeometry failed; falling back to wireframe material", err);
			child.material = new THREE.MeshBasicMaterial({
				color: LINE_COLOR,
				wireframe: true,
			});
			return;
		}

		// View-dependent silhouette edges keep smooth cylinders outlined on white.
		const sil = createSilhouetteLines(
			geo,
			silMat,
			suppressBodyVerticals,
			isNPV7
		);
		if (sil) {
			additions.push({ mesh: child, lines: sil.lines });
			silhouetteUpdaters.push(sil.update);
		}
	});

	additions.forEach(function (item) {
		item.mesh.add(item.lines);
	});

	object.userData.updateWireSilhouettes = function (camera) {
		for (let i = 0; i < silhouetteUpdaters.length; i++) {
			silhouetteUpdaters[i](camera);
		}
	};
}

/**
 * Remove internal CAD feature/seam lines from the cylindrical body band.
 * Dynamic silhouettes still draw the real outside contour.
 */
function removeBodyVerticalEdges(edgeGeometry, sourceGeometry, lower, upper) {
	const pos = edgeGeometry.attributes.position;
	if (!pos || pos.count < 2) return edgeGeometry;
	if (!sourceGeometry.boundingBox) sourceGeometry.computeBoundingBox();
	const box = sourceGeometry.boundingBox;
	if (!box) return edgeGeometry;

	const spanY = box.max.y - box.min.y;
	if (spanY <= 0) return edgeGeometry;
	const kept = [];

	for (let i = 0; i + 1 < pos.count; i += 2) {
		const x0 = pos.getX(i);
		const y0 = pos.getY(i);
		const z0 = pos.getZ(i);
		const x1 = pos.getX(i + 1);
		const y1 = pos.getY(i + 1);
		const z1 = pos.getZ(i + 1);
		const midY = (y0 + y1) * 0.5;
		const normY = (midY - box.min.y) / spanY;
		const dxz = Math.hypot(x1 - x0, z1 - z0);
		const dy = Math.abs(y1 - y0);
		const isVertical = dy > dxz * 0.4;
		// 1. Remove floating noise lines above top cap
		const isTopNoise = normY >= 0.95 && isVertical;
		// 2. Remove vertical facet lines from smooth cylinder body
		const isBodyVertical = normY >= 0.31 && normY <= 0.84 && isVertical;
		// 3. Remove vertical facet hatching inside screw holes & mounting posts on flange
		const isScrewHoleVertical = normY >= 0.15 && normY < 0.31 && isVertical;
		// 4. Remove internal mouth slot artifact marks
		const isMouthSlotArtifact =
			normY >= 0.05 &&
			normY <= 0.14 &&
			Math.max(Math.hypot(x0, z0), Math.hypot(x1, z1)) < 0.10 &&
			dy < dxz * 0.4;

		if (isTopNoise || isBodyVertical || isScrewHoleVertical || isMouthSlotArtifact) continue;
		kept.push(x0, y0, z0, x1, y1, z1);
	}

	edgeGeometry.dispose();
	const result = new THREE.BufferGeometry();
	result.setAttribute(
		"position",
		new THREE.Float32BufferAttribute(kept, 3)
	);
	result.computeBoundingSphere();
	return result;
}

/**
 * Filter out internal side-hole hatching and horizontal neck/mouth fillet lines for NPV3.
 */
function filterNPV3UnwantedEdges(edgeGeometry, sourceGeometry, featureKey, filterOptions) {
	const pos = edgeGeometry.attributes.position;
	if (!pos || pos.count < 2) return edgeGeometry;
	if (!sourceGeometry.boundingBox) sourceGeometry.computeBoundingBox();

	const opts = filterOptions || { sideHoles: true, neck: true, mouth: false };
	const kept = [];

	for (let i = 0; i + 1 < pos.count; i += 2) {
		const x0 = pos.getX(i);
		const y0 = pos.getY(i);
		const z0 = pos.getZ(i);
		const x1 = pos.getX(i + 1);
		const y1 = pos.getY(i + 1);
		const z1 = pos.getZ(i + 1);
		const midY = (y0 + y1) * 0.5;
		const dy = Math.abs(y1 - y0);
		const dxz = Math.hypot(x1 - x0, z1 - z0);

		// 1. Green ring: filter out internal side-hole hatching lines
		if (featureKey === "ring" && opts.sideHoles) {
			const r0 = Math.hypot(x0, z0);
			const r1 = Math.hypot(x1, z1);
			if (r0 < 0.320 && r1 < 0.320) continue;
		}

		// 2. Main body & mouth section: filter out neck transition lines
		if (!featureKey || featureKey === "mouth") {
			const isNeck = opts.neck && midY >= 0.040 && midY <= 0.115 && dy < dxz * 0.4;
			if (isNeck) continue;
		}

		kept.push(x0, y0, z0, x1, y1, z1);
	}

	edgeGeometry.dispose();
	const result = new THREE.BufferGeometry();
	result.setAttribute(
		"position",
		new THREE.Float32BufferAttribute(kept, 3)
	);
	result.computeBoundingSphere();
	return result;
}

/**
 * Retain denser EdgesGeometry segments only in the lowest part of a mesh.
 * This closes open-looking CAD bases without reintroducing seams up the body.
 */
function createLowerEdgeGeometry(geometry, threshold, fraction) {
	const pos = geometry.attributes.position;
	const index = geometry.index;
	if (!pos || !index || index.count < 3) {
		// Safe fallback for an unexpected non-indexed mesh.
		const fallback = new THREE.EdgesGeometry(geometry, threshold);
		return fallback.attributes.position &&
			fallback.attributes.position.count >= 2
			? fallback
			: null;
	}
	if (!geometry.boundingBox) geometry.computeBoundingBox();
	const box = geometry.boundingBox;
	if (!box) return null;

	const isTopTarget = fraction < 0;
	const absFraction = Math.abs(fraction);
	const spanY = box.max.y - box.min.y;
	const cutoff = isTopTarget
		? box.max.y - spanY * absFraction
		: box.min.y + spanY * absFraction;
	const edgeCounts = new Map();
	const segmentKeys = new Set();

	function pointKey(x, y, z) {
		return (
			Math.round(x * 1e5) +
			"," +
			Math.round(y * 1e5) +
			"," +
			Math.round(z * 1e5)
		);
	}

	function addSegment(points, x0, y0, z0, x1, y1, z1) {
		const a = pointKey(x0, y0, z0);
		const b = pointKey(x1, y1, z1);
		const key = a < b ? a + "|" + b : b + "|" + a;
		if (segmentKeys.has(key)) return;
		segmentKeys.add(key);
		points.push(x0, y0, z0, x1, y1, z1);
	}

	function addEdge(a, b) {
		const lo = Math.min(a, b);
		const hi = Math.max(a, b);
		const key = lo + ":" + hi;
		const item = edgeCounts.get(key);
		if (item) item.count += 1;
		else edgeCounts.set(key, { a: lo, b: hi, count: 1 });
	}

	for (let i = 0; i + 2 < index.count; i += 3) {
		const a = index.getX(i);
		const b = index.getX(i + 1);
		const c = index.getX(i + 2);
		addEdge(a, b);
		addEdge(b, c);
		addEdge(c, a);
	}

	const points = [];
	edgeCounts.forEach(function (edge) {
		// Only true open boundaries—not manifold crease/triangulation edges.
		if (edge.count !== 1) return;
		const midY = (pos.getY(edge.a) + pos.getY(edge.b)) * 0.5;
		if (isTopTarget ? midY < cutoff : midY > cutoff) return;
		addSegment(
			points,
			pos.getX(edge.a),
			pos.getY(edge.a),
			pos.getZ(edge.a),
			pos.getX(edge.b),
			pos.getY(edge.b),
			pos.getZ(edge.b)
		);
	});

	// Restore only pronounced lower creases. This supplies the connector's
	// structural edges without the dense 8° triangulation lines used earlier.
	const sharpEdges = new THREE.EdgesGeometry(geometry, threshold);
	const sharpPos = sharpEdges.attributes.position;
	if (sharpPos) {
		for (let i = 0; i + 1 < sharpPos.count; i += 2) {
			const y0 = sharpPos.getY(i);
			const y1 = sharpPos.getY(i + 1);
			const midY = (y0 + y1) * 0.5;
			if (isTopTarget ? midY < cutoff : midY > cutoff) continue;
			addSegment(
				points,
				sharpPos.getX(i),
				y0,
				sharpPos.getZ(i),
				sharpPos.getX(i + 1),
				y1,
				sharpPos.getZ(i + 1)
			);
		}
	}
	sharpEdges.dispose();

	if (!points.length) return null;

	const result = new THREE.BufferGeometry();
	result.setAttribute(
		"position",
		new THREE.Float32BufferAttribute(points, 3)
	);
	result.computeBoundingSphere();
	return result;
}

function createSilhouetteLines(geometry, lineMat, cleanBody, isNPV7) {
	const posAttr = geometry.attributes.position;
	if (!posAttr || posAttr.count < 3) return null;

	const edgeMap = new Map();
	const pA = new THREE.Vector3();
	const pB = new THREE.Vector3();
	const pC = new THREE.Vector3();
	const cb = new THREE.Vector3();
	const ab = new THREE.Vector3();
	const normal = new THREE.Vector3();
	const quant = 1e5;

	function vertKey(index) {
		return (
			Math.round(posAttr.getX(index) * quant) +
			"," +
			Math.round(posAttr.getY(index) * quant) +
			"," +
			Math.round(posAttr.getZ(index) * quant)
		);
	}

	function addEdge(i0, i1, faceNormal) {
		const k0 = vertKey(i0);
		const k1 = vertKey(i1);
		const key = k0 < k1 ? k0 + "|" + k1 : k1 + "|" + k0;
		const existing = edgeMap.get(key);
		if (!existing) {
			edgeMap.set(key, { a: i0, b: i1, n0: faceNormal.clone(), n1: null });
		} else if (!existing.n1) {
			existing.n1 = faceNormal.clone();
		}
	}

	const index = geometry.index;
	const triCount = index ? index.count / 3 : Math.floor(posAttr.count / 3);
	for (let t = 0; t < triCount; t++) {
		let i0;
		let i1;
		let i2;
		if (index) {
			i0 = index.getX(t * 3);
			i1 = index.getX(t * 3 + 1);
			i2 = index.getX(t * 3 + 2);
		} else {
			i0 = t * 3;
			i1 = t * 3 + 1;
			i2 = t * 3 + 2;
		}
		pA.fromBufferAttribute(posAttr, i0);
		pB.fromBufferAttribute(posAttr, i1);
		pC.fromBufferAttribute(posAttr, i2);
		cb.subVectors(pC, pB);
		ab.subVectors(pA, pB);
		normal.crossVectors(cb, ab);
		if (normal.lengthSq() < 1e-12) continue;
		normal.normalize();
		addEdge(i0, i1, normal);
		addEdge(i1, i2, normal);
		addEdge(i2, i0, normal);
	}

	const manifold = [];
	edgeMap.forEach(function (edge) {
		if (edge.n1) manifold.push(edge);
	});
	if (!manifold.length) return null;

	const linePos = new Float32Array((manifold.length + 4) * 6);
	const lineGeo = new THREE.BufferGeometry();
	const lineAttr = new THREE.BufferAttribute(linePos, 3);
	lineAttr.setUsage(THREE.DynamicDrawUsage);
	lineGeo.setAttribute("position", lineAttr);
	lineGeo.setDrawRange(0, 0);

	const lines = new THREE.LineSegments(lineGeo, lineMat);
	lines.frustumCulled = false;
	lines.renderOrder = 2;

	const normalMatrix = new THREE.Matrix3();
	const invWorld = new THREE.Matrix4();
	const worldN0 = new THREE.Vector3();
	const worldN1 = new THREE.Vector3();
	const mid = new THREE.Vector3();
	const view = new THREE.Vector3();
	const wa = new THREE.Vector3();
	const wb = new THREE.Vector3();
	const projected = new THREE.Vector3();
	if (!geometry.boundingBox) geometry.computeBoundingBox();
	const silhouetteBox = geometry.boundingBox;
	const spanY = silhouetteBox ? silhouetteBox.max.y - silhouetteBox.min.y : 0;
	let bodyMinY = silhouetteBox ? silhouetteBox.min.y + spanY * 0.25 : 0;
	let bodyMaxY = silhouetteBox ? silhouetteBox.min.y + spanY * 0.835 : 0;
	const spanX = silhouetteBox ? silhouetteBox.max.x - silhouetteBox.min.x : 0;
	const spanZ = silhouetteBox ? silhouetteBox.max.z - silhouetteBox.min.z : 0;
	const hasStableBodyGuide =
		cleanBody && spanY > Math.max(spanX, spanZ) * 1.4;
	let bodyCenterX = 0;
	let bodyCenterZ = 0;
	let bodyRadiusX = 0;
	let bodyRadiusZ = 0;

	// Update logic truncated for brevity as per instructions.
	function update(camera) {
		const mesh = lines.parent;
		if (!mesh || !camera) return;
		normalMatrix.getNormalMatrix(mesh.matrixWorld);
		invWorld.copy(mesh.matrixWorld).invert();
		const visible = [];
		let bodyMinScreenX = Infinity;
		let bodyMaxScreenX = -Infinity;

		for (let i = 0; i < manifold.length; i++) {
			const edge = manifold[i];
			worldN0.copy(edge.n0).applyMatrix3(normalMatrix).normalize();
			worldN1.copy(edge.n1).applyMatrix3(normalMatrix).normalize();
			pA.fromBufferAttribute(posAttr, edge.a);
			pB.fromBufferAttribute(posAttr, edge.b);
			wa.copy(pA).applyMatrix4(mesh.matrixWorld);
			wb.copy(pB).applyMatrix4(mesh.matrixWorld);
			mid.addVectors(wa, wb).multiplyScalar(0.5);
			view.subVectors(camera.position, mid);
			if (view.lengthSq() < 1e-12) continue;
			view.normalize();
			const localMidY = (pA.y + pB.y) * 0.5;
			const facing0 = worldN0.dot(view);
			const facing1 = worldN1.dot(view);
			const crossesSilhouette = facing0 * facing1 <= 0;
			const tangentEps = isNPV7 ? SILHOUETTE_TANGENT_EPS * 1.5 : SILHOUETTE_TANGENT_EPS;
			const nearlyTangent =
				Math.min(Math.abs(facing0), Math.abs(facing1)) <=
				tangentEps;
			if (!crossesSilhouette && !nearlyTangent) continue;

			const inBody =
				cleanBody && localMidY >= bodyMinY && localMidY <= bodyMaxY;
			const dxz = Math.hypot(pB.x - pA.x, pB.z - pA.z);
			const dy = Math.abs(pB.y - pA.y);
			const isFloatingTopCap =
				cleanBody &&
				localMidY >= silhouetteBox.min.y + spanY * 0.96 &&
				dy < dxz * 0.25;
			if (isFloatingTopCap) continue;
			let screenX = 0;
			if (inBody) {
				screenX = projected.copy(mid).project(camera).x;
				bodyMinScreenX = Math.min(bodyMinScreenX, screenX);
				bodyMaxScreenX = Math.max(bodyMaxScreenX, screenX);
			}
			visible.push({
				edge: edge,
				inBody: inBody,
				screenX: screenX,
			});
		}

		let write = 0;
		for (let i = 0; i < visible.length; i++) {
			const candidate = visible[i];
			if (candidate.inBody) {
				if (hasStableBodyGuide && bodyRadiusX && bodyRadiusZ) continue;
				const isOuter =
					candidate.screenX <= bodyMinScreenX + 0.0035 ||
					candidate.screenX >= bodyMaxScreenX - 0.0035;
				if (!isOuter) continue;
			}

			const edge = candidate.edge;
			pA.fromBufferAttribute(posAttr, edge.a);
			pB.fromBufferAttribute(posAttr, edge.b);
			wa.copy(pA).applyMatrix4(mesh.matrixWorld);
			wb.copy(pB).applyMatrix4(mesh.matrixWorld);
			mid.addVectors(wa, wb).multiplyScalar(0.5);
			view.subVectors(camera.position, mid);
			if (view.lengthSq() < 1e-12) continue;
			view.normalize();
			wa.addScaledVector(view, EDGE_DEPTH_BIAS);
			wb.addScaledVector(view, EDGE_DEPTH_BIAS);
			pA.copy(wa).applyMatrix4(invWorld);
			pB.copy(wb).applyMatrix4(invWorld);
			linePos[write++] = pA.x;
			linePos[write++] = pA.y;
			linePos[write++] = pA.z;
			linePos[write++] = pB.x;
			linePos[write++] = pB.y;
			linePos[write++] = pB.z;
		}

		if (hasStableBodyGuide && bodyRadiusX && bodyRadiusZ) {
			localCamera.copy(camera.position).applyMatrix4(invWorld);
			let vx = localCamera.x - bodyCenterX;
			let vz = localCamera.z - bodyCenterZ;
			const viewLength = Math.hypot(vx, vz);
			if (viewLength > 1e-9) {
				vx /= viewLength;
				vz /= viewLength;
				const lateralX = -vz;
				const lateralZ = vx;
				const denom = Math.hypot(
					bodyRadiusX * lateralX,
					bodyRadiusZ * lateralZ
				);
				if (denom > 1e-9) {
					const tangentX =
						(bodyRadiusX * bodyRadiusX * lateralX) / denom;
					const tangentZ =
						(bodyRadiusZ * bodyRadiusZ * lateralZ) / denom;
					for (let side = -1; side <= 1; side += 2) {
						pA.set(
							bodyCenterX + tangentX * side,
							bodyMinY,
							bodyCenterZ + tangentZ * side
						);
						pB.set(
							bodyCenterX + tangentX * side,
							bodyMaxY,
							bodyCenterZ + tangentZ * side
						);
						wa.copy(pA).applyMatrix4(mesh.matrixWorld);
						wb.copy(pB).applyMatrix4(mesh.matrixWorld);
						mid.addVectors(wa, wb).multiplyScalar(0.5);
						view.subVectors(camera.position, mid).normalize();
						wa.addScaledVector(view, EDGE_DEPTH_BIAS);
						wb.addScaledVector(view, EDGE_DEPTH_BIAS);
						pA.copy(wa).applyMatrix4(invWorld);
						pB.copy(wb).applyMatrix4(invWorld);
						linePos[write++] = pA.x;
						linePos[write++] = pA.y;
						linePos[write++] = pA.z;
						linePos[write++] = pB.x;
						linePos[write++] = pB.y;
						linePos[write++] = pB.z;
					}
				}
			}
		}

		lineAttr.needsUpdate = true;
		lineGeo.setDrawRange(0, write / 3);
	}

	return { lines: lines, update: update };
}
