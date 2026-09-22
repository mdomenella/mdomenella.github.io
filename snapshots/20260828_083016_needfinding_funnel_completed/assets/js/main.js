(function () {
	const header = document.getElementById("header");
	const navToggle = document.querySelector(".nav-toggle");
	const mobileNav = document.getElementById("mobile-nav");
	const accordionItems = document.querySelectorAll(".accordion__item");

	function closeMobileNav() {
		if (!mobileNav || !navToggle) return;
		mobileNav.classList.remove("is-open");
		navToggle.setAttribute("aria-expanded", "false");
		navToggle.setAttribute("aria-label", "Open menu");
	}

	if (navToggle && mobileNav) {
		navToggle.addEventListener("click", function () {
			const isOpen = mobileNav.classList.toggle("is-open");
			navToggle.setAttribute("aria-expanded", String(isOpen));
			navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
		});

		mobileNav.querySelectorAll("a").forEach(function (link) {
			link.addEventListener("click", closeMobileNav);
		});
	}

	document.querySelectorAll('a[href^="#"]').forEach(function (link) {
		link.addEventListener("click", function (event) {
			const targetId = link.getAttribute("href");
			if (!targetId || targetId === "#") return;

			const target = document.querySelector(targetId);
			if (!target) return;

			event.preventDefault();
			closeMobileNav();
			target.scrollIntoView({ behavior: "smooth", block: "start" });
			history.pushState(null, "", targetId);
		});
	});

	accordionItems.forEach(function (item) {
		const trigger = item.querySelector(".accordion__trigger");
		const panel = item.querySelector(".accordion__panel");
		if (!trigger || !panel) return;

		trigger.addEventListener("click", function () {
			const isOpen = item.classList.contains("is-open");

			accordionItems.forEach(function (otherItem) {
				const otherTrigger = otherItem.querySelector(".accordion__trigger");
				const otherPanel = otherItem.querySelector(".accordion__panel");
				if (!otherTrigger || !otherPanel) return;

				otherItem.classList.remove("is-open");
				otherTrigger.setAttribute("aria-expanded", "false");
				otherPanel.hidden = true;
			});

			if (!isOpen) {
				item.classList.add("is-open");
				trigger.setAttribute("aria-expanded", "true");
				panel.hidden = false;
			}
		});
	});

	window.addEventListener("scroll", function () {
		if (!header) return;
		header.classList.toggle("is-scrolled", window.scrollY > 12);
	}, { passive: true });

	// Scroll reveal: fade elements up into view as they enter the viewport.
	const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (!reduceMotion && "IntersectionObserver" in window) {
		const observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add("is-visible");
					observer.unobserve(entry.target);
				}
			});
		}, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

		function revealGroup(selector, stagger) {
			document.querySelectorAll(selector).forEach(function (el, i) {
				el.classList.add("reveal");
				if (stagger) {
					el.style.transitionDelay = (i % 6) * 70 + "ms";
				}
				observer.observe(el);
			});
		}

		revealGroup(".hero__content", false);
		revealGroup(".work-grid .project-card", true);
		revealGroup(".bio__card", false);
		revealGroup(".bio__photo", false);
		revealGroup(".experience__label", false);
		revealGroup(".accordion__item", true);
		revealGroup(".gallery__item", true);
		revealGroup(".project-intro > *", true);
		revealGroup(".project-meta > *", true);
		revealGroup(".project-strip", false);
		revealGroup(".project-section > *", true);
		revealGroup(".project-img-grid img", true);
		revealGroup(".project-pager", false);
	}

	// Highlight wipe: grow background left → right when marks enter view.
	(function initHighlightWipe() {
		var marks = document.querySelectorAll(".project-highlight");
		if (!marks.length) return;

		if (reduceMotion || !("IntersectionObserver" in window)) {
			marks.forEach(function (mark) {
				mark.classList.add("is-lit");
			});
			return;
		}

		var highlightObserver = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				var mark = entry.target;
				var siblings = mark.parentElement
					? mark.parentElement.querySelectorAll(".project-highlight")
					: [];
				var index = Array.prototype.indexOf.call(siblings, mark);
				if (index < 0) index = 0;
				/* Start after the intro fade-up so the wipe is visible. */
				mark.style.transitionDelay = 480 + index * 160 + "ms";
				mark.classList.add("is-lit");
				highlightObserver.unobserve(mark);
			});
		}, { threshold: 0.4, rootMargin: "0px 0px -8% 0px" });

		marks.forEach(function (mark) {
			highlightObserver.observe(mark);
		});
	})();

	// Horizontal product strip (prev / next) on project pages that include one.
	document.querySelectorAll(".project-strip").forEach(function (strip) {
		var track = strip.querySelector(".project-strip__track");
		var prev = strip.querySelector(".project-strip__btn--prev");
		var next = strip.querySelector(".project-strip__btn--next");
		if (!track) return;

		function scrollByPage(direction) {
			var amount = Math.max(track.clientWidth * 0.75, 240);
			track.scrollBy({ left: direction * amount, behavior: "smooth" });
		}

		if (prev) {
			prev.addEventListener("click", function () {
				scrollByPage(-1);
			});
		}
		if (next) {
			next.addEventListener("click", function () {
				scrollByPage(1);
			});
		}
	});

	// Patient Loss Funnel Diagram Scroll-Position-Based Piece-by-Piece Reveal
	(function initFunnelScrollScrub() {
		var funnelSection = document.querySelector(".project-funnel-section");
		if (!funnelSection) return;

		var tier1 = funnelSection.querySelector(".funnel-tier--1");
		var leftArrow1 = funnelSection.querySelector(".funnel-left-arrow--1");

		var arrow1 = funnelSection.querySelector(".funnel-arrow--1");
		var tier2 = funnelSection.querySelector(".funnel-tier--2");
		var leftArrow2 = funnelSection.querySelector(".funnel-left-arrow--2");
		var callout1 = funnelSection.querySelector(".funnel-callout--1");

		var arrow2 = funnelSection.querySelector(".funnel-arrow--2");
		var tier3 = funnelSection.querySelector(".funnel-tier--3");
		var leftArrow3 = funnelSection.querySelector(".funnel-left-arrow--3");
		var callout2 = funnelSection.querySelector(".funnel-callout--2");

		var arrow3 = funnelSection.querySelector(".funnel-arrow--3");
		var tier4 = funnelSection.querySelector(".funnel-tier--4");
		var leftArrow4 = funnelSection.querySelector(".funnel-left-arrow--4");
		var callout3 = funnelSection.querySelector(".funnel-callout--3");

		var allElements = [
			tier1, leftArrow1,
			arrow1, tier2, leftArrow2, callout1,
			arrow2, tier3, leftArrow3, callout2,
			arrow3, tier4, leftArrow4, callout3
		];

		if (reduceMotion) {
			allElements.forEach(function (el) {
				if (el) el.classList.add("is-revealed");
			});
			return;
		}

		var ticking = false;

		function updateOnScroll() {
			var svg = funnelSection.querySelector(".project-funnel-svg") || funnelSection;
			var rect = svg.getBoundingClientRect();
			var vh = window.innerHeight || document.documentElement.clientHeight;

			// Trigger line: ~32% up from the bottom of the screen (in plain view)
			var triggerLine = vh * 0.68;

			// Exact Y position of each tier on screen
			var y1 = rect.top + rect.height * 0.18; // Pink Tier 1
			var y2 = rect.top + rect.height * 0.42; // Purple Tier 2
			var y3 = rect.top + rect.height * 0.63; // Blue Tier 3
			var y4 = rect.top + rect.height * 0.82; // Green Tier 4

			// Stage 1 (Pink 100% + Left Arrow 1)
			if (y1 <= triggerLine) {
				if (tier1) tier1.classList.add("is-revealed");
				if (leftArrow1) leftArrow1.classList.add("is-revealed");
			}

			// Stage 2 (Purple 50% + Center Arrow 1 + Left Arrow 2 + Callout 1)
			if (y2 <= triggerLine) {
				if (arrow1) arrow1.classList.add("is-revealed");
				if (tier2) tier2.classList.add("is-revealed");
				if (leftArrow2) leftArrow2.classList.add("is-revealed");
				if (callout1) callout1.classList.add("is-revealed");
			}

			// Stage 3 (Blue 17% + Center Arrow 2 + Left Arrow 3 + Callout 2)
			if (y3 <= triggerLine) {
				if (arrow2) arrow2.classList.add("is-revealed");
				if (tier3) tier3.classList.add("is-revealed");
				if (leftArrow3) leftArrow3.classList.add("is-revealed");
				if (callout2) callout2.classList.add("is-revealed");
			}

			// Stage 4 (Green 7% + Center Arrow 3 + Left Arrow 4 + Callout 3)
			if (y4 <= triggerLine) {
				if (arrow3) arrow3.classList.add("is-revealed");
				if (tier4) tier4.classList.add("is-revealed");
				if (leftArrow4) leftArrow4.classList.add("is-revealed");
				if (callout3) callout3.classList.add("is-revealed");
			}

			ticking = false;
		}

		function onScroll() {
			if (!ticking) {
				requestAnimationFrame(updateOnScroll);
				ticking = true;
			}
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });
		updateOnScroll();
	})();
})();

