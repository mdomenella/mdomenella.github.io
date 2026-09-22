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
		revealGroup(".personal-projects__label", false);
		revealGroup(".personal-project-card", true);
		revealGroup(".project-intro > *", true);
		revealGroup(".project-meta > *", true);
		revealGroup(".project-strip", false);
		revealGroup(".project-section > *", true);
		revealGroup(".project-img-grid img", true);
		revealGroup(".project-pager", false);
	}

	// Work grid cards midpoint scroll reveal (strictly one row active at a time as user scrolls)
	(function initWorkCardScrollReveal() {
		var cards = Array.from(document.querySelectorAll(".work-grid .project-card"));
		if (!cards.length) return;

		var ticking = false;

		function checkCardPositions() {
			var vh = window.innerHeight || document.documentElement.clientHeight;
			var vCenter = vh * 0.5;

			// Group cards by row based on vertical offset
			var rowMap = new Map();
			cards.forEach(function (card) {
				var topKey = Math.round(card.offsetTop / 20) * 20;
				if (!rowMap.has(topKey)) {
					rowMap.set(topKey, []);
				}
				rowMap.get(topKey).push(card);
			});

			var bestRow = null;
			var minDistance = Infinity;

			rowMap.forEach(function (rowCards) {
				var rect = rowCards[0].getBoundingClientRect();
				var rowCenter = rect.top + rect.height * 0.5;
				var dist = Math.abs(rowCenter - vCenter);

				// Only activate when row is within middle 36% zone of the screen
				if (dist < vh * 0.36 && dist < minDistance) {
					minDistance = dist;
					bestRow = rowCards;
				}
			});

			cards.forEach(function (card) {
				if (bestRow && bestRow.indexOf(card) !== -1) {
					card.classList.add("is-scrolled-active");
				} else {
					card.classList.remove("is-scrolled-active");
				}
			});

			ticking = false;
		}

		window.addEventListener("scroll", function () {
			if (!ticking) {
				window.requestAnimationFrame(checkCardPositions);
				ticking = true;
			}
		}, { passive: true });

		window.addEventListener("resize", function () {
			if (!ticking) {
				window.requestAnimationFrame(checkCardPositions);
				ticking = true;
			}
		}, { passive: true });

		checkCardPositions();
	})();

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

		var funnelSvg = funnelSection.querySelector(".project-funnel-svg");
		function updateFunnelViewBox() {
			if (!funnelSvg) return;
			if (window.innerWidth <= 768) {
				funnelSvg.setAttribute("viewBox", "240 40 1220 650");
			} else {
				funnelSvg.setAttribute("viewBox", "0 0 1500 730");
			}
		}
		updateFunnelViewBox();
		window.addEventListener("resize", updateFunnelViewBox, { passive: true });

		var tier1 = funnelSection.querySelector(".funnel-tier--1");
		var leftArrow1 = funnelSection.querySelector(".funnel-left-arrow--1");

		var tier2 = funnelSection.querySelector(".funnel-tier--2");
		var leftArrow2 = funnelSection.querySelector(".funnel-left-arrow--2");
		var callout1 = funnelSection.querySelector(".funnel-callout--1");

		var tier3 = funnelSection.querySelector(".funnel-tier--3");
		var leftArrow3 = funnelSection.querySelector(".funnel-left-arrow--3");
		var callout2 = funnelSection.querySelector(".funnel-callout--2");

		var tier4 = funnelSection.querySelector(".funnel-tier--4");
		var leftArrow4 = funnelSection.querySelector(".funnel-left-arrow--4");
		var callout3 = funnelSection.querySelector(".funnel-callout--3");

		var allElements = [
			tier1, leftArrow1,
			tier2, leftArrow2, callout1,
			tier3, leftArrow3, callout2,
			tier4, leftArrow4, callout3
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

			// Stage 2 (Purple 50% + Left Arrow 2 + Callout 1)
			if (y2 <= triggerLine) {
				if (tier2) tier2.classList.add("is-revealed");
				if (leftArrow2) leftArrow2.classList.add("is-revealed");
				if (callout1) callout1.classList.add("is-revealed");
			}

			// Stage 3 (Blue 17% + Left Arrow 3 + Callout 2)
			if (y3 <= triggerLine) {
				if (tier3) tier3.classList.add("is-revealed");
				if (leftArrow3) leftArrow3.classList.add("is-revealed");
				if (callout2) callout2.classList.add("is-revealed");
			}

			// Stage 4 (Green 7% + Left Arrow 4 + Callout 3)
			if (y4 <= triggerLine) {
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

	/* --------------------------------------------------------------------------
	   Opportunity Matrix Bubbles Sequential Pop-in Animation
	   -------------------------------------------------------------------------- */
	(function initMatrixAnimation() {
		var matrixSection = document.querySelector(".project-matrix-section");
		if (!matrixSection) return;

		var bubbles = [];
		for (var i = 1; i <= 11; i++) {
			var b = matrixSection.querySelector(".matrix-bubble--" + i);
			if (b) bubbles.push(b);
		}

		if (reduceMotion) {
			bubbles.forEach(function (b) {
				b.classList.add("is-revealed");
			});
			return;
		}

		var triggered = false;

		function checkMatrixScroll() {
			if (triggered) return;
			var rect = matrixSection.getBoundingClientRect();
			var vh = window.innerHeight || document.documentElement.clientHeight;

			// Trigger later: when matrix chart is well within view (~45-50% up into viewport)
			if (rect.top <= vh * 0.55) {
				triggered = true;
				// Initial delay of 400ms after entering view, then deliberate 140ms stagger between bubbles
				bubbles.forEach(function (b, index) {
					setTimeout(function () {
						b.classList.add("is-revealed");
					}, 400 + index * 140);
				});
				window.removeEventListener("scroll", checkMatrixScroll);
				window.removeEventListener("resize", checkMatrixScroll);
			}
		}

		window.addEventListener("scroll", checkMatrixScroll, { passive: true });
		window.addEventListener("resize", checkMatrixScroll, { passive: true });
		checkMatrixScroll();
	})();

	/* --------------------------------------------------------------------------
	   APP Role Venn Diagram Cyclic Animation (Independent <-> Novel Clinic)
	   -------------------------------------------------------------------------- */
	(function initAppVennAnimation() {
		var vennContainer = document.querySelector(".project-app-venn");
		if (!vennContainer) return;

		if (reduceMotion) return;

		var isNovel = false;
		setInterval(function () {
			isNovel = !isNovel;
			if (isNovel) {
				vennContainer.classList.add("is-novel");
			} else {
				vennContainer.classList.remove("is-novel");
			}
		}, 3800);
	})();

	/* --------------------------------------------------------------------------
	   Clinical Responsibility Matrix Sticky Scroll Stages
	   -------------------------------------------------------------------------- */
	(function initMatrixStickyScroll() {
		var stickySection = document.querySelector(".project-matrix-sticky-section");
		if (!stickySection) return;

		var currentStage = 0;

		function updateStickyStage() {
			var rect = stickySection.getBoundingClientRect();
			var windowHeight = window.innerHeight;
			var totalScrollable = rect.height - windowHeight;

			if (totalScrollable <= 0) return;

			var progress = -rect.top / totalScrollable;

			var newStage = 0;
			if (progress >= 0.62) {
				newStage = 2;
			} else if (progress >= 0.28) {
				newStage = 1;
			}

			if (newStage !== currentStage) {
				currentStage = newStage;
				stickySection.setAttribute("data-stage", currentStage.toString());
			}
		}

		window.addEventListener("scroll", updateStickyStage, { passive: true });
		window.addEventListener("resize", updateStickyStage, { passive: true });
		updateStickyStage();
	})();

	/* --------------------------------------------------------------------------
	   Opportunity Landscape Matrix Interactive Tooltips
	   -------------------------------------------------------------------------- */
	(function initOpportunityMatrixTooltips() {
		var bubbles = document.querySelectorAll(".project-matrix-svg .matrix-bubble[data-opportunity]");
		if (!bubbles.length) return;

		bubbles.forEach(function (bubble) {
			var oppId = bubble.getAttribute("data-opportunity");
			var tooltip = document.querySelector(".matrix-opportunity-tooltip--" + oppId);
			if (!tooltip) return;

			function showTooltip() {
				tooltip.classList.add("is-active");
			}

			function hideTooltip() {
				tooltip.classList.remove("is-active");
			}

			bubble.addEventListener("mouseenter", showTooltip);
			bubble.addEventListener("mouseleave", hideTooltip);
			bubble.addEventListener("focus", showTooltip);
			bubble.addEventListener("blur", hideTooltip);
			bubble.addEventListener("touchstart", function (e) {
				var wasActive = tooltip.classList.contains("is-active");
				document.querySelectorAll(".matrix-opportunity-tooltip").forEach(function (t) {
					t.classList.remove("is-active");
				});
				if (!wasActive) {
					tooltip.classList.add("is-active");
				}
			}, { passive: true });
		});

		document.addEventListener("touchstart", function (e) {
			if (!e.target.closest(".matrix-bubble[data-opportunity]")) {
				document.querySelectorAll(".matrix-opportunity-tooltip").forEach(function (t) {
					t.classList.remove("is-active");
				});
			}
		}, { passive: true });
	})();

	/* --------------------------------------------------------------------------
	   Interactive Experience Timeline (Chronological Axis Highlight)
	   -------------------------------------------------------------------------- */
	(function initTimelineInteractivity() {
		var timeline = document.querySelector(".timeline-section");
		if (!timeline) return;

		var nodes = timeline.querySelectorAll(".timeline-node");
		var highlight = timeline.querySelector("#timeline-highlight");
		var brackets = timeline.querySelectorAll(".timeline-bracket");

		function activateNode(node) {
			if (!node) return;
			var isMobile = window.innerWidth <= 768;
			var nodeIndex = Array.prototype.indexOf.call(nodes, node);

			if (highlight) {
				if (isMobile) {
					var vMap = {
						"0": { top: "0%", height: "35%" },   // ND BS (2019-2023)
						"1": { top: "35%", height: "30%" },  // Clippard (2023-2025)
						"2": { top: "65%", height: "35%" },  // MS EDI (2025-2027)
						"3": { top: "24%", height: "6%" },   // Yaskawa (2022)
						"4": { top: "62%", height: "8%" },   // P&G (2025)
						"5": { top: "79%", height: "8%" },   // Needfinding (2026)
						"6": { top: "88%", height: "8%" }    // Klein Tools (2026)
					};
					var vInfo = vMap[String(nodeIndex)] || { top: "0%", height: "10%" };
					highlight.style.top = vInfo.top;
					highlight.style.height = vInfo.height;
					highlight.style.left = "-1px";
					highlight.style.width = "4px";
				} else {
					var left = node.getAttribute("data-left");
					var width = node.getAttribute("data-width");
					if (left && width) {
						highlight.style.left = left;
						highlight.style.width = width;
						highlight.style.top = "-1px";
						highlight.style.height = "4px";
					}
				}
				highlight.classList.add("is-active");
			}

			// Activate corresponding bracket if present
			brackets.forEach(function (b) {
				if (parseInt(b.getAttribute("data-node"), 10) === nodeIndex) {
					b.classList.add("is-active");
				}
			});
		}

		function deactivateNode() {
			if (highlight) {
				highlight.classList.remove("is-active");
			}
			brackets.forEach(function (b) {
				b.classList.remove("is-active");
			});
		}

		brackets.forEach(function (bracket) {
			var targetIdx = parseInt(bracket.getAttribute("data-node"), 10);
			var targetNode = nodes[targetIdx];
			if (!targetNode) return;

			bracket.addEventListener("mouseenter", function () {
				targetNode.classList.add("is-active");
				activateNode(targetNode);
			});
			bracket.addEventListener("mouseleave", function () {
				targetNode.classList.remove("is-active");
				deactivateNode();
			});
		});

		nodes.forEach(function (node) {
			node.addEventListener("mouseenter", function () {
				activateNode(node);
			});

			node.addEventListener("mouseleave", function () {
				deactivateNode();
			});

			node.addEventListener("focus", function () {
				activateNode(node);
			});

			node.addEventListener("blur", function () {
				deactivateNode();
			});
		});

		// Mobile-only: double-tap / tap-twice navigation for project links in timeline
		var lastClickedLink = null;
		var lastClickTime = 0;

		var linkElements = timeline.querySelectorAll("a.timeline-node, a.timeline-bracket");
		linkElements.forEach(function (link) {
			link.addEventListener("click", function (e) {
				var isMobile = window.innerWidth <= 768;
				if (!isMobile) {
					// Desktop: normal single-click navigation directly to href
					return;
				}

				// Mobile-only: Tap once to preview bubble & highlight, tap again / double-tap to navigate
				var now = Date.now();
				var isRapidDbl = (lastClickedLink === link && (now - lastClickTime) < 550);
				var targetNode = link.classList.contains("timeline-node") 
					? link 
					: nodes[parseInt(link.getAttribute("data-node"), 10)];
				var wasAlreadyActive = targetNode ? targetNode.classList.contains("is-active") : false;

				if (isRapidDbl || wasAlreadyActive) {
					// Double-tap / second tap while active: navigate to project page
					lastClickedLink = null;
					lastClickTime = 0;
					var href = link.getAttribute("href");
					if (href) {
						window.location.href = href;
					}
				} else {
					// First tap on mobile: prevent immediate jump, activate card & show highlights
					e.preventDefault();
					lastClickedLink = link;
					lastClickTime = now;

					nodes.forEach(function (n) { n.classList.remove("is-active"); });
					if (targetNode) {
						targetNode.classList.add("is-active");
						activateNode(targetNode);
					}
				}
			});
		});

		// Non-link nodes tap/click support (mobile tap to inspect)
		nodes.forEach(function (node) {
			if (!node.matches("a.timeline-node")) {
				node.addEventListener("click", function (e) {
					if (window.innerWidth > 768) return;
					var wasActive = node.classList.contains("is-active");
					nodes.forEach(function (n) { n.classList.remove("is-active"); });
					if (!wasActive) {
						node.classList.add("is-active");
						activateNode(node);
					} else {
						deactivateNode();
					}
				});
			}
		});

		function clearTimelineSelection() {
			nodes.forEach(function (n) { n.classList.remove("is-active"); });
			deactivateNode();
			lastClickedLink = null;
			lastClickTime = 0;
		}

		// Mobile: dismiss bubble and highlight when tapping anywhere outside the active experience node
		document.addEventListener("click", function (e) {
			if (window.innerWidth <= 768 && !e.target.closest(".timeline-node, .timeline-bracket")) {
				clearTimelineSelection();
			}
		});

		document.addEventListener("touchstart", function (e) {
			if (window.innerWidth <= 768 && !e.target.closest(".timeline-node, .timeline-bracket")) {
				clearTimelineSelection();
			}
		}, { passive: true });

		// Scroll trigger for intro animation (line draws -> ticks pop -> nodes pop left-to-right)
		if ("IntersectionObserver" in window) {
			var observer = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						timeline.classList.add("is-visible");
						observer.unobserve(timeline);
					}
				});
			}, { threshold: 0.45, rootMargin: "0px 0px -15% 0px" });
			observer.observe(timeline);
		} else {
			timeline.classList.add("is-visible");
		}
	})();

	/* --------------------------------------------------------------------------
	   Personal Project Video Card Hover Playback
	   -------------------------------------------------------------------------- */
	(function initVideoCardHover() {
		var videoCards = document.querySelectorAll(".personal-project-card--video");
		if (!videoCards.length) return;

		videoCards.forEach(function (card) {
			var video = card.querySelector(".personal-project-card__video");
			if (!video) return;

			function playVideo() {
				card.classList.add("is-video-active");
				try {
					var playPromise = video.play();
					if (playPromise !== undefined) {
						playPromise.catch(function () {});
					}
				} catch (e) {}
			}

			function pauseVideo() {
				card.classList.remove("is-video-active");
				try {
					video.pause();
					video.currentTime = 0;
				} catch (e) {}
			}

			card.addEventListener("mouseenter", playVideo);
			card.addEventListener("mouseleave", pauseVideo);
			card.addEventListener("focus", playVideo);
			card.addEventListener("blur", pauseVideo);
			card.addEventListener("touchstart", function () {
				if (video.paused) {
					playVideo();
				} else {
					pauseVideo();
				}
			}, { passive: true });
		});
	})();

	/* --------------------------------------------------------------------------
	   Personal Project Film Photography Card Shuffle on Hover (~2s)
	   -------------------------------------------------------------------------- */
	(function initPhotoCardShuffle() {
		var shuffleCard = document.querySelector(".personal-project-card--photo-shuffle");
		if (!shuffleCard) return;

		var coverImg = shuffleCard.querySelector(".personal-project-card__cover");
		var crossfadeImg = shuffleCard.querySelector(".personal-project-card__crossfade");
		if (!coverImg || !crossfadeImg) return;

		var defaultSrc = coverImg.src;
		var photoPool = [
			"images/film%20photos/web/cub.jpg",
			"images/film%20photos/web/halfdome.JPG",
			"images/film%20photos/web/1626md-5457.jpeg",
			"images/film%20photos/web/cloud%20lake2.JPG",
			"images/film%20photos/web/IMG_2122.jpeg",
			"images/film%20photos/web/reflection.JPG",
			"images/film%20photos/web/reds.JPG",
			"images/film%20photos/web/---_0326.jpg",
			"images/film%20photos/web/---_0356.jpg",
			"images/film%20photos/web/---_0371.jpg",
			"images/film%20photos/web/---_0456.jpg",
			"images/film%20photos/web/---_0464.jpg",
			"images/film%20photos/web/---_0497.jpg",
			"images/film%20photos/web/---_0498.jpg",
			"images/film%20photos/web/---_0499.jpg",
			"images/film%20photos/web/---_0501.jpg",
			"images/film%20photos/web/000068810009_Original.jpeg",
			"images/film%20photos/web/1626md-5472.jpeg",
			"images/film%20photos/web/1626md-5474.jpeg",
			"images/film%20photos/web/1626md-5484.jpeg",
			"images/film%20photos/web/1626md-5540.jpeg",
			"images/film%20photos/web/1626md-5555.jpeg",
			"images/film%20photos/web/1626md-5556.jpeg",
			"images/film%20photos/web/IMG_1713.JPG",
			"images/film%20photos/web/IMG_1727.JPG",
			"images/film%20photos/web/IMG_1759.JPG",
			"images/film%20photos/web/IMG_3785.JPG",
			"images/film%20photos/web/IMG_3795.JPG",
			"images/film%20photos/web/IMG_3800.JPG",
			"images/film%20photos/web/IMG_3826.JPG",
			"images/film%20photos/web/IMG_3834.JPG",
			"images/film%20photos/web/IMG_3835.JPG",
			"images/film%20photos/web/IMG_3847.JPG",
			"images/film%20photos/web/IMG_3862.JPG",
			"images/film%20photos/web/IMG_3865.JPG",
			"images/film%20photos/web/IMG_3878.JPG",
			"images/film%20photos/web/IMG_3883.JPG",
			"images/film%20photos/web/IMG_3953.JPG",
			"images/film%20photos/web/IMG_3958.JPG",
			"images/film%20photos/web/IMG_3962.JPG",
			"images/film%20photos/web/IMG_3986.JPG",
			"images/film%20photos/web/IMG_3995.JPG",
			"images/film%20photos/web/md4126-6609.jpeg",
			"images/film%20photos/web/md4126-6611.jpeg",
			"images/film%20photos/web/md4126-6619.jpeg",
			"images/film%20photos/web/md4126-6645.jpeg",
			"images/film%20photos/web/md4126-6656.jpeg",
			"images/film%20photos/web/md4126-6681.jpeg",
			"images/film%20photos/web/md4126-6685.jpeg",
			"images/film%20photos/web/md4126-6690.jpeg"
		];

		// Preload first batch of photos
		photoPool.slice(0, 10).forEach(function (src) {
			var img = new Image();
			img.src = src;
		});

		var shuffleTimer = null;
		var lastIdx = -1;
		var isHovering = false;

		function shuffleNext() {
			if (!isHovering) return;
			var randIdx;
			do {
				randIdx = Math.floor(Math.random() * photoPool.length);
			} while (randIdx === lastIdx && photoPool.length > 1);
			lastIdx = randIdx;

			var nextSrc = photoPool[randIdx];
			var preloader = new Image();
			preloader.onload = function () {
				if (!isHovering) return;
				crossfadeImg.src = nextSrc;
				crossfadeImg.classList.add("is-active");

				setTimeout(function () {
					if (!isHovering) return;
					coverImg.src = nextSrc;
					crossfadeImg.classList.remove("is-active");
				}, 460);
			};
			preloader.src = nextSrc;
		}

		function startShuffle() {
			isHovering = true;
			if (shuffleTimer) clearInterval(shuffleTimer);
			shuffleTimer = setInterval(shuffleNext, 2000);
		}

		function stopShuffle() {
			isHovering = false;
			if (shuffleTimer) {
				clearInterval(shuffleTimer);
				shuffleTimer = null;
			}
			crossfadeImg.classList.remove("is-active");
			setTimeout(function () {
				if (!isHovering) {
					coverImg.src = defaultSrc;
				}
			}, 300);
		}

		shuffleCard.addEventListener("mouseenter", startShuffle);
		shuffleCard.addEventListener("mouseleave", stopShuffle);
		shuffleCard.addEventListener("focus", startShuffle);
		shuffleCard.addEventListener("blur", stopShuffle);
		shuffleCard.addEventListener("touchstart", function () {
			if (!isHovering) {
				startShuffle();
			} else {
				stopShuffle();
			}
		}, { passive: true });
	})();

	/* --------------------------------------------------------------------------
	   Film Photography Gallery Lightbox
	   -------------------------------------------------------------------------- */
	(function initPhotoLightbox() {
		var galleryItems = document.querySelectorAll(".photo-gallery-item img");
		if (!galleryItems.length) return;

		var lightbox = document.createElement("div");
		lightbox.className = "photo-lightbox";
		lightbox.setAttribute("role", "dialog");
		lightbox.setAttribute("aria-label", "Image Preview");
		lightbox.innerHTML = '<div class="photo-lightbox__content">' +
			'<img class="photo-lightbox__img" src="" alt="Fullscreen photo preview" />' +
			'</div>' +
			'<button class="photo-lightbox__close" type="button" aria-label="Close preview">&times;</button>' +
			'<button class="photo-lightbox__nav photo-lightbox__nav--prev" type="button" aria-label="Previous photo">&#8249;</button>' +
			'<button class="photo-lightbox__nav photo-lightbox__nav--next" type="button" aria-label="Next photo">&#8250;</button>';
		document.body.appendChild(lightbox);

		var imgEl = lightbox.querySelector(".photo-lightbox__img");
		var closeBtn = lightbox.querySelector(".photo-lightbox__close");
		var prevBtn = lightbox.querySelector(".photo-lightbox__nav--prev");
		var nextBtn = lightbox.querySelector(".photo-lightbox__nav--next");
		var currentIndex = 0;

		var photoList = Array.from(galleryItems);

		function showPhoto(index) {
			if (index < 0) index = photoList.length - 1;
			if (index >= photoList.length) index = 0;
			currentIndex = index;
			var targetImg = photoList[currentIndex];
			imgEl.src = targetImg.src;
			imgEl.alt = targetImg.alt || "Film photo";
		}

		function openLightbox(index) {
			showPhoto(index);
			lightbox.classList.add("is-open");
			document.body.style.overflow = "hidden";
		}

		function closeLightbox() {
			lightbox.classList.remove("is-open");
			document.body.style.overflow = "";
		}

		photoList.forEach(function (img, idx) {
			img.closest(".photo-gallery-item").addEventListener("click", function () {
				openLightbox(idx);
			});
		});

		closeBtn.addEventListener("click", closeLightbox);
		lightbox.addEventListener("click", function (e) {
			if (e.target === lightbox) {
				closeLightbox();
			}
		});

		prevBtn.addEventListener("click", function (e) {
			e.stopPropagation();
			showPhoto(currentIndex - 1);
		});

		nextBtn.addEventListener("click", function (e) {
			e.stopPropagation();
			showPhoto(currentIndex + 1);
		});

		document.addEventListener("keydown", function (e) {
			if (!lightbox.classList.contains("is-open")) return;
			if (e.key === "Escape") {
				closeLightbox();
			} else if (e.key === "ArrowLeft") {
				showPhoto(currentIndex - 1);
			} else if (e.key === "ArrowRight") {
				showPhoto(currentIndex + 1);
			}
		});
	})();

	/* --------------------------------------------------------------------------
	   Film Photography Gallery Fluid Dynamic Hover Magnification & Push Physics
	   -------------------------------------------------------------------------- */
	(function initPhotoGalleryHoverPhysics() {
		var gallery = document.querySelector(".photo-gallery-grid");
		if (!gallery) return;
		if (!window.matchMedia("(hover: hover)").matches) return;

		var items = Array.from(gallery.querySelectorAll(".photo-gallery-item"));
		if (!items.length) return;

		var rafId = null;

		function getCenter(el) {
			var rect = el.getBoundingClientRect();
			return {
				x: rect.left + rect.width / 2,
				y: rect.top + rect.height / 2
			};
		}

		function applyPush(activeItem) {
			var hCenter = getCenter(activeItem);
			var radius = Math.min(window.innerWidth * 0.5, 600);
			var maxPush = 45; // pixels to push adjacent images away

			items.forEach(function (item) {
				if (item === activeItem) {
					item.classList.add("is-hovered");
					item.classList.remove("is-pushed");
					item.style.setProperty("--push-x", "0px");
					item.style.setProperty("--push-y", "0px");
					item.style.setProperty("--push-scale", "1");
					return;
				}

				item.classList.remove("is-hovered");
				var iCenter = getCenter(item);
				var dx = iCenter.x - hCenter.x;
				var dy = iCenter.y - hCenter.y;
				var dist = Math.sqrt(dx * dx + dy * dy);

				if (dist > 0 && dist < radius) {
					var factor = Math.pow(1 - dist / radius, 1.3);
					var pushX = (dx / dist) * maxPush * factor;
					var pushY = (dy / dist) * maxPush * factor;
					var pushScale = 1 - 0.06 * factor;

					item.classList.add("is-pushed");
					item.style.setProperty("--push-x", pushX.toFixed(2) + "px");
					item.style.setProperty("--push-y", pushY.toFixed(2) + "px");
					item.style.setProperty("--push-scale", pushScale.toFixed(3));
				} else {
					item.classList.remove("is-pushed");
					item.style.setProperty("--push-x", "0px");
					item.style.setProperty("--push-y", "0px");
					item.style.setProperty("--push-scale", "1");
				}
			});
		}

		function clearPush() {
			items.forEach(function (item) {
				item.classList.remove("is-hovered");
				item.classList.remove("is-pushed");
				item.style.setProperty("--push-x", "0px");
				item.style.setProperty("--push-y", "0px");
				item.style.setProperty("--push-scale", "1");
			});
		}

		items.forEach(function (item) {
			item.addEventListener("mouseenter", function () {
				if (document.body.style.overflow === "hidden") return; // lightbox is open
				if (rafId) cancelAnimationFrame(rafId);
				rafId = requestAnimationFrame(function () {
					applyPush(item);
				});
			});
		});

		gallery.addEventListener("mouseleave", function () {
			if (rafId) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(clearPush);
		});
	})();

	/* --------------------------------------------------------------------------
	   NPV7 Failure Analysis Animated Mind Map Scroll Observer
	   -------------------------------------------------------------------------- */
	(function initMindMapAnimation() {
		var mindmaps = document.querySelectorAll(".npv7-mindmap-wrap");
		if (!mindmaps.length) return;

		var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		if (reduceMotion) {
			mindmaps.forEach(function (mm) { mm.classList.add("is-visible"); });
			return;
		}

		if ("IntersectionObserver" in window) {
			var observer = new IntersectionObserver(function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						entry.target.classList.add("is-visible");
						observer.unobserve(entry.target);
					}
				});
			}, { threshold: 0.22, rootMargin: "0px 0px -8% 0px" });

			mindmaps.forEach(function (mm) {
				observer.observe(mm);
			});
		} else {
			mindmaps.forEach(function (mm) { mm.classList.add("is-visible"); });
		}
	})();

	/* --------------------------------------------------------------------------
	   Oxygen Mixing Blender 3-Phase Pneumatic Circuit Animation Controller
	   -------------------------------------------------------------------------- */
	(function initPneumaticCircuitAnimation() {
		var wraps = document.querySelectorAll(".pneumatic-circuit-wrap");
		if (!wraps.length) return;

		wraps.forEach(function (wrap) {
			var currentPhase = 1;
			var cycleTimer = null;
			var phaseDuration = 4200; // 4.2s per phase for clean flow observation

			function setPhase(phaseNum) {
				currentPhase = parseInt(phaseNum, 10);
				wrap.setAttribute("data-phase", String(currentPhase));
			}

			function nextPhase() {
				var next = currentPhase >= 3 ? 1 : currentPhase + 1;
				setPhase(next);
			}

			function startCycle() {
				stopCycle();
				cycleTimer = setInterval(nextPhase, phaseDuration);
			}

			function stopCycle() {
				if (cycleTimer) {
					clearInterval(cycleTimer);
					cycleTimer = null;
				}
			}

			// Start cycle when scrolled into view
			if ("IntersectionObserver" in window) {
				var observer = new IntersectionObserver(function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							startCycle();
						} else {
							stopCycle();
						}
					});
				}, { threshold: 0.15 });
				observer.observe(wrap);
			} else {
				startCycle();
			}
		});
	})();
})();

